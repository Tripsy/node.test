import 'dotenv/config';

export const settings= {
    app: {
        name: process.env.APP_NAME || 'sample-node-api',
        env: process.env.APP_ENV || 'local',
        debug: process.env.APP_DEBUG === 'true',
        timezone: process.env.APP_TIMEZONE || 'UTC',
        url: process.env.APP_URL || 'http://node.test',
        port: parseInt(process.env.APP_PORT || '3000', 10),
        rootPath: process.env.ROOT_PATH || '/var/www/html',
        srcPath: process.env.SRC_PATH || '/var/www/html/src',
        allowedOrigins: [
            'http://node.xx:3000',
            'http://node.xx:3001'
        ]
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_DATABASE || 'sample-node-api',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || null,
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '60', 10)
    },
    pino: {
        logLevel: process.env.PINO_LOG_LEVEL || 'trace',
        logEmail: process.env.PINO_LOG_EMAIL || '',
    },
    mail: {
        host: process.env.MAIL_HOST || '127.0.0.1',
        port: parseInt(process.env.MAIL_PORT || '2525', 10),
        username: process.env.MAIL_USERNAME || '',
        password: process.env.MAIL_PASSWORD || '',
        fromAddress: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
        fromName: process.env.MAIL_FROM_NAME || 'sample-node-api',
    },
    filter: {
        defaultLimit: 20,
        termMinLength: 3,
        dateFormatRegex: /^\d{4}-\d{2}-\d{2}$/,
        dateFormatLiteral: 'YYYY-MM-DD',
    },
    user: {
        jwt_secret: process.env.JWT_SECRET as string || 'secret',
        jwt_expires_in: parseInt(process.env.JWT_EXPIRES_IN || '60', 10) * 60, // converted to seconds
        jwt_refresh_expires_in: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '60', 10) * 60, // converted to seconds; must be less than jwt_expires_in; used to refresh token if token expires before this value
        maxActiveSessions: 2, // maximum number of active sessions per user; on valid login and max number will have to chose to remove old session(s)
        nameMinLength: 3,
        passwordMinLength: 8,
    }
};
