import { Configuration } from '@/config/settings.config';
import { CustomError } from '@/exceptions/custom.error';

export class NotAllowedError extends CustomError {
	constructor(message?: string) {
		super(403);

		if (Configuration.get('app.debug')) {
			this.message = message ?? 'Not Allowed';
		} else {
			this.message = 'Not Allowed';
		}
	}
}
