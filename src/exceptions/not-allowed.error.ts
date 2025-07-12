import CustomError from './custom.error';
import {cfg} from '../config/settings.config';

class NotAllowedError extends CustomError {
    constructor(message?: string) {
        super(403);

        if (cfg('app.debug')) {
            this.message = message ?? 'Not Allowed';
        } else {
            this.message = 'Not Allowed';
        }
    }
}

export default NotAllowedError;
