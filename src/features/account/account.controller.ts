import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { UserStatusEnum } from '@/features/user/user.entity';
import {
	BadRequestError,
	CustomError,
	NotAllowedError,
	NotFoundError,
	UnauthorizedError,
} from '@/lib/exceptions';
import {
	compareMetaDataValue,
	createPastDate,
	tokenMetaData,
} from '@/lib/helpers';
import asyncHandler from '@/lib/helpers/async.handler';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';
import type { EmailTemplate } from '@/lib/types/template.type';
import type {
	AuthValidToken,
	ConfirmationTokenPayload,
} from '@/lib/types/token.type';
import {BaseController} from "@/lib/abstracts/controller.abstract";
import type PolicyAbstract from "@/lib/abstracts/policy.abstract";
import {
    accountEmailService,
    accountRecoveryService,
    accountService,
    accountTokenService, IAccountEmailService, IAccountRecoveryService,
    IAccountService,
    IAccountTokenService
} from "@/features/account/account.service";
import {accountPolicy} from "@/features/account/account.policy";
import {
    accountValidator,
    AccountValidatorLoginDto, AccountValidatorPasswordRecoverChangeDto, AccountValidatorPasswordRecoverDto,
    AccountValidatorRegisterDto, AccountValidatorRemoveTokenDto,
    IAccountValidator
} from "@/features/account/account.validator";
import {IUserService, userService} from "@/features/user/user.service";

class AccountController extends BaseController {
    constructor(
        private policy: PolicyAbstract,
        private validator: IAccountValidator,
        private accountService: IAccountService,
        private accountTokenService: IAccountTokenService,
        private accountRecoveryService: IAccountRecoveryService,
        private accountEmailService: IAccountEmailService,
        private userService: IUserService,
    ) {
        super();
    }
	public register = asyncHandler(async (req: Request, res: Response) => {
        this.policy.notAuth(res.locals.auth);

        const data = this.validate<AccountValidatorRegisterDto>(
            this.validator.register(),
            req.body,
            res,
        );

        const entry = await this.accountService.register(data, res.locals.lang);

		res.locals.output.data(entry);
		res.locals.output.message(lang('account.success.register'));

		res.json(res.locals.output);
	});

