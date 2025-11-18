import { Router } from 'express';
import { routesConfig } from '@/config/init-routes.config';
import PermissionController from '@/features/permission/permission.controller';
import metaDocumentation from '@/middleware/meta-documentation.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routes: Router = Router();

// Permission - Create
routes.post(
	routesConfig.permission.create,
	[metaDocumentation('permission', 'create')],
	PermissionController.create,
);

// Permission - Read
routes.get(
	routesConfig.permission.read,
	[metaDocumentation('permission', 'read'), validateParamsWhenId('id')],
	PermissionController.read,
);

// Permission - Update
routes.put(
	routesConfig.permission.update,
	[metaDocumentation('permission', 'update'), validateParamsWhenId('id')],
	PermissionController.update,
);

// Permission - Delete
routes.delete(
	routesConfig.permission.delete,
	[metaDocumentation('permission', 'delete'), validateParamsWhenId('id')],
	PermissionController.delete,
);

// Permission - Restore
routes.patch(
	routesConfig.permission.restore,
	[metaDocumentation('permission', 'restore'), validateParamsWhenId('id')],
	PermissionController.restore,
);

// Permission - Find
routes.get(
	routesConfig.permission.find,
	[metaDocumentation('permission', 'find')],
	PermissionController.find,
);

export default routes;
