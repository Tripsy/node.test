import pino from 'pino';
import 'dotenv/config';
import {buildSrcPath} from '../helpers/system';
import {formatCallStack} from '../helpers/log';
import {v4 as uuid} from 'uuid';

function targets(): [] {
    const targets = [];

    if (process.env.APP_DEBUG === 'true') {
        targets.push({
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
            level: process.env.PINO_LOG_LEVEL || 'info',
        });
    }

    targets.push({
        target: buildSrcPath('services', 'pino-transport-file.ts'),
        level: 'info',
    });

    return targets;
}

const logger = pino({
    // The minimum level to log: Pino will not log messages with a lower level.
    // Setting this option reduces the load, as typically, debug and trace logs are only valid for development, and not needed in production.
    // 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
    level: process.env.PINO_LOG_LEVEL || 'info',
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
    mixin: (context, level, logger) => {
        if (context.errorInstance) {
            const debugStack: string = context.errorInstance.stack || '';

            const {errorInstance, ...newContext}: Omit<object, "errorInstance"> = context;

            return {
                ...newContext,
                debugStack: formatCallStack(debugStack)
            };
        }

        return {
            ...context,
            debugStack: formatCallStack(new Error().stack || '', ['logger.ts'])
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

export default logger;
