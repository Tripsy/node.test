import bcrypt from 'bcrypt';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { Repository } from 'typeorm/repository/Repository';
import { v4 as uuid } from 'uuid';
import { cfg } from '@/config/settings.config';
import AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import {
	type AccountRecoveryQuery,
	getAccountRecoveryRepository,
} from '@/features/account/account-recovery.repository';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import {
	type AccountTokenQuery,
	getAccountTokenRepository,
} from '@/features/account/account-token.repository';
import type UserEntity from '@/features/user/user.entity';
import { type IUserService, userService } from '@/features/user/user.service';
import {
	createFutureDate,
	getErrorMessage,
	getMetaDataValue,
	type TokenMetadata,
	tokenMetaData,
} from '@/lib/helpers';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';
import type { EmailTemplate } from '@/lib/types/template.type';
import type {
	AuthTokenPayload,
	AuthValidToken,
	ConfirmationTokenPayload,
} from '@/lib/types/token.type';

export interface IAccountRecoveryService {
	setupRecovery(
		user: Partial<UserEntity> & { id: number },
		metadata: TokenMetadata,
	): Promise<[string, Date]>;

	removeAccountRecoveryForUser(user_id: number): Promise<void>;
}

class AccountRecoveryService implements IAccountRecoveryService {
	constructor(
		private accountRecoveryRepository: Repository<AccountRecoveryEntity> & {
			createQuery(): AccountRecoveryQuery;
		},
	) {}

	/**
	 * @description Creates a new recovery token via repository
	 */
	public async setupRecovery(
		user: Partial<UserEntity> & { id: number },
		metadata: TokenMetadata,
	): Promise<[string, Date]> {
		const ident: string = uuid();
		const expire_at = createFutureDate(
			cfg('user.recoveryIdentExpiresIn') as number,
		);

		const accountRecoveryEntity = new AccountRecoveryEntity();
		accountRecoveryEntity.user_id = user.id;
		accountRecoveryEntity.ident = ident;
		accountRecoveryEntity.metadata = metadata;
		accountRecoveryEntity.expire_at = expire_at;

		await this.accountRecoveryRepository.save(accountRecoveryEntity);

		return [ident, expire_at];
	}

	/**
	 * @description Removes all recovery tokens for a user
	 */
	public async removeAccountRecoveryForUser(user_id: number): Promise<void> {
		await this.accountRecoveryRepository
			.createQuery()
			.filterBy('user_id', user_id)
			.delete(false, true);
	}
}

export interface IAccountService {
	encryptPassword(password: string): Promise<string>;

	checkPassword(password: string, hashedPassword: string): Promise<boolean>;

	updatePassword(user: UserEntity, password: string): Promise<void>;
}

class AccountService implements IAccountService {
	constructor(
		private userService: IUserService,
		private accountRecoveryService: IAccountRecoveryService,
	) {}

	/**
	 * @description Encrypts a password
	 */
	public async encryptPassword(password: string): Promise<string> {
		return await bcrypt.hash(password, 10);
	}

	/**
	 * @description Checks if a password matches a hashed password
	 */
	public async checkPassword(
		password: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	/**
	 * @description Updates a user password and removes all recovery tokens for a user
	 */
	public async updatePassword(
		user: UserEntity,
		password: string,
	): Promise<void> {
		user.password = password; // Encryption it handled in subscriber
		user.password_updated_at = new Date();

		await this.userService.update({
			id: user.id,
			password: password,
			password_updated_at: new Date(),
		});

		await this.accountRecoveryService.removeAccountRecoveryForUser(user.id);
	}
}

export interface IAccountEmailService {
	sendEmailConfirmCreate(user: {
		id: number;
		name: string;
		email: string;
		language: string;
	}): Promise<void>;

	sendEmailConfirmUpdate(
		user: {
			id: number;
			name: string;
			email: string;
			language: string;
		},
		email_new: string,
	): Promise<void>;

	sendWelcomeEmail(user: {
		name: string;
		email: string;
		language: string;
	}): Promise<void>;
}

class AccountEmailService implements IAccountEmailService {
	constructor(private accountTokenService: IAccountTokenService) {}

	public async sendEmailConfirmUpdate(
		user: Partial<UserEntity> & {
			id: number;
			name: string;
			email: string;
			language: string;
		},
		email_new: string,
	): Promise<void> {
		const { token, expire_at } =
			this.accountTokenService.createConfirmationToken(user, email_new);

		const emailTemplate: EmailTemplate = await loadEmailTemplate(
			'email-confirm-update',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
			token: encodeURIComponent(token),
			expire_at: expire_at.toISOString(),
		};

		await queueEmail(emailTemplate, {
			name: user.name,
			address: email_new,
		});
	}

	public async sendWelcomeEmail(
		user: Partial<UserEntity> & {
			name: string;
			email: string;
			language: string;
		},
	): Promise<void> {
		const emailTemplate: EmailTemplate = await loadEmailTemplate(
			'email-welcome',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
		};

		await queueEmail(emailTemplate, {
			name: user.name,
			address: user.email,
		});
	}

	public async sendEmailConfirmCreate(
		user: Partial<UserEntity> & {
			id: number;
			name: string;
			email: string;
			language: string;
		},
	): Promise<void> {
		const { token, expire_at } =
			this.accountTokenService.createConfirmationToken(user);

		const emailTemplate: EmailTemplate = await loadEmailTemplate(
			'email-confirm-create',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
			token: encodeURIComponent(token),
			expire_at: expire_at.toISOString(),
		};

		await queueEmail(emailTemplate, {
			name: user.name,
			address: user.email,
		});
	}
}

export interface IAccountTokenService {
	getAuthTokenFromHeaders(req: Request): string | undefined;

