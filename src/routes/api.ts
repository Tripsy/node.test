import {Router} from 'express';
import indexRoutes from './index.routes';

const apiRoutes: Router = Router();

apiRoutes.use('/', indexRoutes);


// // Load routes
// require('fs').readdirSync(__dirname + '/routes').forEach(function(file) {
//     require(__dirname + '/routes/' + file)(app);
// });

export default apiRoutes;
