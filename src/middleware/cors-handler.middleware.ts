import cors from 'cors';
import { cfg } from '../config/settings.config';
import NotAllowedError from '../exceptions/not-allowed.error';

export const corsHandler = cors({
	origin: (origin, callback) => {
		const allowedOrigins = cfg('security.allowedOrigins') as string[];

		if (!allowedOrigins || !origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new NotAllowedError());
		}
	},
	credentials: true,
});
