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
    entities: [buildSrcPath('entities', '*.entity.{ts,js}')],
    migrations: [buildSrcPath('migrations', '*.{ts,js}')],
    poolSize: 10, // The maximum number of connections in the poolSize
});

export default AppDataSource;
