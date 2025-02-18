import CustomError from './custom.error';
import {settings} from '../config/settings.config';

class NotAllowedError extends CustomError {
    constructor(message?: string) {
        super(403);

        if (settings.app.debug) {
            this.message = message ?? 'Not Allowed';
        } else {
            this.message = 'Not Allowed';
        }
    }
}

export default NotAllowedError;
