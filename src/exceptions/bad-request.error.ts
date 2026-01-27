import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions/custom.error';

export class BadRequestError extends CustomError {
	constructor(message?: string) {
		super(400);

		this.message = message ?? lang('shared.error.check_errors');
	}
}
