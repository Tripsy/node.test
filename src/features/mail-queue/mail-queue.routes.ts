import {Router} from 'express';
import MailQueueController from '@/features/mail-queue/mail-queue.controller';
import {
    validateParamsWhenId
} from '@/middleware/validate-params.middleware';
import {buildRoutes, RoutesConfigType} from "@/config/routes.setup";

const mailQueueRoutesBasePath: string = '/users';
export const mailQueueRoutesConfig: RoutesConfigType<typeof MailQueueController> = {
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

buildRoutes(routes, MailQueueController, mailQueueRoutesConfig, mailQueueRoutesBasePath);

export default routes;