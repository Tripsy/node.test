import {Router} from 'express';
import {Create, Read, Update, Delete, List, Status} from '../controllers/user.controller';
import validateParamId from '../middleware/param-id.middleware';

const routes: Router = Router();
const routePrefix = '/users';

routes.post(routePrefix, Create);
routes.get(`${routePrefix}/:id`, validateParamId, Read);
routes.put(`${routePrefix}/:id`, validateParamId, Update);
routes.delete(`${routePrefix}/:id`, validateParamId, Delete);

routes.get(routePrefix, List);
routes.patch(`${routePrefix}/:id/status/:status`, Status);

export default routes;
