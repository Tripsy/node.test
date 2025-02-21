import {Router} from 'express';
import validateParamId from '../middleware/param-id.middleware';
import UserController from '../controllers/user.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {UserStatusEnum} from '../enums/user-status.enum';
import validateParamStatus from '../middleware/param-status.middleware';

const routes: Router = Router();
const routePrefix = '/users';

// User - Create
routes.post(
    routePrefix,
    [
        metaDocumentation('user', 'create')
    ],
    UserController.create
);

// User - Read
routes.get(
    `${routePrefix}/:id`,
    [
        metaDocumentation('user', 'read'),
        validateParamId
    ],
    UserController.read
);

// User - Update
routes.put(
    `${routePrefix}/:id`,
    [
        metaDocumentation('user', 'update'),
        validateParamId
    ],
    UserController.update
);

// User - Delete
routes.delete(
    `${routePrefix}/:id`,
    [
        metaDocumentation('user', 'delete'),
        validateParamId
    ],
    UserController.delete
);

// User - Find
routes.get(
    routePrefix,
    [
        metaDocumentation('user', 'find')
    ],
    UserController.find
);

// // User - Update `status`
// only for admin?
// on email confirm ?
// routes.patch(
//     `${routePrefix}/:id/status/:status`,
//     [
//         metaDocumentation('user', 'update-status'),
//         validateParamId,
//         validateParamStatus([UserStatusEnum.ACTIVE, UserStatusEnum.INACTIVE])
//     ],
//     UserController.updateStatus
// );
//
// // User - Update `status`
// routes.patch(
//     `${routePrefix}/:id/password`,
//     [
//         metaDocumentation('user', 'update-password'),
//         validateParamId
//     ],
//     UserController.updatePassword
// );

export default routes;