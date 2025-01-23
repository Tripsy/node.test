import 'dotenv/config'
import {DataSource} from 'typeorm'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AppDataSource: DataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_HOST === 'local',
    logging: false,
    entities: [path.join(__dirname, '../entities/*.{ts,js}')],
    migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
    extra: {
        connectionLimit: 10, // Maximum number of connections in the pool
        queueLimit: 0, // The maximum number of connection requests in the queue
        waitForConnections: true, // Wait for a connection if the pool is full (true or false)
    }
})

export default AppDataSource
