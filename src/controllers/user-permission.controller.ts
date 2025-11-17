import type { Request, Response } from 'express';
import { lang } from '../config/i18n-setup.config';
import UserPermissionEntity from '../entities/user-permission.entity';
import BadRequestError from '../exceptions/bad-request.error';
import asyncHandler from '../helpers/async.handler';
import PermissionPolicy from '../policies/permission.policy';
import UserPermissionRepository from '../repositories/user-permission.repository';
import UserPermissionCreateValidator from '../validators/user-permission-create.validator';
import UserPermissionFindValidator from '../validators/user-permission-find.validator';

class UserPermissionController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(req);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = UserPermissionCreateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

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
						// Set `contextData` for usage in subscriber
						existingUserPermission.contextData = {
							auth_id: policy.getUserId(),
						};

						await UserPermissionRepository.restore(
							existingUserPermission.id,
						);

						results.push({
							permission_id: permission_id,
							message: lang('user_permission.success.restore'),
						});
					} else {
						results.push({
							permission_id: permission_id,
							message: lang(
								'user_permission.error.already_exists',
							),
						});
					}
				} else {
					const userPermission = new UserPermissionEntity();
					userPermission.user_id = res.locals.validated.user_id;
					userPermission.permission_id = permission_id;

					// Set `contextData` for usage in subscriber
					userPermission.contextData = {
						auth_id: policy.getUserId(),
					};

					await UserPermissionRepository.save(userPermission);

					results.push({
						permission_id: permission_id,
						message: lang('user_permission.success.created'),
					});
				}
			}),
		);

		res.output.data(results);
		res.output.message(lang('user_permission.success.update'));

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

		await UserPermissionRepository.createQuery()
			.filterBy('user_id', res.locals.validated.user_id)
			.filterBy('permission_id', res.locals.validated.permission_id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.delete(true, false, true);

		res.output.message(lang('user_permission.success.delete'));

		res.json(res.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(req);

		// Check permission (admin or operator with permission)
		policy.restore();

		await UserPermissionRepository.createQuery()
			.filterById(res.locals.validated.id)
			.filterBy('user_id', res.locals.validated.user_id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.restore();

		res.output.message(lang('user_permission.success.restore'));

		res.json(res.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(req);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = UserPermissionFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const withDeleted: boolean =
			policy.allowDeleted() && validated.data.filter.is_deleted;
		const querySelect = ['id', 'user_id', 'permission_id', 'created_at'];

		if (withDeleted) {
			querySelect.push('deleted_at');
		}

		const [entries, total] = await UserPermissionRepository.createQuery()
			.select(querySelect)
			.join('user_permission.user', 'user')
			.join('user_permission.permission', 'permission')
			.filterBy('user_id', res.locals.validated.user_id)
			.filterBy('permission.entity', validated.data.filter.entity, 'LIKE')
			.filterBy(
				'permission.operation',
				validated.data.filter.operation,
				'LIKE',
			)
			.withDeleted(withDeleted)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.output);
	});
}

export default new UserPermissionController();
