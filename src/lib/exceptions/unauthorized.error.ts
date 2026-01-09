import { Configuration } from '@/config/settings.config';
import { CustomError } from '@/lib/exceptions/custom.error';

export class UnauthorizedError extends CustomError {
	constructor(message?: string) {
		super(401);

		if (Configuration.get('app.debug')) {
			this.message = message ?? 'Unauthorized';
		} else {
			this.message = 'Unauthorized';
		}
	}
}
