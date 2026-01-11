import type { ConfirmationTokenPayload } from '@/features/account/account.service';
import type AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import type { AuthValidToken } from '@/features/account/account-token.service';
import {
	mockFutureDate,
	mockPastDate,
	mockUuid,
} from '@/tests/mocks/helpers.mock';

export function accountTokenMock(): AccountTokenEntity {
	return {
		id: 1,
		user_id: 1,
		ident: mockUuid(),
		created_at: mockPastDate(28800),
		used_at: mockPastDate(14400),
		expire_at: mockFutureDate(14400),
	};
}

export function accountRecoveryMock(): AccountRecoveryEntity {
	return {
		id: 1,
		user_id: 1,
		ident: mockUuid(),
		created_at: mockPastDate(28800),
		used_at: mockPastDate(14400),
		expire_at: mockFutureDate(14400),
	};
}

export function authValidTokenMock(): AuthValidToken {
	return {
		ident: 'some_ident',
		label: 'Windows',
		used_at: mockPastDate(7200),
		used_now: true,
	};
}

export function authActiveTokenMock(): AccountTokenEntity {
	return {
		id: 1,
		user_id: 1,
		ident: mockUuid(),
		created_at: mockPastDate(28800),
		used_at: mockPastDate(14400),
		expire_at: mockFutureDate(14400),
	};
}

export function confirmationTokenPayloadMock(): ConfirmationTokenPayload {
	return {
		user_id: 1,
		user_email: 'john.doe@example.com',
	};
}
