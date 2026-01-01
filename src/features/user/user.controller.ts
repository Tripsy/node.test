import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import UserEntity from '@/features/user/user.entity';
import { userPolicy } from '@/features/user/user.policy';
import { type IUserService, userService } from '@/features/user/user.service';
import {
	type IUserValidator,
	type UserValidatorCreateDto,
	type UserValidatorFindDto,
	type UserValidatorUpdateDto,
	userValidator,
} from '@/features/user/user.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class UserController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: IUserValidator,
		private cache: CacheProvider,
		private userService: IUserService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate<UserValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const entry = await this.userService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('user.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			UserEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const user = await this.cache.get(cacheKey, async () =>
			this.userService.findById(
				res.locals.validated.id,
				this.policy.allowDeleted(res.locals.auth),
			),
		);

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(user);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate<UserValidatorUpdateDto>(
			this.validator.update(),
			req.body,
			res,
		);

		const entry = await this.userService.updateData(
			res.locals.validated.id,
			this.policy.allowDeleted(res.locals.auth),
			data,
		);

		res.locals.output.message(lang('user.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.userService.delete(res.locals.validated.id);

		res.locals.output.message(lang('user.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.userService.restore(res.locals.validated.id);

		res.locals.output.message(lang('user.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		// Validate against the schema
		const data = this.validate<UserValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] = await this.userService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});

	public statusUpdate = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		await this.userService.updateStatus(
			res.locals.validated.id,
			res.locals.validated.status,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('user.success.status_update'));

		res.json(res.locals.output);
	});
}

export function createUserController(deps: {
	policy: PolicyAbstract;
	validator: IUserValidator;
	cache: CacheProvider;
	userService: IUserService;
}) {
	return new UserController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.userService,
	);
}

export const userController = createUserController({
	policy: userPolicy,
	validator: userValidator,
	cache: cacheProvider,
	userService: userService,
});
