import CustomError from './custom.error';

class NotFoundError extends CustomError {
	constructor(message?: string) {
		super(404);

		this.message = message ?? 'Not Found';
	}
}

export default NotFoundError;
