import type { HttpStatusCode } from '../types/http-status-code.type';

class CustomError extends Error {
	public statusCode: HttpStatusCode;

	constructor(statusCode: HttpStatusCode, message?: string) {
		super();

		this.message = message ?? 'Error';
		this.statusCode = statusCode;
	}
}

export default CustomError;
