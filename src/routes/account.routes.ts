import {Router} from 'express';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import AccountController from '../controllers/account.controller';

const routes: Router = Router();
const routePrefix = '/account';

// Account - Register
routes.post(
    `${routePrefix}/register`,
    [
        metaDocumentation('account', 'register')
    ],
    AccountController.register
);

// Account - Login
routes.post(
    `${routePrefix}/login`,
    [
        metaDocumentation('account', 'login')
    ],
    AccountController.login
);

// Account - Remove token
routes.delete(
    `${routePrefix}/token`,
    [
        metaDocumentation('account', 'removeToken')
    ],
    AccountController.removeToken
);

// Account - Logout
routes.delete(
    `${routePrefix}/logout`,
    [
        metaDocumentation('account', 'logout')
    ],
    AccountController.logout
);

// Account - Recover password
routes.post(
    `${routePrefix}/password-recover`,
    [
        metaDocumentation('account', 'password-recover'),
    ],
    AccountController.passwordRecover
);

// Account - Change password based on recovery token
routes.post(
    `${routePrefix}/password-recover-change/:ident`,
    [
        metaDocumentation('account', 'password-recover-change'),
    ],
    AccountController.passwordRecoverChange
);

// Account - Update password (when logged in based on old password)
routes.post(
    `${routePrefix}/password-update`,
    [
        metaDocumentation('account', 'password-update'),
    ],
    AccountController.passwordUpdate
);

// Account - Confirm email
routes.post(
    `${routePrefix}/email-confirm/:token`,
    [
        metaDocumentation('account', 'email-confirm'),
    ],
    AccountController.emailConfirm
);

// Account - Update email
routes.post(
    `${routePrefix}/email-update`,
    [
        metaDocumentation('account', 'email-update'),
    ],
    AccountController.emailUpdate
);

export default routes;