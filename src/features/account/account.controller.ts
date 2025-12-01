import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import BadRequestError from '@/exceptions/bad-request.error';
import CustomError from '@/exceptions/custom.error';
import NotAllowedError from '@/exceptions/not-allowed.error';
import NotFoundError from '@/exceptions/not-found.error';
import UnauthorizedError from '@/exceptions/unauthorized.error';
import AccountPolicy from '@/features/account/account.policy';
import {
	getActiveAuthToken,
	getAuthValidTokens,
	sendEmailConfirmCreate,
	sendEmailConfirmUpdate,
	setupRecovery,
	setupToken,
	updateUserPassword,
	verifyPassword,
} from '@/features/account/account.service';
import AccountEditValidator from '@/features/account/account-edit.validator';
import AccountEmailConfirmSendValidator from '@/features/account/account-email-confirm-send.validator';
import AccountEmailUpdateValidator from '@/features/account/account-email-update.validator';
import AccountLoginValidator from '@/features/account/account-login.validator';
import AccountPasswordRecoverValidator from '@/features/account/account-password-recover.validator';
import AccountPasswordRecoverChangeValidator from '@/features/account/account-password-recover-change.validator';
import AccountPasswordUpdateValidator from '@/features/account/account-password-update.validator';
import AccountRecoveryRepository from '@/features/account/account-recovery.repository';
import AccountRegisterValidator from '@/features/account/account-register.validator';
import AccountRemoveTokenValidator from '@/features/account/account-remove-token.validator';
import AccountTokenRepository from '@/features/account/account-token.repository';
import UserEntity from '@/features/user/user.entity';
import UserRepository from '@/features/user/user.repository';
import { UserStatusEnum } from '@/features/user/user-status.enum';
import asyncHandler from '@/helpers/async.handler';
import { createPastDate } from '@/helpers/date.helper';
import {
	compareMetaDataValue,
	tokenMetaData,
} from '@/helpers/meta-data.helper';
import { getClientIp } from '@/helpers/system.helper';
import { loadEmailTemplate, queueEmail } from '@/providers/email.provider';
import type { EmailTemplate } from '@/types/template.type';
import type {
	AuthValidToken,
	ConfirmationTokenPayload,
} from '@/types/token.type';

class AccountController {
	public register = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (should not be authenticated)
		policy.register();

		// Validate against the schema
		const validated = AccountRegisterValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const existingUser = await UserRepository.createQuery()
			.filterByEmail(validated.data.email)
			.first();

		if (existingUser) {
			if (existingUser.status === UserStatusEnum.PENDING) {
				throw new CustomError(
					409,
					lang('account.error.pending_account'),
				);
			} else {
				throw new BadRequestError(
					lang('account.error.email_already_used'),
				);
			}
		}

		const user = new UserEntity();
		user.name = validated.data.name;
		user.email = validated.data.email;
		user.password = validated.data.password;
		user.language = validated.data.language || req.lang;

		const entry: UserEntity = await UserRepository.save(user);

		res.output.data(entry);
		res.output.message(lang('account.success.register'));

