// import { DataSource } from 'typeorm';
// import { cfg } from './settings.config';
// import path from "node:path";
//
//
// function buildPath(...args: string[]): string {
//     return path.join(...args);
// }
//
// function buildRootPath(...args: string[]): string {
//     return buildPath(cfg('app.rootPath') as string, ...args);
// }
//
// function buildSrcPath(...args: string[]): string {
//     return buildPath(cfg('app.srcPath') as string, ...args);
// }


import { DataSource } from 'typeorm';
import { cfg } from '@/config/settings.config';
import { buildSrcPath } from '@/helpers/system.helper';

const dataSource = new DataSource({
    type: cfg('database.connection') as 'postgres' | 'mariadb',
    host: cfg('database.host') as string,
    port: cfg('database.port') as number,
    username: cfg('database.username') as string,
    password: cfg('database.password') as string,
    database: cfg('database.name') as string,
    synchronize: false,
    logging: false,
    migrationsTableName:
        cfg('database.connection') === 'postgres'
            ? 'system.migrations'
            : 'migrations',
    entities: [buildSrcPath('features/**/*.entity.ts')],
    migrations: [buildSrcPath('database/migrations', '*.ts')],
    subscribers: [buildSrcPath('features/**/*.subscriber.ts')],
    poolSize: 10,
});

export default dataSource;

// Working version
// import { DataSource } from 'typeorm';
//
// const dataSource = new DataSource({
//     type: 'postgres',
//     host: 'host.docker.internal',
//     port: 5432,
//     username: 'root',
//     password: 'secret',
//     database: 'sample-node-api',
//     synchronize: false,
//     logging: true,
//     migrationsTableName: 'system.migrations',
//     // entities: [buildSrcPath('features/**/*.entity.ts')],
//     entities: ['/var/www/html/src/features/**/*.entity.ts'],
//     // entities: ['/var/www/html/src/features/template/template.entity.ts'],
//     // migrations: [buildSrcPath('database/migrations', '*.ts')],
//     // subscribers: [buildSrcPath('features/**/*.subscriber.ts')],
//     poolSize: 10,
// });
//
// export default dataSource;