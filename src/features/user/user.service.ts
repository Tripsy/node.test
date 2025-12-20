import { UserQuery } from '@/features/user/user.repository';
import UserPermissionRepository from '@/features/user-permission/user-permission.repository';
import { getCacheProvider } from '@/lib/providers/cache.provider';

export async function getPolicyPermissions(user_id: number): Promise<string[]> {
	const cacheProvider = getCacheProvider();

	const cacheKey = cacheProvider.buildKey(
		UserQuery.entityAlias,
		user_id.toString(),
		'permissions',
	);

	return (await cacheProvider.get(
		cacheKey,
		async () => {
			const userPermissions =
				await UserPermissionRepository.getUserPermissions(user_id);

			const results: string[] = [];

			userPermissions.forEach((userPermission) => {
				results.push(
					userPermission.permission_entity +
						'.' +
						userPermission.permission_operation,
				);
			});

			return results;
		},
		1800,
	)) as string[];
}
