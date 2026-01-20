import type { ConfirmationTokenPayload } from '@/features/account/account.service';
import type { AccountValidator } from '@/features/account/account.validator';
import type AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import type { AuthValidToken } from '@/features/account/account-token.service';
import { defineValidatorPayloads } from '@/tests/jest-validator.setup';
import {
	mockFutureDate,
	mockPastDate,
	mockUuid,
} from '@/tests/mocks/helpers.mock';

export const accountTokenMock: AccountTokenEntity = {
	id: 1,
	user_id: 1,
	ident: mockUuid(),
	created_at: mockPastDate(28800),
	used_at: mockPastDate(14400),
	expire_at: mockFutureDate(14400),
};

export const accountRecoveryMock: AccountRecoveryEntity = {
	id: 1,
	user_id: 1,
	ident: mockUuid(),
	created_at: mockPastDate(28800),
	used_at: mockPastDate(14400),
	expire_at: mockFutureDate(14400),
};

export const authValidTokenMock: AuthValidToken = {
	ident: 'some_ident',
	label: 'Windows',
	used_at: mockPastDate(7200),
	used_now: true,
};

export const authActiveTokenMock: AccountTokenEntity = {
	id: 1,
	user_id: 1,
	ident: mockUuid(),
	created_at: mockPastDate(28800),
	used_at: mockPastDate(14400),
	expire_at: mockFutureDate(14400),
};

export const confirmationTokenPayloadMock: ConfirmationTokenPayload = {
	user_id: 1,
	user_email: 'john.doe@example.com',
};

export const accountPayloads = defineValidatorPayloads<
	AccountValidator,
	| 'register'
	| 'login'
	| 'passwordRecover'
	| 'passwordRecoverChange'
	| 'passwordUpdate'
	| 'emailConfirmSend'
	| 'emailUpdate'
	| 'removeToken'
	| 'meEdit'
	| 'meDelete'
>({
	register: {
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'Secure@123',
		password_confirm: 'Secure@123',
		language: 'en',
	},
	login: {
		email: 'john.doe@example.com',
		password: 'Secure@123',
	},
	passwordRecover: {
		email: 'john.doe@example.com',
	},
	passwordRecoverChange: {
		password: 'Secure@123',
		password_confirm: 'Secure@123',
	},
	passwordUpdate: {
		password_current: 'Secure@123',
		password_new: 'NewStuff@123',
		password_confirm: 'NewStuff@123',
	},
	emailConfirmSend: {
		email: 'john.doe@example.com',
	},
	emailUpdate: {
		email_new: 'john.doe@example.com',
	},
	removeToken: {
		ident: mockUuid(),
	},
	meEdit: {
		name: 'John Doe',
		language: 'en',
	},
	meDelete: {
		password_current: 'Secure@123',
	},
});
