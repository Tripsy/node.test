import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import type { AccountValidatorRegisterDto } from '@/features/account/account.validator';
import {
	type AccountEmailService,
	accountEmailService,
} from '@/features/account/account-email.service';
import {
	type AccountRecoveryService,
	accountRecoveryService,
} from '@/features/account/account-recovery.service';
import type UserEntity from '@/features/user/user.entity';
import { UserStatusEnum } from '@/features/user/user.entity';
import { type UserService, userService } from '@/features/user/user.service';
import { BadRequestError, CustomError } from '@/lib/exceptions';
import { createFutureDate } from '@/lib/helpers';

export type ConfirmationTokenPayload = {
	user_id: number;
	user_email: string;
	user_email_new?: string;
};

export class AccountService {
	constructor(
		private userService: UserService,
		private accountRecoveryService: AccountRecoveryService,
		private accountEmailService: AccountEmailService,
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

	public async register(
		data: AccountValidatorRegisterDto,
		language: string,
	): Promise<UserEntity> {
		const existingUser = await this.userService.findByEmail(
			data.email,
			true,
		);

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

		return this.userService.register({
			name: data.name,
			email: data.email,
			password: data.password,
			language: data.language || language,
		});
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

	public processEmailConfirmCreate(
		user: Partial<UserEntity> & {
			id: number;
			name: string;
			email: string;
			language: string;
			status: UserStatusEnum;
		},
	): void {
		const { token, expire_at } = this.createConfirmationToken(user);

		void this.accountEmailService.sendEmailConfirmCreate(
			user,
			token,
			expire_at,
		);
	}

	public processRegistration(
		user: Partial<UserEntity> & {
			id: number;
			name: string;
			email: string;
			language: string;
			status: UserStatusEnum;
		},
	): void {
		switch (user.status) {
			case UserStatusEnum.ACTIVE:
				void this.accountEmailService.sendWelcomeEmail(user);
				break;
			case UserStatusEnum.PENDING:
				void this.processEmailConfirmCreate(user);
				break;
		}
	}
}

export const accountService = new AccountService(
	userService,
	accountRecoveryService,
	accountEmailService,
);
