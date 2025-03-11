import pino, {Logger} from 'pino';
import {settings} from '../config/settings.config';
import {buildSrcPath} from '../helpers/system.helper';
import {v4 as uuid} from 'uuid';
import {CallStackInterface} from '../interfaces/call-stack.interface';

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
        }
    );

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

function targets() {
    const targets = [];

    if (settings.app.debug) {
        targets.push({
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
            level: settings.pino.logLevel,
            sync: false,
        });
    }

    if (settings.app.env !== 'test') {
        targets.push({
            target: buildSrcPath('providers', 'pino-transports', 'log.transport.ts'),
            level: 'info',
        });
    }

    return targets;
}

const logger = pino({
    // The minimum level to log: Pino will not log messages with a lower level.
    // Setting this option reduces the load, as typically, debug and trace logs are only valid for development, and not needed in production.
    // 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
    level: settings.app.env === 'test' ? 'error' : settings.pino.logLevel,
    // Defines how and where to send log data, such as to files, external services, or streams.
    nestedKey: 'context',
    // Define default properties included in every log line.
    base: {
        pid: uuid(),
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

        // if (['error', 'warn', 'fatal'].includes(logger.levels.labels[level]))
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
}, pino.transport({
    targets: targets(),
    dedupe: false, //  When true - logs only to the stream with the higher level
}))

export function childLogger(logger: Logger, category: string) {
    return logger.child({
        category: category
    });
}

export const systemLogger: Logger = childLogger(logger, 'system');

if (settings.app.env === 'test') {
    // systemLogger.debug = console.log;
    systemLogger.debug = () => {};
    systemLogger.error = console.error;
}

export default logger;
