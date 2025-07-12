import cors from 'cors';
import NotAllowedError from '../exceptions/not-allowed.error';
import {cfg} from '../config/settings.config';

export const corsHandler = cors({
    origin: (origin, callback) => {
        const allowedOrigins = cfg('security.allowedOrigins');

        if (!allowedOrigins || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new NotAllowedError());
        }
    },
    credentials: true,
});
