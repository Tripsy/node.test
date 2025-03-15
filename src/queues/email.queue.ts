import {Queue} from 'bullmq';
// import {settings} from '../config/settings.config';
import {getRedisClient} from '../config/init-redis.config';

const emailQueue = new Queue('emailQueue', {
    connection: getRedisClient(),
    // connection: {
    //     host: settings.redis.host,
    //     port: settings.redis.port,
    // },
});

export default emailQueue;