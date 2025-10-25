import {Router} from 'express';
import UserPermissionController from '../controllers/user-permission.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {validateParamsWhenId} from '../middleware/validate-params.middleware';
import {routesConfig} from '../config/init-routes.config';

const routes: Router = Router();

// UserPermission - Create
routes.post(
    routesConfig.userPermission.create,
    [
        metaDocumentation('user-permission', 'create'),
        validateParamsWhenId('user_id')
    ],
    UserPermissionController.create
);

// UserPermission - Delete
routes.delete(
    routesConfig.userPermission.delete,
    [
        metaDocumentation('user-permission', 'delete'),
        validateParamsWhenId('user_id', 'permission_id')
    ],
    UserPermissionController.delete
);

// UserPermission - Restore
routes.patch(
    routesConfig.userPermission.restore,
    [
        metaDocumentation('user-permission', 'restore'),
        validateParamsWhenId('user_id', 'id')
    ],
    UserPermissionController.restore
);

// UserPermission - Find
routes.get(
    routesConfig.userPermission.find,
    [
        metaDocumentation('user-permission', 'find'),
        validateParamsWhenId('user_id')
    ],
    UserPermissionController.find
);

export default routes;