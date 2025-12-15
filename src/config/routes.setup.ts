import { Router } from 'express';
import accountRoutes from '@/features/account/account.routes';
import carrierRoutes from '@/features/carrier/carrier.routes';
import clientRoutes from '@/features/client/client.routes';
import cronHistoryRoutes from '@/features/cron-history/cron-history.routes';
import discountRoutes from '@/features/discount/discount.routes';
import logDataRoutes from '@/features/log-data/log-data.routes';
import mailQueueRoutes from '@/features/mail-queue/mail-queue.routes';
import permissionRoutes from '@/features/permission/permission.routes';
import placeRoutes from '@/features/place/place.routes';
import templateRoutes from '@/features/template/template.routes';
import userRoutes from '@/features/user/user.routes';
import userPermissionRoutes from '@/features/user-permission/user-permission.routes';
import { buildRoutes, extractRoutesPath } from '@/helpers/routing.helper';

export const initRoutes = (): Router => {
	const router = Router();

	router.use(buildRoutes(accountRoutes));
	router.use(buildRoutes(carrierRoutes));
	router.use(buildRoutes(clientRoutes));
	router.use(buildRoutes(cronHistoryRoutes));
	router.use(buildRoutes(discountRoutes));
	router.use(buildRoutes(mailQueueRoutes));
	router.use(buildRoutes(logDataRoutes));
	router.use(buildRoutes(permissionRoutes));
	router.use(buildRoutes(placeRoutes));
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
			clients: extractRoutesPath(
				clientRoutes.routesConfig,
				clientRoutes.basePath,
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
			place: extractRoutesPath(
				placeRoutes.routesConfig,
				placeRoutes.basePath,
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
