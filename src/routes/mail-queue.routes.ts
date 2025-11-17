import { Router } from 'express';
import { routesConfig } from '../config/init-routes.config';
import MailQueueController from '../controllers/mail-queue.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import { validateParamsWhenId } from '../middleware/validate-params.middleware';

const routes: Router = Router();

// MailQueue - Read
routes.get(
	routesConfig.mailQueue.read,
	[metaDocumentation('mail-queue', 'read'), validateParamsWhenId('id')],
	MailQueueController.read,
);

// MailQueue - Delete
routes.delete(
	routesConfig.mailQueue.delete,
	[metaDocumentation('mail-queue', 'delete')],
	MailQueueController.delete,
);

// MailQueue - Find
routes.get(
	routesConfig.mailQueue.find,
	[metaDocumentation('mail-queue', 'find')],
	MailQueueController.find,
);

export default routes;
