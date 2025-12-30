import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
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
import {
	AccountDeleteValidator,
	AccountEditValidator,
	AccountEmailConfirmSendValidator,
	AccountEmailUpdateValidator,
	AccountLoginValidator,
	AccountPasswordRecoverChangeValidator,
	AccountPasswordRecoverValidator,
	AccountPasswordUpdateValidator,
	AccountRegisterValidator,
	AccountRemoveTokenValidator,
} from '@/features/account/account.validator';
import AccountRecoveryRepository from '@/features/account/account-recovery.repository';
import AccountTokenRepository from '@/features/account/account-token.repository';
import UserEntity, { UserStatusEnum } from '@/features/user/user.entity';
import { getUserRepository } from '@/features/user/user.repository';
import BadRequestError from '@/lib/exceptions/bad-request.error';
import CustomError from '@/lib/exceptions/custom.error';
import NotAllowedError from '@/lib/exceptions/not-allowed.error';
import NotFoundError from '@/lib/exceptions/not-found.error';
import UnauthorizedError from '@/lib/exceptions/unauthorized.error';
import {
	compareMetaDataValue,
	createPastDate,
	getClientIp,
	tokenMetaData,
} from '@/lib/helpers';
import asyncHandler from '@/lib/helpers/async.handler';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';
import type { EmailTemplate } from '@/lib/types/template.type';
import type {
	AuthValidToken,
	ConfirmationTokenPayload,
} from '@/lib/types/token.type';

class AccountController {
	public register = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

		// Check permission (should not be authenticated)
		policy.register();

		// Validate against the schema
		const validated = AccountRegisterValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingUser = await getUserRepository()
			.createQuery()
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
		user.language = validated.data.language || res.locals.lang;

		const entry: UserEntity = await getUserRepository().save(user);

		res.locals.output.data(entry);
		res.locals.output.message(lang('account.success.register'));

