import {Router} from 'express';
import PermissionController from '@/features/permission/permission.controller';
import {
    validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import {buildRoutes, RoutesConfigType} from "@/config/routes.setup";

const permissionRoutesBasePath: string = '/permissions';
export const permissionRoutesConfig: RoutesConfigType<typeof PermissionController> = {
    create: {
        path: '',
        method: 'post',
        action: 'create'
    },
    read: {
        path: '/:id',
        method: 'get',
        action: 'read',
        handlers: [
            validateParamsWhenId('id')
        ]
    },
    update: {
        path: '/:id',
        method: 'post',
        action: 'update',
        handlers: [
            validateParamsWhenId('id')
        ]
    },
    delete: {
        path: '/:id',
        method: 'delete',
        action: 'delete',
        handlers: [
            validateParamsWhenId('id')
        ]
    },
    restore: {
        path: '/:id/restore',
        method: 'patch',
        action: 'restore',
        handlers: [
            validateParamsWhenId('id')
        ]
    },
    find: {
        path: '',
        method: 'get',
        action: 'find'
    }
}

const routes: Router = Router();

buildRoutes(routes, PermissionController, permissionRoutesConfig, permissionRoutesBasePath);

export default routes;
