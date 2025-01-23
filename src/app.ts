import express from 'express'
import AppDataSource from './config/data-source'
import cors from 'cors'
import apiRoutes from './routes/api'

const app: express.Application = express()

// Initialize TypeORM connection (only once here)
AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!')
    })
    .catch((error) => {
        console.error('Error during Data Source initialization:', error)
    });

// Allow CORS for a specific origin // TODO what's the effect?
app.use(cors({
    origin: 'http://node.xx:3000'
}))

app.use(express.json())

app.use('/', apiRoutes)

export default app
