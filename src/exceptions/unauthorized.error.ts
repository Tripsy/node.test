import CustomError from './custom.error';

class UnauthorizedError extends CustomError {
    constructor(message?: string) {
        super(401);

        this.message = message ?? 'Unauthorized';
    }
}

export default UnauthorizedError;
