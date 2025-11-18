import type { Request, Response } from 'express';
import { lang } from '@/config/i18n-setup.config';
import BadRequestError from '@/exceptions/bad-request.error';
import CustomError from '@/exceptions/custom.error';
import AccountTokenRepository from '@/features/account/account-token.repository';
import UserEntity from '@/features/user/user.entity';
import UserPolicy from '@/features/user/user.policy';
import UserRepository, { UserQuery } from '@/features/user/user.repository';
import UserCreateValidator from '@/features/user/user-create.validator';
import UserFindValidator from '@/features/user/user-find.validator';
import UserUpdateValidator, {
	paramsUpdateList,
} from '@/features/user/user-update.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class UserController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = UserCreateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const existingUser = await UserRepository.createQuery()
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

		if (validated.data.language) {
			user.language = validated.data.language;
		}

		// Set `contextData` for usage in subscriber
		user.contextData = {
			auth_id: policy.getUserId(),
		};

		const entry: UserEntity = await UserRepository.save(user);

		res.output.data(entry);
		res.output.message(lang('user.success.create'));

		res.status(201).json(res.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin, operator with permission or owner)
		policy.read('user', req.user?.id);

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			UserQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);
		const user = await cacheProvider.get(cacheKey, async () => {
			return (
				UserRepository.createQuery()
					// .select(['id', 'name', 'email', 'status', 'created_at', 'updated_at'])
					// .addSelect(['password'])
					.filterById(res.locals.validated.id)
					.withDeleted(policy.allowDeleted())
					.firstOrFail()
			);
		});

		res.output.meta(cacheProvider.isCached, 'isCached');
		res.output.data(user);

		res.json(res.output);
	});

	/**
	 * This method lacks some safety measures regarding password & email update => no confirmation required from user side
	 */
	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = UserUpdateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const user = await UserRepository.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const existingUser = await UserRepository.createQuery()
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

		// Set `contextData` for usage in subscriber
		updatedEntity.contextData = {
			auth_id: policy.getUserId(),
		};

		await UserRepository.save(updatedEntity);

		res.output.message(lang('user.success.update'));
		res.output.data(user);

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

		await UserRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.delete();

		res.output.message(lang('user.success.delete'));

		res.json(res.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin or operator with permission)
		policy.restore();

		await UserRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.restore();

		res.output.message(lang('user.success.restore'));

		res.json(res.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = UserFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const [entries, total] = await UserRepository.createQuery()
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

	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		const policy = new UserPolicy(req);

		// Check permission (admin or operator with permission)
		policy.update();

		const user = await UserRepository.createQuery()
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

		await UserRepository.save(user);

		res.output.message(lang('user.success.status_update'));

		res.json(res.output);
	});
}

export default new UserController();
