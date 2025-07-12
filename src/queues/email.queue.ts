import {Queue} from 'bullmq';
// import {cfg} from '../config/settings.config';
import {getRedisClient} from '../config/init-redis.config';

const emailQueue = new Queue('emailQueue', {
    connection: getRedisClient(),
    // connection: {
    //     host: cfg('redis.host'),
    //     port: cfg('redis.port'),
    // },
});

export default emailQueue;