		res.json(res.output);
	});

	public login = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (should not be authenticated)
		policy.login();

		// Validate against the schema
		const validated = AccountLoginValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const ipKey = `failed_login:ip:${getClientIp(req)}`;
		const emailKey = `failed_login:email:${validated.data.email}`;

		await policy.checkRateLimitOnLogin(ipKey, emailKey);

		const user = await UserRepository.createQuery()
			.select(['id', 'password', 'status'])
			.filterByEmail(validated.data.email)
			.firstOrFail();

		if (user.status === UserStatusEnum.PENDING) {
			// Update failed login attempts
			await policy.updateFailedAttemptsOnLogin(ipKey, emailKey);

			throw new CustomError(409, lang('account.error.pending_account'));
		}

		if (user.status === UserStatusEnum.INACTIVE) {
			// Update failed login attempts
			await policy.updateFailedAttemptsOnLogin(ipKey, emailKey);

			throw new BadRequestError(lang('account.error.not_active'));
		}

		const isValidPassword: boolean = await verifyPassword(
			validated.data.password,
			user.password,
		);

		if (!isValidPassword) {
			// Update failed login attempts
			await policy.updateFailedAttemptsOnLogin(ipKey, emailKey);

			throw new UnauthorizedError(lang('account.error.not_authorized'));
		}

		const authValidTokens: AuthValidToken[] = await getAuthValidTokens(
			user.id,
		);

		if (
			authValidTokens.length >= (cfg('user.maxActiveSessions') as number)
		) {
			res.status(403); // Forbidden - client's identity is known to the server
			res.output.message(lang('account.error.max_active_sessions'));
			res.output.data({
				authValidTokens: authValidTokens,
			});
		} else {
			const token = await setupToken(user, req);

			res.output.message(lang('account.success.login'));
			res.output.data({
				token: token,
			});
		}

		res.json(res.output);
	});

	/**
	 * With this endpoint account tokens can be removed
	 * It is allowed to be used authenticated or not; "safety" is only guaranteed by the ident parameter which is hard to guess
	 *
	 * Practical aspects:
	 *      - On login (with valid credentials) if too many sessions are active a list of tokens will be returned
	 *        in the response -> front-end implementation can allow token(s) to be removed before login retry
	 *      - From his account page user could see all active tokens and allow removal
	 */
	public removeToken = asyncHandler(async (req: Request, res: Response) => {
		// Validate against the schema
		const validated = AccountRemoveTokenValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		await AccountTokenRepository.createQuery()
			.filterByIdent(validated.data.ident)
			.delete(false);

		res.output.message(lang('account.success.token_deleted'));

		res.json(res.output);
	});

	public logout = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (should be authenticated)
		policy.logout();

		try {
			const activeToken = await getActiveAuthToken(req);

			if (activeToken) {
				// // This will actually remove all sessions - keep it for further implementation
				// await AccountTokenRepository.createQuery()
				//     .filterBy('user_id', policy.getUserId())
				//     .delete(false, true);

				await AccountTokenRepository.createQuery()
					.filterBy('ident', activeToken.ident)
					.delete(false, false, true);
			}
		} catch (error) {
			if (!(error instanceof NotFoundError)) {
				throw error;
			}
		}

		res.output.message(lang('account.success.logout'));

		res.json(res.output);
	});

	public passwordRecover = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(req);

			// Check permission (should not be authenticated)
			policy.passwordRecover();

			// Validate against the schema
			const validated = AccountPasswordRecoverValidator.safeParse(
				req.body,
			);

			if (!validated.success) {
				res.output.errors(validated.error.errors);

				throw new BadRequestError();
			}

			const user = await UserRepository.createQuery()
				.select(['id', 'name', 'email', 'language', 'status'])
				.filterByEmail(validated.data.email)
				.firstOrFail();

			if (user.status !== UserStatusEnum.ACTIVE) {
				throw new NotFoundError(lang('account.error.not_active'));
			}

			const countRecoveryAttempts: number =
				await AccountRecoveryRepository.createQuery()
					.select(['id'])
					.filterBy('user_id', user.id)
					.filterByRange('created_at', createPastDate(6 * 60 * 60)) // Last 6 hours
					.count();

			if (
				countRecoveryAttempts >=
				(cfg('user.recoveryAttemptsInLastSixHours') as number)
			) {
				throw new CustomError(
					425,
					lang('account.error.recovery_attempts_exceeded'),
				);
			}

			const metadata = tokenMetaData(req);
			const [ident, expire_at] = await setupRecovery(user, metadata);

			const emailTemplate: EmailTemplate = await loadEmailTemplate(
				'password-recover',
				user.language || req.lang,
			);

			emailTemplate.content.vars = {
				name: user.name,
				ident: ident,
				expire_at: expire_at.toISOString(),
			};

			await queueEmail(emailTemplate, {
				name: user.name,
				address: user.email,
			});

			res.output.message(lang('account.success.password_recover'));

			res.json(res.output);
		},
	);

	public passwordRecoverChange = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(req);

			// Check permission (should not be authenticated)
			policy.passwordRecoverChange();

			const ident = req.params.ident;

			// Validate against the schema
			const validated = AccountPasswordRecoverChangeValidator.safeParse(
				req.body,
			);

			if (!validated.success) {
				res.output.errors(validated.error.errors);

				throw new BadRequestError();
			}

			const recovery = await AccountRecoveryRepository.createQuery()
				.select(['id', 'user_id', 'metadata', 'used_at', 'expire_at'])
				.filterByIdent(ident)
				.firstOrFail();

			if (recovery.used_at) {
				throw new BadRequestError(
					lang('account.error.recovery_token_used'),
				);
			}

			if (recovery.expire_at < new Date()) {
				throw new BadRequestError(
					lang('account.error.recovery_token_expired'),
				);
			}

			if (cfg('user.recoveryEnableMetadataCheck')) {
				// Validate metadata (e.g., user-agent check)
				if (
					!compareMetaDataValue(
						recovery.metadata,
						tokenMetaData(req),
						'user-agent',
					)
				) {
					throw new BadRequestError(
						lang('account.error.recovery_token_not_authorized'),
					);
				}
			}

			const user = await UserRepository.createQuery()
				.select(['id', 'name', 'email', 'language', 'status'])
				.filterById(recovery.user_id)
				.first();

			// User not found or inactive
			if (!user || user.status !== UserStatusEnum.ACTIVE) {
				throw new NotFoundError(lang('account.error.not_found'));
			}

			// Update user password & remove all account tokens
			await updateUserPassword(user, validated.data.password);

			// Mark recovery token as used
			await AccountRecoveryRepository.update(recovery.id, {
				used_at: new Date(),
			});

			const emailTemplate: EmailTemplate = await loadEmailTemplate(
				'password-change',
				user.language || req.lang,
			);

			emailTemplate.content.vars = {
				name: user.name,
			};

			await queueEmail(emailTemplate, {
				name: user.name,
				address: user.email,
			});

			res.output.message(lang('account.success.password_changed'));

			res.json(res.output);
		},
	);

	public passwordUpdate = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(req);

			// Check permission (needs to be authenticated)
			policy.passwordUpdate();

			// Validate against the schema
			const validated = AccountPasswordUpdateValidator.safeParse(
				req.body,
			);

			if (!validated.success) {
				res.output.errors(validated.error.errors);

				throw new BadRequestError();
			}

			const user = await UserRepository.createQuery()
				.select(['id', 'password'])
				.filterById(policy.getUserId())
				.firstOrFail();

			const isValidPassword: boolean = await verifyPassword(
				validated.data.password_current,
				user.password,
			);

			if (!isValidPassword) {
				res.output.errors([
					{
						password_current: lang(
							'account.validation.password_invalid',
						),
					},
				]);

				throw new UnauthorizedError();
			}

			// Update user password & remove all account tokens
			await updateUserPassword(user, validated.data.password_new);

			// Generate new token
			const token = await setupToken(user, req);

			res.output.message(lang('account.success.password_updated'));
			res.output.data({
				token: token,
			});

			res.json(res.output);
		},
	);

	/**
	 * This endpoint is used to confirm user email after account registration or email update
	 * It is allowed to be used authenticated or not; "safety" is guaranteed by the token parameter which is pretty much impossible to guess
	 * & "Yes" - based on implementation (maybe auto-login after registration) - confirmation can take place even if logged in
	 */
	public emailConfirm = asyncHandler(async (req: Request, res: Response) => {
		const token = decodeURIComponent(req.params.token);

		// Verify JWT and extract payload
		let payload: ConfirmationTokenPayload;

		try {
			payload = jwt.verify(
				token,
				cfg('user.emailConfirmationSecret') as string,
			) as ConfirmationTokenPayload;
		} catch {
			throw new BadRequestError(
				lang('account.error.confirmation_token_invalid'),
			);
		}

		const user = await UserRepository.createQuery()
			.select(['id', 'status'])
			.filterById(payload.user_id)
			.filterByEmail(payload.user_email)
			.first();

		// User not found
		if (!user) {
			throw new NotFoundError(lang('account.error.not_found'));
		}

		if (payload.user_email_new) {
			// Confirm procedure for email update
			user.email = payload.user_email_new;
			user.email_verified_at = new Date();

			await UserRepository.save(user);

			res.output.message(lang('account.success.email_updated'));
		} else {
			// Confirm procedure for email confirmation
			switch (user.status) {
				case UserStatusEnum.ACTIVE:
					throw new BadRequestError(
						lang('account.error.already_active'),
					);
				case UserStatusEnum.INACTIVE:
					throw new NotAllowedError();
			}

			// Update user status
			user.status = UserStatusEnum.ACTIVE;
			user.email_verified_at = new Date();

			await UserRepository.save(user);

			res.output.message(lang('account.success.email_confirmed'));
		}

		res.json(res.output);
	});

	/**
	 * This endpoint is used to resend the confirmation email after account registration or email update
	 */
	public emailConfirmSend = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(req);

			// Check permission (should not be authenticated)
			policy.emailConfirmSend();

			// Validate against the schema
			const validated = AccountEmailConfirmSendValidator.safeParse(
				req.body,
			);

			if (!validated.success) {
				res.output.errors(validated.error.errors);

				throw new BadRequestError();
			}

			const user = await UserRepository.createQuery()
				.select(['id', 'name', 'email', 'language', 'status'])
				.filterByEmail(validated.data.email)
				.first();

			// User not found
			if (!user) {
				throw new NotFoundError(lang('account.error.not_found'));
			}

			if (user.status !== UserStatusEnum.PENDING) {
				throw new NotAllowedError();
			}

			await sendEmailConfirmCreate(user);

			res.output.message(lang('account.success.email_confirmation_sent'));

			res.json(res.output);
		},
	);

	public emailUpdate = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (needs to be authenticated)
		policy.emailUpdate();

		// Validate against the schema
		const validated = AccountEmailUpdateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const existingUser = await UserRepository.createQuery()
			.filterByEmail(validated.data.email_new)
			.first();

		// Return error if email already in use by another account
		if (existingUser) {
			throw new CustomError(
				409,
				lang('account.error.email_already_used'),
			);
		}

		const user = await UserRepository.createQuery()
			.select(['id', 'name', 'email', 'language'])
			.filterById(policy.getUserId())
			.firstOrFail();

		// Send confirmation email
		await sendEmailConfirmUpdate(user, validated.data.email_new);

		res.output.message(lang('account.success.email_update'));

		res.json(res.output);
	});

	public me = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (needs to be authenticated)
		policy.me();

		// const cacheProvider = getCacheProvider();

		// const cacheKey = cacheProvider.buildKey(UserQuery.entityAlias, policy.getUserId().toString() , 'details');
		// const user = await cacheProvider.get(cacheKey, async () => {
		//     const userData = await UserRepository
		//         .createQuery()
		//         .select(['id', 'name', 'email', 'language', 'status', 'role', 'created_at', 'updated_at'])
		//         .filterById(policy.getUserId())
		//         .firstOrFail();
		//
		//     if (userData.role === UserRoleEnum.OPERATOR) {
		//         userData.permissions = await getPolicyPermissions(userData.id);
		//     }
		//
		//     return userData;
		// });

		// res.output.meta(cacheProvider.isCached, 'isCached');
		res.output.data(req.user);

		res.json(res.output);
	});

	/**
	 * Returns a list of all active sessions for the current user
	 */
	public sessions = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (needs to be authenticated)
		policy.me();

		const user_id = policy.getUserId();

		if (!user_id) {
			throw new NotAllowedError();
		}

		const authValidTokens: AuthValidToken[] =
			await getAuthValidTokens(user_id);

		const tokens = authValidTokens.map((token) => {
			return {
				...token,
				used_now: token.ident === req.user?.activeToken,
			};
		});

		res.output.data(tokens);

		res.json(res.output);
	});

	public edit = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(req);

		// Check permission (needs to be authenticated)
		policy.me();

		const user_id = policy.getUserId();

		if (!user_id) {
			throw new NotAllowedError();
		}

		// Validate against the schema
		const validated = AccountEditValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const user = await UserRepository.createQuery()
			.select(['name', 'language'])
			.filterById(user_id)
			.firstOrFail();

		user.name = validated.data.name;
		user.language = validated.data.language;

		// Set `contextData` for usage in subscriber
		user.contextData = {
			auth_id: user_id,
		};

		await UserRepository.save(user);

		res.output.message(lang('account.success.edit'));

		res.json(res.output);
	});
}

export default new AccountController();
