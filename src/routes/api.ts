import { Router } from 'express'
import indexRoutes from './index.routes'

const apiRoutes: Router = Router()

apiRoutes.use('/', indexRoutes)

export default apiRoutes