	getActiveAuthToken(req: Request): Promise<AccountTokenEntity>;

	generateAuthToken(user: Partial<UserEntity> & { id: number }): {
		token: string;
		ident: string;
		expire_at: Date;
	};

	setupAuthToken(
		user: Partial<UserEntity> & { id: number },
		req: Request,
	): Promise<string>;

	removeAccountTokenForUser(user_id: number): Promise<void>;

	getAuthValidTokens(user_id: number): Promise<AuthValidToken[]>;

	createConfirmationToken(
		user: Partial<UserEntity> & { id: number; email: string },
		email_new?: string,
	): {
		token: string;
		expire_at: Date;
	};
}

class AccountTokenService implements IAccountTokenService {
	constructor(
		private accountTokenRepository: Repository<AccountTokenEntity> & {
			createQuery(): AccountTokenQuery;
		},
	) {}

	/**
	 * @description Gets the auth token from the request headers
	 * @param req
	 */
	public getAuthTokenFromHeaders(req: Request): string | undefined {
		return req.headers.authorization?.split(' ')[1];
	}

	/**
	 * @description Gets the active auth token from the request headers
	 */
	public async getActiveAuthToken(req: Request): Promise<AccountTokenEntity> {
		// Read the token from the request
		const token: string | undefined = this.getAuthTokenFromHeaders(req);

		if (!token) {
			throw new Error('Token not found');
		}

		// Verify JWT and extract payload
		let payload: AuthTokenPayload;

		try {
			payload = jwt.verify(
				token,
				cfg('user.authSecret') as string,
			) as AuthTokenPayload;
		} catch (err) {
			throw new Error(`Unable to verify token ${getErrorMessage(err)}`);
		}

		const activeToken = await this.accountTokenRepository
			.createQuery()
			.filterByIdent(payload.ident)
			.filterBy('user_id', payload.user_id)
			.first();

		if (!activeToken) {
			throw new Error('No active token found');
		}

		return activeToken;
	}

	/**
	 * @description Generates a new auth token
	 */
	public generateAuthToken(user: Partial<UserEntity> & { id: number }): {
		token: string;
		ident: string;
		expire_at: Date;
	} {
		if (!user.id) {
			throw new Error('User object must contain `id` property.');
		}

		const ident: string = uuid();
		const expire_at: Date = createFutureDate(
			cfg('user.authExpiresIn') as number,
		);

		const payload: AuthTokenPayload = {
			user_id: user.id,
			ident: ident,
		};

		const token = jwt.sign(payload, cfg('user.authSecret') as string);

		return { token, ident, expire_at };
	}

	/**
	 * @description Gets the valid auth tokens for a user via repository
	 */
	public async getAuthValidTokens(
		user_id: number,
	): Promise<AuthValidToken[]> {
		const authValidTokens = await this.accountTokenRepository
			.createQuery()
			.select(['id', 'ident', 'metadata', 'used_at'])
			.filterBy('user_id', user_id)
			.filterByRange('expire_at', new Date())
			.all();

		return authValidTokens.map((token) => {
			return {
				ident: token.ident,
				label: token.metadata
					? getMetaDataValue(token.metadata, 'user-agent')
					: '',
				used_at: token.used_at,
				used_now: false,
			};
		});
	}

	/**
	 * @description Creates a new auth token via repository
	 */
	private createAuthToken(
		data: Partial<AccountTokenEntity>,
	): Promise<AccountTokenEntity> {
		const entry = {
			user_id: data.user_id,
			ident: data.ident,
			metadata: data.metadata,
			used_at: data.used_at,
			expire_at: data.expire_at,
		};

		return this.accountTokenRepository.save(entry);
	}

	/**
	 * @description Generate a new auth token and returns the token
	 */
	public async setupAuthToken(
		user: Partial<UserEntity> & { id: number },
		req: Request,
	): Promise<string> {
		const { token, ident, expire_at } = this.generateAuthToken(user);

		await this.createAuthToken({
			user_id: user.id,
			ident: ident,
			metadata: tokenMetaData(req),
			used_at: new Date(),
			expire_at: expire_at,
		});

		return token;
	}

	/**
	 * @description Removes all auth tokens for a user
	 */
	public async removeAccountTokenForUser(user_id: number): Promise<void> {
		await this.accountTokenRepository
			.createQuery()
			.filterBy('user_id', user_id)
			.delete(false, true);
	}

	/**
	 * This method has a double utility:
	 *  - creates a JWT token which is used to confirm the email address of the user on account creation
	 *  - creates a JWT token which is used to confirm the email address of the user on email update
	 *
	 * @param user
	 * @param email_new
	 */
	public createConfirmationToken(
		user: Partial<UserEntity> & {
			id: number;
			email: string;
		},
		email_new?: string,
	): {
		token: string;
		expire_at: Date;
	} {
		if (!user.id || !user.email) {
			throw new Error(
				'User object must contain both `id` and `email` properties.',
			);
		}

		const payload: ConfirmationTokenPayload = {
			user_id: user.id,
			user_email: user.email,
			user_email_new: email_new,
		};

		const token = jwt.sign(
			payload,
			cfg('user.emailConfirmationSecret') as string,
			{
				expiresIn:
					(cfg('user.emailConfirmationExpiresIn') as number) * 86400,
			},
		);

		const expire_at = createFutureDate(
			(cfg('user.emailConfirmationExpiresIn') as number) * 86400,
		);

		return { token, expire_at };
	}
}

export const accountRecoveryService = new AccountRecoveryService(
	getAccountRecoveryRepository(),
);

export const accountService = new AccountService(
	userService,
	accountRecoveryService,
);

export const accountTokenService = new AccountTokenService(
	getAccountTokenRepository(),
);

export const accountEmailService = new AccountEmailService(accountTokenService);
