import {Router} from 'express';
import PermissionController from '../controllers/permission.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {validateParamsWhenId} from '../middleware/validate-params.middleware';

const routes: Router = Router();
const routePrefix = '/permissions';

// Permission - Create
routes.post(
    routePrefix,
    [
        metaDocumentation('permission', 'create')
    ],
    PermissionController.create
);

// Permission - Read
routes.get(
    `${routePrefix}/:id`,
    [
        metaDocumentation('permission', 'read'),
        validateParamsWhenId('id')
    ],
    PermissionController.read
);

// Permission - Update
routes.put(
    `${routePrefix}/:id`,
    [
        metaDocumentation('permission', 'update'),
        validateParamsWhenId('id')
    ],
    PermissionController.update
);

// Permission - Delete
routes.delete(
    `${routePrefix}/:id`,
    [
        metaDocumentation('permission', 'delete'),
        validateParamsWhenId('id')
    ],
    PermissionController.delete
);

// Permission - Find
routes.get(
    routePrefix,
    [
        metaDocumentation('permission', 'find')
    ],
    PermissionController.find
);

export default routes;