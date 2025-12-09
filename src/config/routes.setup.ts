import { Router } from 'express';
import accountRoutes from '@/features/account/account.routes';
import carrierRoutes from '@/features/carrier/carrier.routes';
import cronHistoryRoutes from '@/features/cron-history/cron-history.routes';
import discountRoutes from '@/features/discount/discount.routes';
import logDataRoutes from '@/features/log-data/log-data.routes';
import mailQueueRoutes from '@/features/mail-queue/mail-queue.routes';
import permissionRoutes from '@/features/permission/permission.routes';
import templateRoutes from '@/features/template/template.routes';
import userRoutes from '@/features/user/user.routes';
import userPermissionRoutes from '@/features/user-permission/user-permission.routes';
import { buildRoutes, extractRoutesPath } from '@/helpers/routing.helper';

export const initRoutes = (): Router => {
	const router = Router();

	router.use(buildRoutes(accountRoutes));
	router.use(buildRoutes(carrierRoutes));
	router.use(buildRoutes(cronHistoryRoutes));
	router.use(buildRoutes(discountRoutes));
	router.use(buildRoutes(mailQueueRoutes));
	router.use(buildRoutes(logDataRoutes));
	router.use(buildRoutes(permissionRoutes));
	router.use(buildRoutes(templateRoutes));
	router.use(buildRoutes(userRoutes));
	router.use(buildRoutes(userPermissionRoutes));

	return router;
};

let cachedRoutesPath: Record<string, Record<string, string>> | null = null;

export function getRoutesPath() {
	if (!cachedRoutesPath) {
		cachedRoutesPath = {
			account: extractRoutesPath(
				accountRoutes.routesConfig,
				accountRoutes.basePath,
			),
			carrier: extractRoutesPath(
				carrierRoutes.routesConfig,
				carrierRoutes.basePath,
			),
			cronHistory: extractRoutesPath(
				cronHistoryRoutes.routesConfig,
				cronHistoryRoutes.basePath,
			),
			discount: extractRoutesPath(
				discountRoutes.routesConfig,
				discountRoutes.basePath,
			),
			logData: extractRoutesPath(
				logDataRoutes.routesConfig,
				logDataRoutes.basePath,
			),
			mailQueue: extractRoutesPath(
				mailQueueRoutes.routesConfig,
				mailQueueRoutes.basePath,
			),
			permission: extractRoutesPath(
				permissionRoutes.routesConfig,
				permissionRoutes.basePath,
			),
			template: extractRoutesPath(
				templateRoutes.routesConfig,
				templateRoutes.basePath,
			),
			user: extractRoutesPath(
				userRoutes.routesConfig,
				userRoutes.basePath,
			),
			userPermission: extractRoutesPath(
				userPermissionRoutes.routesConfig,
				userPermissionRoutes.basePath,
			),
		};
	}

	return cachedRoutesPath;
}
