import { jest } from '@jest/globals';
import { accountEmailService } from '@/features/account/account-email.service';

export function mockAccountEmailService() {
	jest.spyOn(
		accountEmailService,
		'sendEmailConfirmUpdate',
	).mockImplementation(() => Promise.resolve());
	jest.spyOn(
		accountEmailService,
		'sendEmailConfirmCreate',
	).mockImplementation(() => Promise.resolve());
	jest.spyOn(accountEmailService, 'sendWelcomeEmail').mockImplementation(() =>
		Promise.resolve(),
	);
	jest.spyOn(
		accountEmailService,
		'sendEmailPasswordRecover',
	).mockImplementation(() => Promise.resolve());
	jest.spyOn(
		accountEmailService,
		'sendEmailPasswordChange',
	).mockImplementation(() => Promise.resolve());
}
