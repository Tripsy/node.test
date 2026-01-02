import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import PermissionEntity from '@/features/permission/permission.entity';
import { getPermissionRepository } from '@/features/permission/permission.repository';
import {
	PermissionFindValidator,
	PermissionManageValidator,
} from '@/features/permission/permission.validator';
import { BadRequestError, CustomError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {cacheProvider, type CacheProvider} from '@/lib/providers/cache.provider';
import {BaseController} from "@/lib/abstracts/controller.abstract";
import type PolicyAbstract from "@/lib/abstracts/policy.abstract";

class PermissionController extends BaseController {
    constructor(
        private policy: PolicyAbstract,
        private validator: IPermissionValidator,
        private cache: CacheProvider,
        private userPermissionService: IPermissionService,
    ) {
        super();
    }
    
	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

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
		this.policy.canRead(res.locals.auth);

		const cacheKey = cacheProvider.buildKey(
			PermissionEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const permission = await cacheProvider.get(cacheKey, async () => {
			return getPermissionRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(this.policy.allowDeleted(res.locals.auth))
				.firstOrFail();
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(permission);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

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
		this.policy.canDelete(res.locals.auth);

		await getPermissionRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('permission.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await getPermissionRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('permission.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

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

export function createPermissionController(deps: {
    policy: PolicyAbstract;
    validator: IPermissionValidator;
    cache: CacheProvider;
    permissionService: IPermissionService;
}) {
    return new PermissionController(
        deps.policy,
        deps.validator,
        deps.cache,
        deps.permissionService,
    );
}

export const permissionController = createPermissionController({
    policy: permissionPolicy,
    validator: permissionValidator,
    cache: cacheProvider,
    permissionService: permissionService,
});
