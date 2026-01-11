import { DataSource } from 'typeorm';
import { Configuration } from '@/config/settings.config';
import { buildSrcPath } from '@/helpers';

export function createDataSource(): DataSource {
	const featuresFolder = Configuration.get('folder.features') as string;
	const filesExtension = Configuration.resolveExtension();

	return new DataSource({
		type: Configuration.get('database.connection') as
			| 'postgres'
			| 'mariadb',
		host: Configuration.get<string>('database.host'),
		port: Configuration.get<number>('database.port'),
		username: Configuration.get<string>('database.username'),
		password: Configuration.get<string>('database.password'),
		database: Configuration.get<string>('database.name'),
		synchronize: false,
		logging: false,
		migrationsTableName:
			Configuration.get('database.connection') === 'postgres'
				? 'system.migrations'
				: 'migrations',
		entities: [
			buildSrcPath(featuresFolder, `/**/*.entity.${filesExtension}`),
		],
		migrations: [buildSrcPath(`database/migrations/*.${filesExtension}`)],
		subscribers: [
			buildSrcPath(featuresFolder, `/**/*.subscriber.${filesExtension}`),
		],
		poolSize: 10,
	});
}

let dataSource: DataSource | null = null;

export function getDataSource(): DataSource {
	if (!dataSource) {
		dataSource = createDataSource();
	}

	return dataSource;
}
