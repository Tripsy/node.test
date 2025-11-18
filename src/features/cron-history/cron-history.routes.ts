import { Router } from 'express';
import { routesConfig } from '@/config/init-routes.config';
import CronHistoryController from '@/features/cron-history/cron-history.controller';
import metaDocumentation from '@/middleware/meta-documentation.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routes: Router = Router();

// CronHistory - Read
routes.get(
	routesConfig.cronHistory.read,
	[metaDocumentation('cron-history', 'read'), validateParamsWhenId('id')],
	CronHistoryController.read,
);

// CronHistory - Delete
routes.delete(
	routesConfig.cronHistory.delete,
	[metaDocumentation('cron-history', 'delete')],
	CronHistoryController.delete,
);

// CronHistory - Find
routes.get(
	routesConfig.cronHistory.find,
	[metaDocumentation('cron-history', 'find')],
	CronHistoryController.find,
);

export default routes;
