import AccountController from '@/features/account/account.controller';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/account',
	documentation: 'account',
	controller: AccountController,
	routesConfig: {
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
		'email-confirm-send': {
			path: '/email-confirm-send',
			method: 'post',
			action: 'emailConfirmSend',
		},
		'email-update': {
			path: '/email-update',
			method: 'post',
			action: 'emailUpdate',
		},
		me: {
			path: '/me',
			method: 'get',
			action: 'me',
		},
		sessions: {
			path: '/me/sessions',
			method: 'get',
			action: 'sessions',
		},
		edit: {
			path: '/me/edit',
			method: 'post',
			action: 'edit',
		},
		delete: {
			path: '/me/delete',
			method: 'delete',
			action: 'delete',
		},
	} as RoutesConfigType<typeof AccountController>,
};
