import { EOL } from 'node:os';
import { Writable } from 'node:stream';
import FileStreamRotator from 'file-stream-rotator';
import moment from 'moment';
import nodemailer from 'nodemailer';
import pino, { type Logger } from 'pino';
import pinoPretty from 'pino-pretty';
import { v4 as uuid } from 'uuid';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { requestContext } from '@/config/request.context';
import { cfg } from '@/config/settings.config';
import LogDataEntity, {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { buildRootPath } from '@/lib/helpers';

interface CallStackInterface {
	trace: string[];
	file: string;
	line: number;
	function: string;
}

interface PinoLog {
	level: number;
	time: number;
	pid: string | number;
	msg: string;
	context?: Record<string, unknown>;
	debugStack?: CallStackInterface;
	destinations: string[];
	notes?: string;
	[key: string]: unknown;
}

export function getLogLevel(level: number): LogDataLevelEnum {
	switch (level) {
		case 10:
			return LogDataLevelEnum.TRACE;
		case 20:
			return LogDataLevelEnum.DEBUG;
		case 30:
			return LogDataLevelEnum.INFO;
		case 40:
			return LogDataLevelEnum.WARN;
		case 50:
			return LogDataLevelEnum.ERROR;
		case 60:
			return LogDataLevelEnum.FATAL;
		default:
			throw new Error(`Unknown log level: ${level}`);
	}
}

function formatCallStack(
	stack: string,
	filtersForCallStack: string[] = [],
): CallStackInterface {
	const result: CallStackInterface = {
		file: 'Unknown file',
		line: 0,
		function: 'Unknown function',
		trace: [],
	};

	const combinedFilters = [
		...filtersForCallStack,
		'/node_modules',
		'internal/modules',
	];

	let [, ...stackArray]: string[] = stack
		.split('\n')
		.map((line) => line.trim()); // The first line from the call stack is removed

	stackArray = stackArray.filter((item) => {
		// Check if the item contains any of the words in combinedFilters
		return !combinedFilters.some((word) => item.includes(word));
	});

	if (stackArray.length > 0) {
		const match = stackArray[0].match(
			/at (?:([^ ]+) )?\(?(.+):(\d+):(\d+)\)?/,
		);

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

type FileStreamRotatorStream = ReturnType<typeof FileStreamRotator.getStream>;

export class LogStream extends Writable {
	private fileStreams: Record<string, FileStreamRotatorStream> = {};
	private fileStreamTimeouts: Record<string, NodeJS.Timeout> = {};

	private getFileStream(level: LogDataLevelEnum): FileStreamRotatorStream {
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
		this.fileStreamTimeouts[level] = setTimeout(
			() => {
				this.fileStreams[level].end('');
				delete this.fileStreams[level];
				delete this.fileStreamTimeouts[level];
			},
			5 * 60 * 1000,
		);

		return this.fileStreams[level];
	}

	public async closeFileStreams() {
		await Promise.all(
			Object.values(this.fileStreams).map((stream) => {
				return new Promise((resolve) => {
					stream.on('finish', resolve); // Listen for finish event
					stream.end(''); // End with an empty string
				});
			}),
		);

		this.fileStreams = {};
	}

	private writeToFile(logLevel: LogDataLevelEnum, log: PinoLog) {
		// Do not write to file - already written to file
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

		if (clonedLog.context?.request_id) {
			clonedLog.request_id = clonedLog.context.request_id;

			delete clonedLog.context.request_id;
		}

		// Reorder properties
		const { time, msg, request_id, ...orderedLog } = clonedLog;

		log.destinations.push('email');

		// Mark log as sent
		log.destinations.push('file');

		this.getFileStream(logLevel).write(
			JSON.stringify({ time, msg, request_id, ...orderedLog }) + EOL,
		);
	}

	private async writeToDatabase(logLevel: LogDataLevelEnum, log: PinoLog) {
		if (log.destinations.includes('database')) {
			return;
		}

		const clonedLog = JSON.parse(JSON.stringify(log));

		const logData = new LogDataEntity();
		logData.pid = clonedLog.pid;

		if (clonedLog.context?.request_id) {
			logData.request_id = clonedLog.context.request_id;

			delete clonedLog.context.request_id;
		}

		logData.category = clonedLog.category ?? 'n/a';
		logData.level = logLevel;
		logData.message = clonedLog.msg;

		if (clonedLog.context?.debugStack) {
			logData.debugStack = clonedLog.context.debugStack;

			delete clonedLog.context.debugStack;
		}

		if (clonedLog.context) {
			logData.context = clonedLog.context;
		}

		// Mark log as sent
		log.destinations.push('database');

		try {
			await dataSource.manager.save(LogDataEntity, logData);
		} catch (error) {
			if (error instanceof Error) {
				log.notes = `Database write failed: ${error.message}`;
			} else {
				log.notes = `Database write failed`;
			}
		}
	}

	private async sendToEmail(logLevel: LogDataLevelEnum, log: PinoLog) {
		if (log.destinations.includes('email')) {
			return;
		}

		const emailTransporter = nodemailer.createTransport({
			host: cfg('mail.host') as string,
			port: cfg('mail.port') as number,
			secure: cfg('mail.encryption') === 'ssl',
			auth: {
				user: cfg('mail.username') as string,
				pass: cfg('mail.password') as string,
			},
		});

		const clonedLog = JSON.parse(JSON.stringify(log));

		clonedLog.time = moment(log.time).format('HH:mm:ss Z');

		delete clonedLog?.destinations; // Destinations were added to track log channels

		// Mark log as sent
		log.destinations.push('database');

		emailTransporter
			.sendMail({
				from: cfg('mail.fromAddress') as string,
				to: cfg('logging.logEmail') as string,
				subject: lang('shared.debug.email_log_subject', {
					app: cfg('app.name') as string,
					level: logLevel,
				}),
				text: JSON.stringify(clonedLog),
			})
			.catch((error) => {
				log.notes = `Email failed: ${error.message}`;

				this.writeToFile(logLevel, log);
			});
	}

	private pretty = pinoPretty({
		colorize: true, // Enables color output
		translateTime: 'HH:MM:ss Z', // Optional: Formats timestamps
		ignore: 'pid,hostname', // Optional: Hides unnecessary fields
	});

	async _write(chunk: string, _encoding: string, callback: () => void) {
		try {
			const log = JSON.parse(chunk);
			log.destinations = [];

			if (cfg('app.env') === 'test' || cfg('app.debug')) {
				this.pretty.write(chunk);
			}

			const logLevel: LogDataLevelEnum = getLogLevel(log.level);

			if (
				(cfg('logging.levelFile') as LogDataLevelEnum[]).includes(
					logLevel,
				)
			) {
				this.writeToFile(logLevel, log);
			}

			if (
				(cfg('logging.levelDatabase') as LogDataLevelEnum[]).includes(
					logLevel,
				)
			) {
				this.writeToDatabase(logLevel, log).catch((error) => {
					console.error('Database logging failed:', error);
				});
			}

			if (
				(cfg('logging.levelEmail') as LogDataLevelEnum[]).includes(
					logLevel,
				)
			) {
				this.sendToEmail(logLevel, log).catch((error) => {
					console.error('Email logging failed:', error);
				});
			}
		} catch (error) {
			console.error('LogStream error:', error);
		}

		callback(); // Signals that writing is complete
	}
}

const logStream = new LogStream();

const logger = pino(
	{
		// The minimum level to log: Pino will not log messages with a lower level.
		// Setting this option reduces the load, as typically, debug and trace logs are only valid for development and not needed in production.
		// 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
		level:
			cfg('app.env') === 'test'
				? 'error'
				: (cfg('logging.logLevel') as LogDataLevelEnum),
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
		mixin: (context, _level, _logger) => {
			const ctx = requestContext.getStore();

			if ('err' in context && context.err instanceof Error) {
				const debugStack: string = context.err.stack || '';

				delete context.err; // Removes the 'err' key from the context object

				return {
					...context,
					request_id: ctx?.request_id,
					debugStack: formatCallStack(debugStack),
				};
			}

			return {
				...context,
				request_id: ctx?.request_id,
				debugStack: formatCallStack(new Error().stack || '', [
					'logger.provider.ts',
				]),
			};
		},
		// Remove sensitive information from logs
		redact: {
			paths: ['req.headers.authorization'],
			remove: true,
		},
		serializers: {
			user: (user) => {
				return {
					id: user.id,
					name: user.name,
					email: user.email
						? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
						: undefined,
				};
			},
		},
	},
	logStream,
);

let systemLoggerInstance: Logger | null = null;

export function getSystemLogger(): Logger {
	if (!systemLoggerInstance) {
		systemLoggerInstance = logger.child({
			category: LogDataCategoryEnum.SYSTEM,
		});
	}
	return systemLoggerInstance;
}

let historyLoggerInstance: Logger | null = null;

export function getHistoryLogger(): Logger {
	if (!historyLoggerInstance) {
		historyLoggerInstance = logger.child({
			category: LogDataCategoryEnum.HISTORY,
		});
	}
	return historyLoggerInstance;
}

let cronLoggerInstance: Logger | null = null;

export function getCronLogger(): Logger {
	if (!cronLoggerInstance) {
		cronLoggerInstance = logger.child({
			category: LogDataCategoryEnum.CRON,
		});
	}
	return cronLoggerInstance;
}

if (cfg('app.env') === 'test') {
	// getSystemLogger().debug = console.log;
	getSystemLogger().debug = () => {};
	getSystemLogger().error = console.error;
}
