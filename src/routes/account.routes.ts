import {Router} from 'express';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import AccountController from '../controllers/account.controller';

const routes: Router = Router();
const routePrefix = '/account';

// Account - Login
routes.post(
    routePrefix,
    [
        metaDocumentation('account', 'login')
    ],
    AccountController.login
);

// Account - Logout
routes.delete(
    routePrefix,
    [
        metaDocumentation('account', 'logout')
    ],
    AccountController.logout
);

// User - Recover password
routes.post(
    `${routePrefix}/password-recover`,
    [
        metaDocumentation('account', 'password-recover'),
    ],
    AccountController.passwordRecover
);

// User - Change password
routes.post(
    `${routePrefix}/password-change`,
    [
        metaDocumentation('account', 'password-change'),
    ],
    AccountController.passwordChange
);

export default routes;
