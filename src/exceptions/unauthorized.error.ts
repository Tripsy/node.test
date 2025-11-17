import { cfg } from '../config/settings.config';
import CustomError from './custom.error';

class UnauthorizedError extends CustomError {
	constructor(message?: string) {
		super(401);

		if (cfg('app.debug')) {
			this.message = message ?? 'Unauthorized';
		} else {
			this.message = 'Unauthorized';
		}
	}
}

export default UnauthorizedError;
