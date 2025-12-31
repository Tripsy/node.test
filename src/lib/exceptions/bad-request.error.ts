import { CustomError } from '@/lib/exceptions/custom.error';

export class BadRequestError extends CustomError {
	constructor(message?: string) {
		super(400);

		this.message = message ?? 'Bad request';
	}
}
