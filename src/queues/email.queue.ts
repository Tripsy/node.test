import {Queue} from 'bullmq';
import {getRedisClient} from '../config/init-redis.config';

const emailQueue = new Queue('emailQueue', {
    connection: getRedisClient(),
});

export default emailQueue;