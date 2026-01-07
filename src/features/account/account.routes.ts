import {
	authDefaultRateLimiter,
	authLoginRateLimiter,
} from '@/config/rate-limit.config';
import { accountController } from '@/features/account/account.controller';
import { validateParamsWhenString } from '@/lib/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/account',
	documentation: 'account',
	controller: accountController,
	routesConfig: {
		register: {
			path: '/register',
			method: 'post',
			action: 'register',
			handlers: [authDefaultRateLimiter],
		},
		login: {
			path: '/login',
			method: 'post',
			action: 'login',
			handlers: [authLoginRateLimiter],
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
			handlers: [authDefaultRateLimiter],
		},
		'password-recover-change': {
			path: '/password-recover-change/:ident',
			method: 'post',
			action: 'passwordRecoverChange',
			handlers: [validateParamsWhenString('ident')],
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
			handlers: [validateParamsWhenString('token')],
		},
		'email-confirm-send': {
			path: '/email-confirm-send',
			method: 'post',
			action: 'emailConfirmSend',
			handlers: [authDefaultRateLimiter],
		},
		'email-update': {
			path: '/email-update',
			method: 'post',
			action: 'emailUpdate',
		},
		'me-details': {
			path: '/me',
			method: 'get',
			action: 'meDetails',
		},
		'me-sessions': {
			path: '/me/sessions',
			method: 'get',
			action: 'meSessions',
		},
		'me-edit': {
			path: '/me/edit',
			method: 'post',
			action: 'meEdit',
		},
		'me-delete': {
			path: '/me/delete',
			method: 'delete',
			action: 'meDelete',
		},
	} as RoutesConfigType<typeof accountController>,
};
