import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import PermissionEntity from '@/features/permission/permission.entity';
import PermissionPolicy from '@/features/permission/permission.policy';
import { getPermissionRepository } from '@/features/permission/permission.repository';
import {
	PermissionFindValidator,
	PermissionManageValidator,
} from '@/features/permission/permission.validator';
import { BadRequestError, CustomError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import { getCacheProvider } from '@/lib/providers/cache.provider';

class PermissionController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = PermissionManageValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingPermission = await getPermissionRepository()
			.createQuery()
			.select(['id', 'entity', 'operation', 'deleted_at'])
			.filterBy('entity', validated.data.entity)
			.filterBy('operation', validated.data.operation)
			.withDeleted()
			.first();

		if (existingPermission) {
			if (existingPermission.deleted_at) {
				await getPermissionRepository().restore(existingPermission.id);

				res.locals.output.data(existingPermission);
				res.locals.output.message(lang('permission.success.restore'));
			} else {
				throw new CustomError(
					409,
					lang('permission.error.already_exists'),
				);
			}
		} else {
			const permission = new PermissionEntity();
			permission.entity = validated.data.entity;
			permission.operation = validated.data.operation;

			const entry: PermissionEntity =
				await getPermissionRepository().save(permission);

			res.locals.output.data(entry);
			res.locals.output.message(lang('permission.success.create'));
		}

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new PermissionPolicy(res.locals.auth);

		// Check permission (admin, operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			PermissionEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const permission = await cacheProvider.get(cacheKey, async () => {
			return getPermissionRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(permission);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = PermissionManageValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingPermission = await getPermissionRepository()
			.createQuery()
			.filterBy('id', res.locals.validated.id, '!=')
			.filterBy('entity', validated.data.entity)
			.filterBy('operation', validated.data.operation)
			.withDeleted()
			.first();

		if (existingPermission) {
			throw new CustomError(409, lang('permission.error.already_exists'));
		}

		const permission = await getPermissionRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.firstOrFail();

		permission.entity = validated.data.entity;
		permission.operation = validated.data.operation;

		await getPermissionRepository().save(permission);

		res.locals.output.message(lang('permission.success.update'));
		res.locals.output.data(permission);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new PermissionPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		await getPermissionRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('permission.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new PermissionPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.restore();

		await getPermissionRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('permission.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PermissionPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = PermissionFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const [entries, total] = await getPermissionRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterByTerm(validated.data.filter.term)
			.withDeleted(
				policy.allowDeleted() && validated.data.filter.is_deleted,
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

export default new PermissionController();
