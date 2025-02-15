import {DataSource} from 'typeorm';
import {settings} from './settings.config';
import { buildSrcPath } from '../helpers/system';

const dataSource = new DataSource({
    type: 'mariadb',
    host: settings.database.host,
    port: settings.database.port,
    username: settings.database.username,
    password: settings.database.password,
    database: settings.database.name,
    synchronize: false,
    logging: false,
    entities: [buildSrcPath('entities', '*.entity.ts')],
    migrations: [buildSrcPath('migrations', '*.ts')],
    subscribers: [buildSrcPath('subscribers', '*.ts')],
    poolSize: 10,
});

export default dataSource;
