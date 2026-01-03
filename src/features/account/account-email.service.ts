import type AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import type UserEntity from '@/features/user/user.entity';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';

export interface IAccountEmailService {
	sendEmailConfirmCreate(
		user: {
			id: number;
			name: string;
			email: string;
			language: string;
		},
		token: string,
		expire_at: Date,
	): Promise<void>;

	sendEmailConfirmUpdate(
		user: {
			id: number;
			name: string;
			email: string;
			language: string;
		},
		token: string,
		expire_at: Date,
		email_new: string,
	): Promise<void>;

	sendWelcomeEmail(user: {
		name: string;
		email: string;
		language: string;
	}): Promise<void>;

	sendEmailPasswordRecover(
		user: {
			name: string;
			email: string;
			language: string;
		},
		token: {
			ident: string;
			expire_at: Date;
		},
	): Promise<void>;

	sendEmailPasswordChange(user: {
		name: string;
		email: string;
		language: string;
	}): Promise<void>;
}

class AccountEmailService implements IAccountEmailService {
	public async sendEmailConfirmUpdate(
		user: Partial<UserEntity> & {
			id: number;
			name: string;
			email: string;
			language: string;
		},
		token: string,
		expire_at: Date,
		email_new: string,
	): Promise<void> {
		const emailTemplate = await loadEmailTemplate(
			'email-confirm-update',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
			token: encodeURIComponent(token),
			expire_at: expire_at.toISOString(),
		};

		void queueEmail(emailTemplate, {
			name: user.name,
			address: email_new,
		});
	}

	public async sendEmailConfirmCreate(
		user: Partial<UserEntity> & {
			id: number;
			name: string;
			email: string;
			language: string;
		},
		token: string,
		expire_at: Date,
	): Promise<void> {
		const emailTemplate = await loadEmailTemplate(
			'email-confirm-create',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
			token: encodeURIComponent(token),
			expire_at: expire_at.toISOString(),
		};

		void queueEmail(emailTemplate, {
			name: user.name,
			address: user.email,
		});
	}

	public async sendWelcomeEmail(
		user: Partial<UserEntity> & {
			name: string;
			email: string;
			language: string;
		},
	): Promise<void> {
		const emailTemplate = await loadEmailTemplate(
			'email-welcome',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
		};

		void queueEmail(emailTemplate, {
			name: user.name,
			address: user.email,
		});
	}

	public async sendEmailPasswordRecover(
		user: Partial<UserEntity> & {
			name: string;
			email: string;
			language: string;
		},
		token: Partial<AccountRecoveryEntity> & {
			ident: string;
			expire_at: Date;
		},
	): Promise<void> {
		const emailTemplate = await loadEmailTemplate(
			'password-recover',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
			ident: token.ident,
			expire_at: token.expire_at.toISOString(),
		};

		void queueEmail(emailTemplate, {
			name: user.name,
			address: user.email,
		});
	}

	public async sendEmailPasswordChange(
		user: Partial<UserEntity> & {
			name: string;
			email: string;
			language: string;
		},
	): Promise<void> {
		const emailTemplate = await loadEmailTemplate(
			'password-change',
			user.language,
		);

		emailTemplate.content.vars = {
			name: user.name,
		};

		void queueEmail(emailTemplate, {
			name: user.name,
			address: user.email,
		});
	}
}

export const accountEmailService = new AccountEmailService();
