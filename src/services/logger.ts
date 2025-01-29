import pino from 'pino'
import 'dotenv/config'

const transport: { targets: any[] } = {
    targets: [
        {
            target: 'pino-pretty',
            options: {
                destination: './logs/info.log',
                colorize: true
            },
            level: 'info',
        },
        {
            target: 'pino-pretty',
            options: {
                destination: './logs/error.log'
            },
            level: 'error',
        },
    ],
}

const logger = pino({
    // The minimum level to log: Pino will not log messages with a lower level.
    // Setting this option reduces the load, as typically, debug and trace logs are only valid for development, and not needed in production.
    // 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
    level: process.env.PINO_LOG_LEVEL || 'info',
    // Defines how and where to send log data, such as to files, external services, or streams.
    transport: transport,
    nestedKey: 'context',
    // Define default properties included in every log line.
    base: {
        appName: process.env.APP_NAME,
    },
    // Note: Attempting to format time in-process will significantly impact logging performance.
    // timestamp: pino.stdTimeFunctions.isoTime, // Format the timestamp as ISO 8601; default timestamp is the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC
    bindings: (bindings) => {
        return {
            pid: bindings.pid,
            host: bindings.hostname,
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
            }
        },
    },
})

export default logger
