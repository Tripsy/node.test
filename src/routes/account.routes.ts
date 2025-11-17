import { Router } from 'express';
import { routesConfig } from '../config/init-routes.config';
import AccountController from '../controllers/account.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';

const routes: Router = Router();

// Account - Register
routes.post(
	routesConfig.account.register,
	[metaDocumentation('account', 'register')],
	AccountController.register,
);

// Account - Login
routes.post(
	routesConfig.account.login,
	[metaDocumentation('account', 'login')],
	AccountController.login,
);

// Account - Remove token
routes.delete(
	routesConfig.account.removeToken,
	[metaDocumentation('account', 'removeToken')],
	AccountController.removeToken,
);

// Account - Logout
routes.delete(
	routesConfig.account.logout,
	[metaDocumentation('account', 'logout')],
	AccountController.logout,
);

// Account - Recover password
routes.post(
	routesConfig.account.passwordRecover,
	[metaDocumentation('account', 'password-recover')],
	AccountController.passwordRecover,
);

// Account - Change password based on recovery token
routes.post(
	routesConfig.account.passwordRecoverChange,
	[metaDocumentation('account', 'password-recover-change')],
	AccountController.passwordRecoverChange,
);

// Account - Update password (when logged in based on old password)
routes.post(
	routesConfig.account.passwordUpdate,
	[metaDocumentation('account', 'password-update')],
	AccountController.passwordUpdate,
);

// Account - Confirm email
routes.post(
	routesConfig.account.emailConfirm,
	[metaDocumentation('account', 'email-confirm')],
	AccountController.emailConfirm,
);

// Account - Update email
routes.post(
	routesConfig.account.emailUpdate,
	[metaDocumentation('account', 'email-update')],
	AccountController.emailUpdate,
);

// Account - Get details
routes.get(
	routesConfig.account.details,
	[metaDocumentation('account', 'details')],
	AccountController.details,
);

export default routes;
