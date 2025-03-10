import {Router} from 'express';
import UserPermissionController from '../controllers/user-permission.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {validateParamsWhenId} from '../middleware/validate-params.middleware';
import {routesConfig} from '../config/init-routes.config';

const routes: Router = Router();

// Permission - Create
routes.post(
    routesConfig.userPermission.create,
    [
        metaDocumentation('user-permission', 'create'),
        validateParamsWhenId('userId')
    ],
    UserPermissionController.create
);

// Permission - Update
routes.put(
    routesConfig.userPermission.update,
    [
        metaDocumentation('user-permission', 'update'),
        validateParamsWhenId('userId', 'id')
    ],
    UserPermissionController.update
);

// Permission - Delete
routes.delete(
    routesConfig.userPermission.delete,
    [
        metaDocumentation('user-permission', 'delete'),
        validateParamsWhenId('userId', 'id')
    ],
    UserPermissionController.delete
);

// Permission - Find
routes.get(
    routesConfig.userPermission.find,
    [
        metaDocumentation('user-permission', 'find'),
        validateParamsWhenId('userId')
    ],
    UserPermissionController.find
);

export default routes;