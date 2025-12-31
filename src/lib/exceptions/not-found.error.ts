import { CustomError } from '@/lib/exceptions/custom.error';

export class NotFoundError extends CustomError {
	constructor(message?: string) {
		super(404);

		this.message = message ?? 'Not Found';
	}
}
