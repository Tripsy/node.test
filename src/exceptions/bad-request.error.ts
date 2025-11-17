import CustomError from './custom.error';

class BadRequestError extends CustomError {
	constructor(message?: string) {
		super(400);

		this.message = message ?? 'Bad request';
	}
}

export default BadRequestError;
