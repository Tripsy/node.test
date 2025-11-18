import { cfg } from '@/config/settings.config';
import CustomError from '@/exceptions/custom.error';

class NotAllowedError extends CustomError {
	constructor(message?: string) {
		super(403);

		if (cfg('app.debug')) {
			this.message = message ?? 'Not Allowed';
		} else {
			this.message = 'Not Allowed';
		}
	}
}

export default NotAllowedError;
