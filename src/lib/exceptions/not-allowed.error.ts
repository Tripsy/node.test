import { cfg } from '@/config/settings.config';
import { CustomError } from '@/lib/exceptions/custom.error';

export class NotAllowedError extends CustomError {
	constructor(message?: string) {
		super(403);

		if (cfg('app.debug')) {
			this.message = message ?? 'Not Allowed';
		} else {
			this.message = 'Not Allowed';
		}
	}
}
