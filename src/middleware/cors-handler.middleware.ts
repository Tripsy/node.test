import cors from 'cors';
import NotAllowedError from '../exceptions/not-allowed.error';

export const corsHandler = cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new NotAllowedError());
        }
    },
    credentials: true,
});
