import {DataSource} from 'typeorm';
import {cfg} from './settings.config';
import {buildSrcPath} from '../helpers/system.helper';

const dataSource = new DataSource({
    type: cfg('database.connection'),
    host: cfg('database.host'),
    port: cfg('database.port'),
    username: cfg('database.username'),
    password: cfg('database.password'),
    database: cfg('database.name'),
    synchronize: false,
    logging: false,
    migrationsTableName: cfg('database.connection') === 'postgres' ? 'system.migrations' : 'migrations',
    entities: [buildSrcPath('entities', '*.entity.ts')],
    migrations: [buildSrcPath('migrations', '*.ts')],
    subscribers: [buildSrcPath('subscribers', '*.subscriber.ts')],
    poolSize: 10,
});

export default dataSource;