		res.json(res.locals.output);
	});

	public login = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

		// Check permission (should not be authenticated)
		policy.login();

		// Validate against the schema
		const validated = AccountLoginValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const ipKey = `failed_login:ip:${getClientIp(req)}`;
		const emailKey = `failed_login:email:${validated.data.email}`;

		await policy.checkRateLimitOnLogin(ipKey, emailKey);

		const user = await getUserRepository()
			.createQuery()
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
			res.locals.output.message(
				lang('account.error.max_active_sessions'),
			);
			res.locals.output.data({
				authValidTokens: authValidTokens,
			});
		} else {
			const token = await setupToken(user, req);

			res.locals.output.message(lang('account.success.login'));
			res.locals.output.data({
				token: token,
			});
		}

		res.json(res.locals.output);
	});

	/**
	 * With this endpoint account tokens can be removed
	 * It is allowed to be used authenticated or not
	 *
	 * Practical aspects:
	 *      - On login (with valid credentials), if too many sessions are active, a list of tokens will be returned
	 *        in the response -> front-end implementation can allow token(s) to be removed before login retry
	 *      - From his account page the user could see all active tokens and allow removal
	 */
	public removeToken = asyncHandler(async (req: Request, res: Response) => {
		// Validate against the schema
		const validated = AccountRemoveTokenValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		await AccountTokenRepository.createQuery()
			.filterByIdent(validated.data.ident)
			.delete(false);

		res.locals.output.message(lang('account.success.token_deleted'));

		res.json(res.locals.output);
	});

	public logout = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

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

		res.locals.output.message(lang('account.success.logout'));

		res.json(res.locals.output);
	});

	public passwordRecover = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(res.locals.auth);

			// Check permission (should not be authenticated)
			policy.passwordRecover();

			// Validate against the schema
			const validated = AccountPasswordRecoverValidator().safeParse(
				req.body,
			);

			if (!validated.success) {
				res.locals.output.errors(validated.error.issues);

				throw new BadRequestError();
			}

			const user = await getUserRepository()
				.createQuery()
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
				user.language || res.locals.lang,
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

			res.locals.output.message(lang('account.success.password_recover'));

			res.json(res.locals.output);
		},
	);

	public passwordRecoverChange = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(res.locals.auth);

			// Check permission (should not be authenticated)
			policy.passwordRecoverChange();

			const ident = req.params.ident;

			// Validate against the schema
			const validated = AccountPasswordRecoverChangeValidator().safeParse(
				req.body,
			);

			if (!validated.success) {
				res.locals.output.errors(validated.error.issues);

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

			const user = await getUserRepository()
				.createQuery()
				.select(['id', 'name', 'email', 'language', 'status'])
				.filterById(recovery.user_id)
				.first();

			// User was not found or inactive
			if (!user || user.status !== UserStatusEnum.ACTIVE) {
				throw new NotFoundError(lang('account.error.not_found'));
			}

			// Update user password and remove all account tokens
			await updateUserPassword(user, validated.data.password);

			// Mark the recovery token as used
			await AccountRecoveryRepository.update(recovery.id, {
				used_at: new Date(),
			});

			const emailTemplate: EmailTemplate = await loadEmailTemplate(
				'password-change',
				user.language || res.locals.lang,
			);

			emailTemplate.content.vars = {
				name: user.name,
			};

			await queueEmail(emailTemplate, {
				name: user.name,
				address: user.email,
			});

			res.locals.output.message(lang('account.success.password_changed'));

			res.json(res.locals.output);
		},
	);

	public passwordUpdate = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(res.locals.auth);

			// Check permission (needs to be authenticated)
			policy.me();

			// Validate against the schema
			const validated = AccountPasswordUpdateValidator().safeParse(
				req.body,
			);

			if (!validated.success) {
				res.locals.output.errors(validated.error.issues);

				throw new BadRequestError();
			}

			const user = await getUserRepository()
				.createQuery()
				.select(['id', 'password'])
				.filterById(policy.getUserId())
				.firstOrFail();

			const isValidPassword: boolean = await verifyPassword(
				validated.data.password_current,
				user.password,
			);

			if (!isValidPassword) {
				res.locals.output.errors([
					{
						password_current: lang(
							'account.validation.password_invalid',
						),
					},
				]);

				throw new UnauthorizedError();
			}

			// Update user password and remove all account tokens
			await updateUserPassword(user, validated.data.password_new);

			// Generate new token
			const token = await setupToken(user, req);

			res.locals.output.message(lang('account.success.password_updated'));
			res.locals.output.data({
				token: token,
			});

			res.json(res.locals.output);
		},
	);

	/**
	 * This endpoint is used to confirm user email after account registration or email update
	 * It is allowed to be used authenticated or not
	 * ...and "Yes" - based on implementation (maybe auto-login after registration) - confirmation can take place even if logged in
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

		const user = await getUserRepository()
			.createQuery()
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

			await getUserRepository().save(user);

			res.locals.output.message(lang('account.success.email_updated'));
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

			await getUserRepository().save(user);

			res.locals.output.message(lang('account.success.email_confirmed'));
		}

		res.json(res.locals.output);
	});

	/**
	 * This endpoint is used to resend the confirmation email after account registration or email update
	 */
	public emailConfirmSend = asyncHandler(
		async (req: Request, res: Response) => {
			const policy = new AccountPolicy(res.locals.auth);

			// Check permission (should not be authenticated)
			policy.emailConfirmSend();

			// Validate against the schema
			const validated = AccountEmailConfirmSendValidator().safeParse(
				req.body,
			);

			if (!validated.success) {
				res.locals.output.errors(validated.error.issues);

				throw new BadRequestError();
			}

			const user = await getUserRepository()
				.createQuery()
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

			res.locals.output.message(
				lang('account.success.email_confirmation_sent'),
			);

			res.json(res.locals.output);
		},
	);

	public emailUpdate = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

		// Check permission (needs to be authenticated)
		policy.me();

		// Validate against the schema
		const validated = AccountEmailUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingUser = await getUserRepository()
			.createQuery()
			.filterByEmail(validated.data.email_new)
			.first();

		// Return error if email already in use by another account
		if (existingUser) {
			throw new CustomError(
				409,
				lang('account.error.email_already_used'),
			);
		}

		const user = await getUserRepository()
			.createQuery()
			.select(['id', 'name', 'email', 'language'])
			.filterById(policy.getUserId())
			.firstOrFail();

		// Send confirmation email
		await sendEmailConfirmUpdate(user, validated.data.email_new);

		res.locals.output.message(lang('account.success.email_update_request'));

		res.json(res.locals.output);
	});

	public me = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

		// Check permission (needs to be authenticated)
		policy.me();

		res.locals.output.data(res.locals.auth);

		res.json(res.locals.output);
	});

	/**
	 * Returns a list of all active sessions for the current user
	 */
	public sessions = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

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
				used_now: token.ident === res.locals.auth?.activeToken,
			};
		});

		res.locals.output.data(tokens);

		res.json(res.locals.output);
	});

	public edit = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

		// Check permission (needs to be authenticated)
		policy.me();

		const user_id = policy.getUserId();

		if (!user_id) {
			throw new NotAllowedError();
		}

		// Validate against the schema
		const validated = AccountEditValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const user = await getUserRepository()
			.createQuery()
			.select(['name', 'language'])
			.filterById(user_id)
			.firstOrFail();

		user.name = validated.data.name;
		user.language = validated.data.language;

		await getUserRepository().save(user);

		res.locals.output.message(lang('account.success.edit'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new AccountPolicy(res.locals.auth);

		// Check permission (needs to be authenticated)
		policy.me();

		const user_id = policy.getUserId();

		if (!user_id) {
			throw new NotAllowedError();
		}

		// Validate against the schema
		const validated = AccountDeleteValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const user = await getUserRepository()
			.createQuery()
			.select(['id', 'password'])
			.filterById(user_id)
			.firstOrFail();

		const isValidPassword: boolean = await verifyPassword(
			validated.data.password_current,
			user.password,
		);

		if (!isValidPassword) {
			res.locals.output.errors([
				{
					password_current: lang(
						'account.validation.password_invalid',
					),
				},
			]);

			throw new UnauthorizedError();
		}

		await getUserRepository().createQuery().filterById(user_id).delete();

		res.locals.output.message(lang('account.success.delete'));

		res.json(res.locals.output);
	});
}

export default new AccountController();
