import {Router} from 'express';
import UserController from '../controllers/user.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {validateParamsWhenId, validateParamsWhenStatus} from '../middleware/validate-params.middleware';
import {UserStatusEnum} from '../enums/user-status.enum';
import {routesConfig} from '../config/init-routes.config';

const routes: Router = Router();

// User - Create
routes.post(
    routesConfig.user.create,
    [
        metaDocumentation('user', 'create')
    ],
    UserController.create
);

// User - Read
routes.get(
    routesConfig.user.read,
    [
        metaDocumentation('user', 'read'),
        validateParamsWhenId('id')
    ],
    UserController.read
);

// User - Update
routes.put(
    routesConfig.user.update,
    [
        metaDocumentation('user', 'update'),
        validateParamsWhenId('id')
    ],
    UserController.update
);

// User - Delete
routes.delete(
    routesConfig.user.delete,
    [
        metaDocumentation('user', 'delete'),
        validateParamsWhenId('id')
    ],
    UserController.delete
);

// User - Restore
routes.patch(
    routesConfig.user.restore,
    [
        metaDocumentation('user', 'restore'),
        validateParamsWhenId('id')
    ],
    UserController.restore
);

// User - Find
routes.get(
    routesConfig.user.find,
    [
        metaDocumentation('user', 'find')
    ],
    UserController.find
);

// User - Update status
routes.patch(
    routesConfig.user.updateStatus,
    [
        metaDocumentation('user', 'update-status'),
        validateParamsWhenId('id'),
        validateParamsWhenStatus({
            'status': [UserStatusEnum.ACTIVE, UserStatusEnum.INACTIVE]
        })
    ],
    UserController.statusUpdate
);

export default routes;