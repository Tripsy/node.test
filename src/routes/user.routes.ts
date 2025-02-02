import {Router} from 'express';
import {Create, Read, Update, Delete, List, Status} from '../controllers/user.controller';

const routes: Router = Router();
const routePrefix = '/users';

routes.post(routePrefix, Create);
routes.get(`${routePrefix}/:id`, Read);
routes.put(`${routePrefix}/:id`, Update);
routes.delete(`${routePrefix}/:id`, Delete);

routes.get(routePrefix, List);
routes.patch(`${routePrefix}/:id/status/:status`, Status);

export default routes;
