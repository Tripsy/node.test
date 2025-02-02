import {DataSource} from 'typeorm';
import {settings} from './settings.config';
import { buildSrcPath } from '../helpers/system';

const AppDataSource: DataSource = new DataSource({
    type: 'mariadb',
    host: settings.database.host,
    port: settings.database.port,
    username: settings.database.username,
    password: settings.database.password,
    database: settings.database.name,
    synchronize: false, // settings.app.env === 'local', // TODO
    logging: false,
    entities: [buildSrcPath('entities', '*.{ts,js}')],
    migrations: [buildSrcPath('migrations', '*.{ts,js}')],
    // cli: {
    //     'entitiesDir': buildSrcPath('entities'),
    //     'migrationsDir': buildSrcPath('migrations'),
    //     // 'subscribersDir': __dirname + '../subscribers',
    // },
    poolSize: 10, // The maximum number of connections in the poolSize
    // retryAttempts: 3, // Number of retry attempts
    // retryDelay: 2000, // Delay between retries in milliseconds
});

export default AppDataSource;
