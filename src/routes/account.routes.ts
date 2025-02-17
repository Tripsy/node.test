import {Router} from 'express';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import AccountController from '../controllers/account.controller';
import validateParamId from '../middleware/param-id.middleware';

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

// Account - Remove token
routes.delete(
    `${routePrefix}/token/:id`,
    [
        metaDocumentation('account', 'removeToken'),
        validateParamId
    ],
    AccountController.removeToken
);

// Account - Logout
routes.delete(
    routePrefix,
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

// Account - Change password
routes.post(
    `${routePrefix}/password-change/:ident`,
    [
        metaDocumentation('account', 'password-change'),
    ],
    AccountController.passwordChange
);

export default routes;