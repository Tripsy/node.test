import type { Repository } from 'typeorm/repository/Repository';
import { lang } from '@/config/i18n.setup';
import {
	accountTokenService,
	type IAccountTokenService,
} from '@/features/account/account.service';
import type UserEntity from '@/features/user/user.entity';
import { UserRoleEnum, type UserStatusEnum } from '@/features/user/user.entity';
import {
	getUserRepository,
	type UserQuery,
} from '@/features/user/user.repository';
import {
	paramsUpdateList,
	type UserValidatorCreateDto,
	type UserValidatorFindDto,
	type UserValidatorUpdateDto,
} from '@/features/user/user.validator';
import type {
	IEntityCreateService,
	IEntityDeleteService,
	IEntityFindService,
	IEntityRestoreService,
	IEntityUpdateService,
	IEntityUpdateStatusService,
} from '@/lib/abstracts/service.abstract';
import { BadRequestError, CustomError } from '@/lib/exceptions';

export interface IUserService
	extends IEntityCreateService<UserEntity>,
		IEntityUpdateService<UserEntity>,
		IEntityUpdateStatusService<UserEntity, UserStatusEnum>,
		IEntityDeleteService<UserEntity>,
		IEntityRestoreService<UserEntity>,
		IEntityFindService<UserEntity, UserValidatorFindDto> {
	checkIfExistByEmail(
		email: string,
		withDeleted: boolean,
		excludeId?: number,
	): Promise<UserEntity | null>;
}

class UserService implements IUserService {
	constructor(
		private userRepository: Repository<UserEntity> & {
			createQuery(): UserQuery;
		},
		private accountTokenService: IAccountTokenService,
	) {}

	public checkIfExistByEmail(
		email: string,
		withDeleted: boolean,
		excludeId?: number,
	) {
		const q = this.userRepository
			.createQuery()
			.filterByEmail(email)
			.withDeleted(withDeleted);

		if (excludeId) {
			q.filterBy('id', excludeId, '!=');
		}

		return q.first();
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(data: UserValidatorCreateDto): Promise<UserEntity> {
		const existingUser = await this.checkIfExistByEmail(data.email, true);

		if (existingUser) {
			throw new CustomError(409, lang('user.error.email_already_used'));
		}

		const entry = {
			name: data.name,
			email: data.email,
			password: data.password,
			status: data.status,
			role: data.role,

			...(data.role === UserRoleEnum.OPERATOR &&
				data.operator_type && {
					operator_type: data.operator_type,
				}),

			...(data.language && {
				language: data.language,
			}),
		};

		return this.userRepository.save(entry);
	}

	/**
	 * @description Update any user data
	 */
	public update(data: Partial<UserEntity> & { id: number }) {
		return this.userRepository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		withDeleted: boolean,
		data: UserValidatorUpdateDto,
	) {
		const user = await this.findById(id, withDeleted);

		if (data.email) {
			const existingUser = await this.checkIfExistByEmail(
				data.email,
				true,
				id,
			);

			if (existingUser) {
				throw new CustomError(
					409,
					lang('user.error.email_already_used'),
				);
			}
		}

		if (data.password || data.email !== user.email) {
			await this.accountTokenService.removeAccountTokenForUser(user.id); // Note: Removes all account tokens for the user
		}

		const updateData = {
			...Object.fromEntries(
				paramsUpdateList
					.filter((key) => key in data)
					.map((key) => [key, data[key as keyof typeof data]]),
			),
			id,
		};

		return this.update(updateData);
	}

	public async updateStatus(
		id: number,
		status: UserStatusEnum,
		withDeleted: boolean,
	) {
		const user = await this.findById(id, withDeleted);

		if (user.status === status) {
			throw new BadRequestError(
				lang('user.error.status_unchanged', { status }),
			);
		}

		user.status = status;

		return this.userRepository.save(user);
	}

	public async delete(id: number) {
		await this.userRepository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.userRepository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean) {
		return this.userRepository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByFilter(data: UserValidatorFindDto, withDeleted: boolean) {
		return this.userRepository
			.createQuery()
			.filterById(data.filter.id)
			.filterByStatus(data.filter.status)
			.filterBy('role', data.filter.role)
			.filterByRange(
				'created_at',
				data.filter.create_date_start,
				data.filter.create_date_end,
			)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const userService = new UserService(
	getUserRepository(),
	accountTokenService,
);
