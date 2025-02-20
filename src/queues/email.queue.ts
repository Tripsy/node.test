import { Queue } from 'bullmq';
import {settings} from '../config/settings.config';

const emailQueue = new Queue('emailQueue', {
    connection: {
        host: settings.redis.host,
        port: settings.redis.port,
    }, // Redis connection options
});

export default emailQueue;