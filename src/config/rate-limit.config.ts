import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { lang } from '@/config/i18n.setup';

const ipsAllowlist = ['192.168.0.56', '192.168.0.21'];

type RateLimiterType = 'api' | 'authLogin' | 'authDefault';

class RateLimiterFactory {
	private static instances = new Map<RateLimiterType, any>();

	private static baseConfig = {
		windowMs: 15 * 60 * 1000, // 15 minutes
		limit: 150, // 150 attempts per 15 minutes
		legacyHeaders: false,
		standardHeaders: 'draft-6' as const,
		// requestWasSuccessful: (_req: Request, res: Response) => res.statusCode < 400,
		// skipSuccessfulRequests: false,
		skip: (req: Request, _res: Response) =>
			ipsAllowlist.includes(req.ip || ''),
	};

	static get(type: RateLimiterType = 'api') {
		if (RateLimiterFactory.instances.has(type)) {
			return RateLimiterFactory.instances.get(type);
		}

		const configs = {
			api: {
				...RateLimiterFactory.baseConfig,
				message: 'shared.rate_limit.message.default',
			},
			authLogin: {
				...RateLimiterFactory.baseConfig,
				limit: 10, // 10 attempts per 15 minutes
				message: 'shared.rate_limit.message.login',
			},
			authDefault: {
				...RateLimiterFactory.baseConfig,
				limit: 10, // 10 attempts per 15 minutes
				message: 'shared.rate_limit.message.default',
			},
		};

		const instance = rateLimit({
			...configs[type],
			message: async (_req: Request, _res: Response) => {
				return {
					status: 429,
					error: lang('shared.rate_limit.error'),
					message: lang(configs[type].message),
				};
			},
		});

		RateLimiterFactory.instances.set(type, instance);

		return instance;
	}
}

export const apiRateLimiter = RateLimiterFactory.get('api');
export const authLoginRateLimiter = RateLimiterFactory.get('authLogin');
export const authDefaultRateLimiter = RateLimiterFactory.get('authDefault');
