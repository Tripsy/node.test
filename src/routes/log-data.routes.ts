import {Router} from 'express';
import LogDataController from '../controllers/log-data.controller';
import metaDocumentation from '../middleware/meta-documentation.middleware';
import {validateParamsWhenId} from '../middleware/validate-params.middleware';
import {routesConfig} from '../config/init-routes.config';

const routes: Router = Router();

// LogData - Read
routes.get(
    routesConfig.logData.read,
    [
        metaDocumentation('log-data', 'read'),
        validateParamsWhenId('id')
    ],
    LogDataController.read
);

// LogData - Delete
routes.delete(
    routesConfig.logData.delete,
    [
        metaDocumentation('log-data', 'delete')
    ],
    LogDataController.delete
);

// LogData - Find
routes.get(
    routesConfig.logData.find,
    [
        metaDocumentation('log-data', 'find')
    ],
    LogDataController.find
);

export default routes;