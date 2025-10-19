import pino, {Logger} from 'pino';
import {cfg} from '../config/settings.config';
import {v4 as uuid} from 'uuid';
import {CallStackInterface} from '../interfaces/call-stack.interface';
import {LogLevelEnum} from '../enums/log-level.enum';
import {Writable} from 'stream';
import {WriteStream} from 'fs';
import {buildRootPath} from '../helpers/system.helper';
import {EOL} from 'os';
import pinoPretty from 'pino-pretty';
import moment from 'moment';
import LogDataEntity from '../entities/log-data.entity';
import nodemailer from 'nodemailer';
import {lang} from '../config/i18n-setup.config';
import FileStreamRotator from 'file-stream-rotator';
import dataSource from '../config/data-source.config';
import {LogCategoryEnum} from '../enums/log-category.enum';

export function getLogLevel(level: number): LogLevelEnum {
    switch (level) {
        case 10:
            return LogLevelEnum.TRACE;
        case 20:
            return LogLevelEnum.DEBUG;
        case 30:
            return LogLevelEnum.INFO;
        case 40:
            return LogLevelEnum.WARN;
        case 50:
            return LogLevelEnum.ERROR;
        case 60:
            return LogLevelEnum.FATAL;
        default:
            throw new Error(`Unknown log level: ${level}`);
    }
}

function formatCallStack(stack: string, filtersForCallStack: string[] = []): CallStackInterface {
    const result: CallStackInterface = {
        file: 'Unknown file',
        line: 0,
        function: 'Unknown function',
        trace: [],
    };

    const combinedFilters = [...filtersForCallStack, '/node_modules', 'internal/modules'];

    let [, ...stackArray]: string[] = stack.split('\n').map(line => line.trim()); // The first line from the call stack is removed

    stackArray = stackArray.filter((item) => {
        // Check if the item contains any of the words in combinedFilters
        return !combinedFilters.some((word) => item.includes(word));
    });

    if (stackArray.length > 0) {
        const match = stackArray[0].match(/at (?:([^ ]+) )?\(?(.+):(\d+):(\d+)\)?/);

        if (match) {
            const [, functionName = '<anonymous>', filePath, line] = match;

            result.file = filePath;
            result.line = parseInt(line, 10) || 0;
            result.function = functionName;
            result.trace = stackArray;
        } else {
            result.trace = stackArray;
        }
    }

    return result;
}

export class LogStream extends Writable {
    private fileStreams: Record<string, any> = {};
    private fileStreamTimeouts: Record<string, NodeJS.Timeout> = {};

    private getFileStream(level: LogLevelEnum): WriteStream {
        if (!this.fileStreams[level]) {
            this.fileStreams[level] = FileStreamRotator.getStream({
                filename: buildRootPath('logs', `%DATE%-${level}.log`),
                frequency: 'daily', // Rotate logs daily
                // max_logs: '14d', // Keep logs for 14 days
                date_format: 'YYYY-MM-DD',
            });
        }

        // Reset timeout to keep the stream alive
        if (this.fileStreamTimeouts[level]) {
            clearTimeout(this.fileStreamTimeouts[level]);
        }

        // Close after 5 minutes of inactivity
        this.fileStreamTimeouts[level] = setTimeout(() => {
            this.fileStreams[level].end();
            delete this.fileStreams[level];
            delete this.fileStreamTimeouts[level];
        }, 5 * 60 * 1000);

        return this.fileStreams[level];
    }

    public async closeFileStreams() {
        await Promise.all(
            Object.values(this.fileStreams).map((stream) => {
                return new Promise((resolve) => stream.end(resolve));
            })
        );

        this.fileStreams = {};
    }

    private writeToFile(logLevel: LogLevelEnum, log: any) {
        if (log.destinations.includes('file')) {
            return;
        }

        const clonedLog = JSON.parse(JSON.stringify(log));

        clonedLog.time = moment(log.time).format('HH:mm:ss Z');

        delete clonedLog?.destinations; // Destinations were added to track log channels
        delete clonedLog.level;

        if (clonedLog.context?.debugStack?.trace) {
            delete clonedLog.context.debugStack.trace;
        }

        // Reorder properties
        const {time, msg, ...orderedLog} = clonedLog;

        log.destinations.push('email');

        // Mark log as sent
        log.destinations.push('file');

        this.getFileStream(logLevel).write(JSON.stringify({time, msg, ...orderedLog}) + EOL);
    }

