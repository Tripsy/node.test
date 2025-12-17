import cors from 'cors';
import { cfg } from '@/config/settings.config';
import NotAllowedError from '@/exceptions/not-allowed.error';

const allowedOrigins = new Set(
	(cfg('security.allowedOrigins') as string[]) || [],
);

export const corsHandler = cors({
	origin: (origin, callback) => {
		// Allow requests without an origin (server-to-server or same-origin)
		if (!origin) {
			return callback(null, true);
		}

		if (allowedOrigins.has(origin)) {
			return callback(null, true);
		}

		// Origin is present but not allowed
		return callback(new NotAllowedError());
	},
	credentials: true,
});
