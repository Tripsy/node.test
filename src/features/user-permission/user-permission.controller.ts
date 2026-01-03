import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import { permissionPolicy } from '@/features/permission/permission.policy';
import UserPermissionEntity from '@/features/user-permission/user-permission.entity';
import {
	UserPermissionCreateValidator,
	UserPermissionFindValidator,
} from '@/features/user-permission/user-permission.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class UserPermissionController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: IUserPermissionValidator,
		private cache: CacheProvider,
		private userPermissionService: IUserPermissionService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const validated = UserPermissionCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const results: {
			permission_id: number;
			message: string;
		}[] = [];

		await Promise.all(
			validated.data.permission_ids.map(async (permission_id: number) => {
				const existingUserPermission =
					await UserPermissionRepository.createQuery()
						.select(['id', 'deleted_at'])
						.filterBy('user_id', res.locals.validated.user_id)
						.filterBy('permission_id', permission_id)
						.withDeleted()
						.first();

				if (existingUserPermission) {
					if (existingUserPermission.deleted_at) {
						await UserPermissionRepository.restore(
							existingUserPermission.id,
						);

						results.push({
							permission_id: permission_id,
							message: lang('user-permission.success.restore'),
						});
					} else {
						results.push({
							permission_id: permission_id,
							message: lang(
								'user-permission.error.already_exists',
							),
						});
					}
				} else {
					const userPermission = new UserPermissionEntity();
					userPermission.user_id = res.locals.validated.user_id;
					userPermission.permission_id = permission_id;

					await UserPermissionRepository.save(userPermission);

					results.push({
						permission_id: permission_id,
						message: lang('user-permission.success.created'),
					});
				}
			}),
		);

		res.locals.output.data(results);
		res.locals.output.message(lang('user-permission.success.update'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await UserPermissionRepository.createQuery()
			.filterBy('user_id', res.locals.validated.user_id)
			.filterBy('permission_id', res.locals.validated.permission_id)
			.delete(true, false, true);

		res.locals.output.message(lang('user-permission.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await UserPermissionRepository.createQuery()
			.filterById(res.locals.validated.id)
			.filterBy('user_id', res.locals.validated.user_id)
			.restore();

		res.locals.output.message(lang('user-permission.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const validated = UserPermissionFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const [entries, total] = await UserPermissionRepository.createQuery()
			.join('user_permission.user', 'user')
			.join('user_permission.permission', 'permission')
			.filterBy('user_id', res.locals.validated.user_id)
			.filterBy('permission.entity', validated.data.filter.entity, 'LIKE')
			.filterBy(
				'permission.operation',
				validated.data.filter.operation,
				'LIKE',
			)
			.withDeleted(
				this.policy.allowDeleted(res.locals.auth) &&
					validated.data.filter.is_deleted,
			)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.locals.output);
	});
}

export function createUserPermissionController(deps: {
	policy: PolicyAbstract;
	validator: IUserPermissionValidator;
	cache: CacheProvider;
	userPermissionService: IUserPermissionService;
}) {
	return new UserPermissionController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.userPermissionService,
	);
}

export const userPermissionController = createUserPermissionController({
	policy: permissionPolicy,
	validator: userPermissionValidator,
	cache: cacheProvider,
	userPermissionService: userPermissionService,
});
