import { CustomError } from '@/exceptions/custom.error';

export class BadRequestError extends CustomError {
	constructor(message?: string) {
		super(400);

		this.message = message ?? 'Bad request';
	}
}
