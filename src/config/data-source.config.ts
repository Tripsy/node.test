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
	// abstracts: [buildSrcPath('abstracts', '*.entity.ts')],
	entities: [
		buildSrcPath('features/account/account-recovery.entity.ts'),
		buildSrcPath('features/account/account-token.entity.ts'),
		buildSrcPath('features/cron-history/cron-history.entity.ts'),
		buildSrcPath('features/log-data/log-data.entity.ts'),
		buildSrcPath('features/mail-queue/mail-queue.entity.ts'),
		buildSrcPath('features/permission/permission.entity.ts'),
		buildSrcPath('features/template/template.entity.ts'),
		buildSrcPath('features/user/user.entity.ts'),
		buildSrcPath('features/user-permission/user-permission.entity.ts'),
	],
	migrations: [buildSrcPath('migrations', '*.ts')],
	subscribers: [buildSrcPath('subscribers', '*.subscriber.ts')],
	poolSize: 10,
});

export default dataSource;
