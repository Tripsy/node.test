import type { NextFunction, Request, Response } from 'express';
import { cfg } from '@/config/settings.config';
import { getActiveAuthToken } from '@/features/account/account.service';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import AccountTokenRepository from '@/features/account/account-token.repository';
import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import UserRepository from '@/features/user/user.repository';
import { getPolicyPermissions } from '@/features/user/user.service';
import {
	compareMetaDataValue,
	createFutureDate,
	dateDiffInSeconds,
	tokenMetaData,
} from '@/helpers';

async function authMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	try {
		// Initialize the user as a visitor
		req.user = {
			id: 0,
			email: '',
			name: '',
			language: cfg('app.language') as string,
			role: 'visitor',
			operator_type: null,
			permissions: [],
			activeToken: '',
		};

		let activeToken: AccountTokenEntity;

		try {
			activeToken = await getActiveAuthToken(req);
		} catch {
			return next();
		}

		// Check if token is expired
		if (activeToken.expire_at < new Date()) {
			AccountTokenRepository.removeTokenById(activeToken.id);

			return next();
		}

		// Validate metadata (e.g., user-agent check)
		if (
			cfg('app.env') !== 'development' &&
			(!activeToken.metadata ||
				!compareMetaDataValue(
					activeToken.metadata,
					tokenMetaData(req),
					'user-agent',
				))
		) {
			return next();
		}

		const user = await UserRepository.createQuery()
			.select([
				'id',
				'name',
				'email',
				'email_verified_at',
				'password_updated_at',
				'language',
				'role',
				'operator_type',
				'status',
				'created_at',
			])
			.filterById(activeToken.user_id)
			.first();

		// User not found or inactive
		if (!user || user.status !== UserStatusEnum.ACTIVE) {
			AccountTokenRepository.removeTokenById(activeToken.id);

			return next();
		}

		// Refresh the token if it's close to expiration
		const diffInSeconds = dateDiffInSeconds(
			activeToken.expire_at,
			new Date(),
		);

		if (diffInSeconds < (cfg('user.authRefreshExpiresIn') as number)) {
			await AccountTokenRepository.update(activeToken.id, {
				used_at: new Date(),
				expire_at: createFutureDate(
					cfg('user.authExpiresIn') as number,
				),
			});
		} else {
			await AccountTokenRepository.update(activeToken.id, {
				used_at: new Date(),
			});
		}

		// Attach user information to the request object
		req.user = {
			...user,
			permissions:
				user.role === UserRoleEnum.OPERATOR
					? await getPolicyPermissions(user.id)
					: [],
			activeToken: activeToken.ident,
		};

		next();
	} catch (err) {
		next(err);
	}
}

export default authMiddleware;
