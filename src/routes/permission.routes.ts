import {Router} from 'express';
import validateParamId from '../middleware/param-id.middleware';
import PermissionController from '../controllers/permission.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';

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
        validateParamId
    ],
    PermissionController.read
);

// Permission - Update
routes.put(
    `${routePrefix}/:id`,
    [
        metaDocumentation('permission', 'update'),
        validateParamId
    ],
    PermissionController.update
);

// Permission - Delete
routes.delete(
    `${routePrefix}/:id`,
    [
        metaDocumentation('permission', 'delete'),
        validateParamId
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