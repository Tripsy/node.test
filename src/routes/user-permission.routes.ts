import {Router} from 'express';
import UserPermissionController from '../controllers/user-permission.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {validateParamsWhenId} from '../middleware/validate-params.middleware';

const routes: Router = Router();
const routePrefix = '/user';

// Permission - Create
routes.post(
    `${routePrefix}/:userId/permissions`,
    [
        metaDocumentation('user-permission', 'create'),
        validateParamsWhenId('userId')
    ],
    UserPermissionController.create
);

// Permission - Update
routes.put(
    `${routePrefix}/:userId/permissions/:id`,
    [
        metaDocumentation('user-permission', 'update'),
        validateParamsWhenId('userId', 'id')
    ],
    UserPermissionController.update
);

// Permission - Delete
routes.delete(
    `${routePrefix}/:userId/permissions/:id`,
    [
        metaDocumentation('user-permission', 'delete'),
        validateParamsWhenId('userId', 'id')
    ],
    UserPermissionController.delete
);

// Permission - Find
routes.get(
    `${routePrefix}/:userId/permissions`,
    [
        metaDocumentation('user-permission', 'find'),
        validateParamsWhenId('userId')
    ],
    UserPermissionController.find
);

export default routes;