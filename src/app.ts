import express from 'express'
import AppDataSource from './config/data-source'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import i18n from './config/i18n-setup'
import apiRoutes from './routes/api'
import logger from './services/logger'

// Initialize TypeORM connection
AppDataSource
    .initialize()
    .then(() => {
        console.log('Data Source has been initialized!')
    })
    .catch((error) => {
        console.error('Error during Data Source initialization:', error)
    })

const app: express.Application = express()


logger.error(
    { transaction_id: '12343_ff', user_id: 'johndoe' },
    'Transaction failed'
);

// Allow CORS for a specific origin // TODO what's the effect?
app.use(cors({
    origin: 'http://node.xx:3000'
}))

app.use(cookieParser())
app.use(i18n.init)

app.use(express.json())



// app.use(logErrors)
// app.use(clientErrorHandler)
// app.use(errorHandler)

function logErrors (err, req, res, next) {
    console.error(err.stack)
    next(err)
}

function clientErrorHandler (err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
}

function errorHandler (err, req, res, next) {
    res.status(500)
    res.render('error', { error: err })
}

app.use('/', apiRoutes)

export default app