	public login = asyncHandler(async (req: Request, res: Response) => {
        this.policy.notAuth(res.locals.auth);

        const data = this.validate<AccountValidatorLoginDto>(
            this.validator.login(),
            req.body,
            res,
        );

        const user = await this.userService.findByEmail(data.email);

        if (!user) {
            throw new NotFoundError(lang('account.error.not_found'));
        }

		if (user.status === UserStatusEnum.PENDING) {
			throw new CustomError(409, lang('account.error.pending_account'));
		}

		if (user.status === UserStatusEnum.INACTIVE) {
			throw new BadRequestError(lang('account.error.not_active'));
		}

		const isValidPassword: boolean = await this.accountService.checkPassword(
            data.password,
            user.password,
        );

		if (!isValidPassword) {
			throw new UnauthorizedError(lang('account.error.not_authorized'));
		}

		const authValidTokens: AuthValidToken[] = await this.accountTokenService.getAuthValidTokens(
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
			const token = await this.accountTokenService.setupAuthToken(user, req);

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
        const data = this.validate<AccountValidatorRemoveTokenDto>(
            this.validator.removeToken(),
            req.body,
            res,
        );

        await this.accountTokenService.removeAccountTokenByIdent(data.ident);

		res.locals.output.message(lang('account.success.token_deleted'));

		res.json(res.locals.output);
	});

	public logout = asyncHandler(async (req: Request, res: Response) => {
        this.policy.requiredAuth(res.locals.auth);

        const activeToken = await this.accountTokenService.getActiveAuthToken(req);

        if (activeToken) {
            await this.accountTokenService.removeAccountTokenByIdent(activeToken.ident);
        }

		res.locals.output.message(lang('account.success.logout'));

		res.json(res.locals.output);
	});

	public passwordRecover = asyncHandler(
		async (req: Request, res: Response) => {
            this.policy.notAuth(res.locals.auth);

            const data = this.validate<AccountValidatorPasswordRecoverDto>(
                this.validator.passwordRecover(),
                req.body,
                res,
            );

            const user = await this.userService.findByEmail(data.email, ['id', 'name', 'email', 'language', 'status']);

            if (!user) {
                throw new NotFoundError(lang('account.error.not_found'));
            }

			if (user.status !== UserStatusEnum.ACTIVE) {
				throw new NotFoundError(lang('account.error.not_active'));
			}

			const countRecoveryAttempts: number = await this.accountRecoveryService.countRecoveryAttempts(user.id, createPastDate(6 * 60 * 60));

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
			const [ident, expire_at] = await this.accountRecoveryService.setupRecovery(user, metadata);

            await this.accountEmailService.sendEmailPasswordRecover({
                ...user,
                language: user.language || res.locals.lang,
            }, {
                ident: ident,
                expire_at: expire_at,
            });

			res.locals.output.message(lang('account.success.password_recover'));

			res.json(res.locals.output);
		},
	);

	public passwordRecoverChange = asyncHandler(
		async (req: Request, res: Response) => {
            this.policy.notAuth(res.locals.auth);

            const data = this.validate<AccountValidatorPasswordRecoverChangeDto>(
                this.validator.passwordRecoverChange(),
                req.body,
                res,
            );

            const recovery = await this.accountRecoveryService.findByIdent(res.locals.validate.ident);

            if (!recovery) {
                throw new NotFoundError(lang('account.error.recovery_token_not_authorized'));
            }

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
                    !recovery.metadata ||
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

            const user = await this.userService.findById(recovery.user_id, false);

            if (!user) {
                throw new NotFoundError(lang('account.error.not_found'));
            }

            if (user.status !== UserStatusEnum.ACTIVE) {
                throw new NotFoundError(lang('account.error.not_active'));
            }

            // Update user password and remove all account tokens
            await this.accountService.updatePassword(user, data.password);

            ???

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
            this.policy.requiredAuth(res.locals.auth);

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

			const isValidPassword: boolean = await checkPassword(
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
			await updatePassword(user, validated.data.password_new);

			// Generate new token
			const token = await setupAuthToken(user, req);

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
	public emailConfirm = asyncHandler(async (_req: Request, res: Response) => {
		const token = decodeURIComponent(res.locals.validated.token);

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
            this.policy.notAuth(res.locals.auth);

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
        this.policy.requiredAuth(res.locals.auth);

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
        this.policy.requiredAuth(res.locals.auth);

		res.locals.output.data(res.locals.auth);

		res.json(res.locals.output);
	});

	/**
	 * Returns a list of all active sessions for the current user
	 */
	public sessions = asyncHandler(async (_req: Request, res: Response) => {
        this.policy.requiredAuth(res.locals.auth);

		const user_id = policy.getUserId();

		// if (!user_id) {
		// 	throw new NotAllowedError();
		// }

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
        this.policy.requiredAuth(res.locals.auth);

		const validated = AccountEditValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const user = await getUserRepository()
			.createQuery()
			.select(['name', 'language'])
			.filterById(this.policy.getId(res.locals.auth))
			.firstOrFail();

		user.name = validated.data.name;
		user.language = validated.data.language;

		await getUserRepository().save(user);

		res.locals.output.message(lang('account.success.edit'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
        this.policy.requiredAuth(res.locals.auth);

		const user_id = this.policy.getId(res.locals.auth);

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

		const isValidPassword: boolean = await checkPassword(
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

export function createAccountController(deps: {
    policy: PolicyAbstract;
    validator: IAccountValidator;
    accountService: IAccountService;
    accountTokenService: IAccountTokenService;
    accountRecoveryService: IAccountRecoveryService;
    accountEmailService: IAccountEmailService;
    userService: IUserService;
}) {
    return new AccountController(
        deps.policy,
        deps.validator,
        deps.accountService,
        deps.accountTokenService,
        deps.accountRecoveryService,
        deps.accountEmailService,
        deps.userService,
    );
}

export const accountController = createAccountController({
    policy: accountPolicy,
    validator: accountValidator,
    accountService: accountService,
    accountTokenService: accountTokenService,
    accountRecoveryService: accountRecoveryService,
    accountEmailService: accountEmailService,
    userService: userService,
});