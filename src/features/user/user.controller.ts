import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import CustomError from '@/exceptions/custom.error';
import AccountTokenRepository from '@/features/account/account-token.repository';
import UserEntity, { UserRoleEnum } from '@/features/user/user.entity';
import UserPolicy from '@/features/user/user.policy';
import { getUserRepository, UserQuery } from '@/features/user/user.repository';
import {
	paramsUpdateList,
	UserCreateValidator,
	UserFindValidator,
	UserUpdateValidator,
} from '@/features/user/user.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class UserController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = UserCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingUser = await getUserRepository()
			.createQuery()
			.filterByEmail(validated.data.email)
			.withDeleted(policy.allowDeleted())
			.first();

		if (existingUser) {
			throw new CustomError(409, lang('user.error.email_already_used'));
		}

		const user = new UserEntity();
		user.name = validated.data.name;
		user.email = validated.data.email;
		user.password = validated.data.password;
		user.status = validated.data.status;
		user.role = validated.data.role;

		if (validated.data.role === UserRoleEnum.OPERATOR) {
			user.operator_type = validated.data.operator_type ?? null;
		} else {
			user.operator_type = null;
		}

		if (validated.data.language) {
			user.language = validated.data.language;
		}

		const entry: UserEntity = await getUserRepository().save(user);

		res.locals.output.data(entry);
		res.locals.output.message(lang('user.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin, operator with permission or owner)
		policy.read('user', res.locals.auth?.id);

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			UserQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);

		const user = await cacheProvider.get(cacheKey, async () => {
			return (
				getUserRepository()
					.createQuery()
					// .select(['id', 'name', 'email', 'status', 'created_at', 'updated_at'])
					// .addSelect(['password'])
					.filterById(res.locals.validated.id)
					.withDeleted(policy.allowDeleted())
					.firstOrFail()
			);
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(user);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = UserUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const user = await getUserRepository()
			.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const existingUser = await getUserRepository()
			.createQuery()
			.filterBy('id', res.locals.validated.id, '!=')
			.filterByEmail(validated.data.email)
			.first();

		// Return error if email already in use by another account
		if (existingUser) {
			throw new CustomError(409, lang('user.error.email_already_used'));
		}

		// Remove all account tokens
		if (validated.data.password || validated.data.email !== user.email) {
			await AccountTokenRepository.createQuery()
				.filterBy('user_id', user.id)
				.delete(false, true);
		}

		const updatedEntity: Partial<UserEntity> = {
			id: user.id,
			...(Object.fromEntries(
				Object.entries(validated.data).filter(([key]) =>
					paramsUpdateList.includes(key as keyof UserEntity),
				),
			) as Partial<UserEntity>),
		};

		await getUserRepository().save(updatedEntity);

		res.locals.output.message(lang('user.success.update'));
		res.locals.output.data(updatedEntity);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		await getUserRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('user.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.restore();

		await getUserRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('user.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = UserFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const [entries, total] = await getUserRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterByStatus(validated.data.filter.status)
			.filterBy('role', validated.data.filter.role)
			.filterByRange(
				'created_at',
				validated.data.filter.create_date_start,
				validated.data.filter.create_date_end,
			)
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

	public statusUpdate = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new UserPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		const user = await getUserRepository()
			.createQuery()
			.select(['id', 'status'])
			.filterById(res.locals.validated.id)
			.firstOrFail();

		if (user.status === res.locals.validated.status) {
			throw new BadRequestError(
				lang('user.error.status_unchanged', {
					status: res.locals.validated.status,
				}),
			);
		}

		user.status = res.locals.validated.status;

		// Set `contextData` for usage in subscriber
		user.contextData = {
			auth_id: policy.getUserId(),
		};

		await getUserRepository().save(user);

		res.locals.output.message(lang('user.success.status_update'));

		res.json(res.locals.output);
	});
}

export default new UserController();
