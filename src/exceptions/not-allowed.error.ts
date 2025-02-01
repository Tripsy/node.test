import {HttpStatusCode} from '../types/http-status-code.type';

class NotAllowedError extends Error {
    public statusCode: HttpStatusCode;

    constructor() {
        super();

        this.message = 'Not Allowed';
        this.statusCode = 403;
    }
}

export default NotAllowedError;
