import CustomError from './custom.error';

class NotAllowedError extends CustomError {
    constructor() {
        super(403);

        this.message = 'Not Allowed';
    }
}

export default NotAllowedError;
