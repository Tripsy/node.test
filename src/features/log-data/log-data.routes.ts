import {Router} from 'express';
import LogDataController from '@/features/log-data/log-data.controller';
import {
    validateParamsWhenId
} from '@/middleware/validate-params.middleware';
import {buildRoutes, RoutesConfigType} from "@/config/routes.setup";

const logDataRoutesBasePath: string = '/users';
export const logDataRoutesConfig: RoutesConfigType<typeof LogDataController> = {
    read: {
        path: '/:id',
        method: 'get',
        action: 'read',
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
    find: {
        path: '',
        method: 'get',
        action: 'find'
    },
}

const routes: Router = Router();

buildRoutes(routes, LogDataController, logDataRoutesConfig, logDataRoutesBasePath);

export default routes;