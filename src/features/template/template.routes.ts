import { Router } from 'express';
import { routesConfig } from '../../config/init-routes.config';
import metaDocumentation from '../../middleware/meta-documentation.middleware';
import { validateParamsWhenId } from '../../middleware/validate-params.middleware';
import TemplateController from './template.controller';

const routes: Router = Router();

// Template - Create
routes.post(
	routesConfig.template.create,
	[metaDocumentation('template', 'create')],
	TemplateController.create,
);

// Template - Read
routes.get(
	routesConfig.template.read,
	[metaDocumentation('template', 'read'), validateParamsWhenId('id')],
	TemplateController.read,
);

// Template - Update
routes.put(
	routesConfig.template.update,
	[metaDocumentation('template', 'update'), validateParamsWhenId('id')],
	TemplateController.update,
);

// Template - Delete
routes.delete(
	routesConfig.template.delete,
	[metaDocumentation('template', 'delete'), validateParamsWhenId('id')],
	TemplateController.delete,
);

// Template - Restore
routes.patch(
	routesConfig.template.restore,
	[metaDocumentation('template', 'restore'), validateParamsWhenId('id')],
	TemplateController.restore,
);

// Template - Find
routes.get(
	routesConfig.template.find,
	[metaDocumentation('template', 'find')],
	TemplateController.find,
);

export default routes;