    private writeToDatabase(logLevel: LogLevelEnum, log: any) {
        if (log.destinations.includes('database')) {
            return;
        }

        const clonedLog = JSON.parse(JSON.stringify(log));

        const logData = new LogDataEntity();
        logData.pid = clonedLog.pid;
        logData.category = clonedLog.category ?? 'n/a';
        logData.level = logLevel;
        logData.message = clonedLog.msg;

        if (clonedLog.context && clonedLog.context.debugStack) {
            logData.debugStack = clonedLog.context.debugStack;
            delete clonedLog.context.debugStack;
        }

        if (clonedLog.context) {
            logData.context = clonedLog.context
        }

        // Mark log as sent
        log.destinations.push('database');

        dataSource.manager.insert(LogDataEntity, logData).catch((error) => {
            log.notes = 'Database write failed: ' + error.message;

            this.sendToEmail(logLevel, log);
        });
    }

    private sendToEmail(logLevel: LogLevelEnum, log: any) {
        if (log.destinations.includes('email')) {
            return;
        }

        const emailTransporter = nodemailer.createTransport({
            host: cfg('mail.host'),
            port: cfg('mail.port'),
            secure: cfg('mail.encryption') === 'ssl',
            auth: {
                user: cfg('mail.username'),
                pass: cfg('mail.password'),
            },
        });

        const clonedLog = JSON.parse(JSON.stringify(log));

        clonedLog.time = moment(log.time).format('HH:mm:ss Z');

        delete clonedLog?.destinations; // Destinations were added to track log channels

        // Mark log as sent
        log.destinations.push('database');

        emailTransporter.sendMail({
            from: cfg('mail.fromAddress'),
            to: cfg('pino.logEmail'),
            subject: lang('debug.email_log_subject', {
                app: cfg('app.name'),
                level: logLevel,
            }),
            text: JSON.stringify(clonedLog)
        }).catch((error) => {
            log.notes = 'Email failed:' + error.message;

            this.writeToFile(logLevel, log);
        });
    }

    private pretty = pinoPretty({
        colorize: true,  // Enables color output
        translateTime: 'HH:MM:ss Z', // Optional: Formats timestamps
        ignore: 'pid,hostname' // Optional: Hides unnecessary fields
    });

    _write(chunk: any, _encoding: string, callback: () => void) {
        try {
            const chunkString = chunk.toString();
            let log = JSON.parse(chunkString);
            log.destinations = [];

            if (cfg('app.env') === 'test' || cfg('app.debug')) {
                this.pretty.write(chunkString);
            }

            const logLevel: LogLevelEnum = getLogLevel(log.level);

            if ((cfg('pino.levelFile')).includes(logLevel)) {
                this.writeToFile(logLevel, log);
            }

            if ((cfg('pino.levelDatabase')).includes(logLevel)) {
                this.writeToDatabase(logLevel, log);
            }

            if ((cfg('pino.levelEmail')).includes(logLevel)) {
                this.sendToEmail(logLevel, log);
            }
        } catch (error) {
            console.error('LogStream error:', error);
        }

        callback(); // Signals that writing is complete
    }
}

const logStream = new LogStream();

const logger = pino({
    // The minimum level to log: Pino will not log messages with a lower level.
    // Setting this option reduces the load, as typically, debug and trace logs are only valid for development, and not needed in production.
    // 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
    level: cfg('app.env') === 'test' ? 'error' : cfg('pino.logLevel'),
    // Defines how and where to send log data, such as to files, external services, or streams.
    nestedKey: 'context',
    // Define default properties included in every log line.
    base: {
        pid: uuid(),
        // pid: process.pid,
    },
    // Note: Attempting to format time in-process will significantly impact logging performance.
    // timestamp: pino.stdTimeFunctions.isoTime, // Format the timestamp as ISO 8601; default timestamp is the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC
    // bindings: (bindings) => {
    //     return {
    //         pid: bindings.pid,
    //         host: bindings.hostname,
    //     };
    // },
    mixin: (context, level, _logger) => {
        if (level === 30) {
            return context;
        }

        if ('err' in context && context.err instanceof Error) {
            const debugStack: string = context.err.stack || '';

            delete context.err; // Removes the 'err' key from the context object

            return {
                ...context,
                debugStack: formatCallStack(debugStack)
            };
        }

        return {
            ...context,
            debugStack: formatCallStack(new Error().stack || '', ['logger.provider.ts'])
        };
    },
    // Remove sensitive information from logs
    redact: {
        paths: [
            'req.headers.authorization',
        ],
        remove: true,
    },
    serializers: {
        user: (user) => {
            return {
                id: user.id,
                name: user.name,
                email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined,
            };
        },
    },
}, logStream);

export function childLogger(logger: Logger, category: LogCategoryEnum) {
    return logger.child({
        category: category
    });
}

export const systemLogger: Logger = childLogger(logger, LogCategoryEnum.SYSTEM);

if (cfg('app.env') === 'test') {
    // systemLogger.debug = console.log;
    systemLogger.debug = () => {};
    systemLogger.error = console.error;
}

export default logger;
