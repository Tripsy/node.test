import type { NextFunction, Request, Response } from 'express';
import { Configuration } from '@/config/settings.config';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import { getAccountTokenRepository } from '@/features/account/account-token.repository';
import { accountTokenService } from '@/features/account/account-token.service';
import UserEntity, {
	UserRoleEnum,
	UserStatusEnum,
} from '@/features/user/user.entity';
import { getUserRepository } from '@/features/user/user.repository';
import { getUserPermissionRepository } from '@/features/user-permission/user-permission.repository';
import {
	compareMetaDataValue,
	createFutureDate,
	dateDiffInSeconds,
	tokenMetaData,
} from '@/helpers';
import { cacheProvider } from '@/providers/cache.provider';

async function getUserPermissions(user_id: number): Promise<string[]> {
	const cacheKey = cacheProvider.buildKey(
		UserEntity.NAME,
		user_id.toString(),
		'permissions',
	);

	return (await cacheProvider.get(
		cacheKey,
		async () => {
			const userPermissions =
				await getUserPermissionRepository().getUserPermissions(user_id);

			const results: string[] = [];

			userPermissions.forEach((userPermission) => {
				results.push(
					userPermission.permission_entity +
						'.' +
						userPermission.permission_operation,
				);
			});

			return results;
		},
		1800,
	)) as string[];
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
	try {
		// Initialize the user as a visitor
		res.locals.auth = {
			id: 0,
			email: '',
			name: '',
			language: Configuration.get('app.language') as string,
			role: 'visitor',
			operator_type: null,
			permissions: [],
			activeToken: '',
		};

		// Read the token from the request
		const token = accountTokenService.getAuthTokenFromHeaders(req);

		if (!token) {
			return next();
		}

		let activeToken: AccountTokenEntity;

		try {
			activeToken = await accountTokenService.findByToken(token);
		} catch {
			return next();
		}

		// Check if the token is expired
		if (activeToken.expire_at < new Date()) {
			getAccountTokenRepository().removeTokenById(activeToken.id);

			return next();
		}

		// Validate metadata (e.g., user-agent check)
		if (
			!Configuration.isEnvironment('production') &&
			(!activeToken.metadata ||
				!compareMetaDataValue(
					activeToken.metadata,
					tokenMetaData(req),
					'user-agent',
				))
		) {
			return next();
		}

		const user = await getUserRepository()
			.createQuery()
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

		// User was not found or inactive
		if (!user || user.status !== UserStatusEnum.ACTIVE) {
			getAccountTokenRepository().removeTokenById(activeToken.id);

			return next();
		}

		// Refresh the token if it's close to expiration
		const diffInSeconds = dateDiffInSeconds(
			activeToken.expire_at,
			new Date(),
		);

		if (
			diffInSeconds <
			(Configuration.get('user.authRefreshExpiresIn') as number)
		) {
			await getAccountTokenRepository().update(activeToken.id, {
				used_at: new Date(),
				expire_at: createFutureDate(
					Configuration.get('user.authExpiresIn') as number,
				),
			});
		} else {
			await getAccountTokenRepository().update(activeToken.id, {
				used_at: new Date(),
			});
		}

		// Attach user information to the request object
		res.locals.auth = {
			...user,
			permissions:
				user.role === UserRoleEnum.OPERATOR
					? await getUserPermissions(user.id)
					: [],
			activeToken: activeToken.ident,
		};

		next();
	} catch (err) {
		next(err);
	}
}

export default authMiddleware;
