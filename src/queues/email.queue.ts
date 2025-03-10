import {Queue} from 'bullmq';
// import {settings} from '../config/settings.config';
import {redisClient} from '../config/init-redis.config';

const emailQueue = new Queue('emailQueue', {
    connection: redisClient,
    // connection: {
    //     host: settings.redis.host,
    //     port: settings.redis.port,
    // },
});

export default emailQueue;