import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import AccountController from '@/features/account/account.controller';

export const accountRoutesBasePath: string = '/account';
export const accountRoutesConfig: RoutesConfigType<typeof AccountController> = {
	register: {
		path: '/register',
		method: 'post',
		action: 'register',
	},
	login: {
		path: '/login',
		method: 'post',
		action: 'login',
	},
	'remove-token': {
		path: '/token',
		method: 'delete',
		action: 'removeToken',
	},
	logout: {
		path: '/logout',
		method: 'delete',
		action: 'logout',
	},
	'password-recover': {
		path: '/password-recover',
		method: 'post',
		action: 'passwordRecover',
	},
	'password-recover-change': {
		path: '/password-recover-change/:ident',
		method: 'post',
		action: 'passwordRecoverChange',
	},
	'password-update': {
		path: '/password-update',
		method: 'post',
		action: 'passwordUpdate',
	},
	'email-confirm': {
		path: '/email-confirm/:token',
		method: 'post',
		action: 'emailConfirm',
	},
	'email-update': {
		path: '/email-update',
		method: 'post',
		action: 'emailUpdate',
	},
	details: {
		path: '/details',
		method: 'get',
		action: 'details',
	},
};

const routes: Router = Router();

buildRoutes(
	routes,
	AccountController,
	'account',
	accountRoutesConfig,
	accountRoutesBasePath,
);

export default routes;
