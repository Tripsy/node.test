import { DataSource } from 'typeorm';
import { cfg } from '@/config/settings.config';
import { buildSrcPath } from '@/helpers';

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
