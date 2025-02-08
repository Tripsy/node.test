import {HttpStatusCode} from '../types/http-status-code.type';

class CustomError extends Error {
    public statusCode: number;

    constructor(statusCode: HttpStatusCode, message?: string) {
        super();

        this.message = message ?? 'Error';
        this.statusCode = statusCode;
    }
}

export default CustomError;
