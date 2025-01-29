import 'dotenv/config'
import {DataSource} from 'typeorm'
import { buildSrcPath } from '../helpers/system'

const AppDataSource: DataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_HOST === 'local',
    logging: false,
    entities: [buildSrcPath('entities', '*.{ts,js}')],
    migrations: [buildSrcPath('migrations', '*.{ts,js}')],
    cli: {
        'entitiesDir': buildSrcPath('entities'),
        'migrationsDir': buildSrcPath('migrations'),
        // 'subscribersDir': __dirname + '../subscribers',
    },
    poolSize: 10, // The maximum number of connections in the poolSize
})

export default AppDataSource
