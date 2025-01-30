import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import AppDataSource from './config/data-source'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import i18n from './config/i18n-setup'
import apiRoutes from './routes/api'
import { notFoundHandler, errorHandler } from './helpers/handler'
import logger from './services/logger'

// Initialize TypeORM connection
AppDataSource
    .initialize()
    .then(() => {
        logger.debug('Data Source has been initialized!')
    })
    .catch((error) => {
        logger.error('Error during Data Source initialization:', error)
    })

const app: express.Application = express()

// Allow CORS for a specific origin // TODO what's the effect?
app.use(cors({
    origin: 'http://node.xx:3000'
}))

// Middleware for parsing cookies and JSON
app.use(cookieParser())
app.use(express.json())

// Initialize i18n for localization
app.use(i18n.init)

// Load routes
app.use('/', apiRoutes)

// Not found handler
app.use(notFoundHandler)

// Error handler
app.use(errorHandler)

const port: number = parseInt(process.env.APP_PORT || '3000', 10)

const server = app.listen(port, () => {
    logger.info(`App listening on port ${port}`)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.fatal(err, 'uncaught exception detected')

    // Shutdown the server gracefully
    server.close(() => {
        logger.info('Server closed gracefully');
        process.exit(1); // Exit with failure code
    })

    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
        logger.fatal('Forcing shutdown...')
        process.abort() // Exit immediately and generate a core dump file
    }, 1000).unref()
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'unhandled rejection detected')

    // Shutdown the server gracefully
    server.close(() => {
        logger.info('Server closed gracefully')
        process.exit(1) // Exit with failure code
    })

    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
        logger.fatal('Forcing shutdown...')
        process.abort(); // Exit immediately and generate a core dump file
    }, 1000).unref()
})

export default app
