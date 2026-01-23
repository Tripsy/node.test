import { expect, jest } from '@jest/globals';
import { BadRequestError } from '@/exceptions';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import type { AccountTokenQuery } from '@/features/account/account-token.repository';
import { AccountTokenService } from '@/features/account/account-token.service';
import {
	userEntityMock,
	userInputPayloads,
	userOutputPayloads,
} from '@/features/user/tests/user.mock';
import type UserEntity from '@/features/user/user.entity';
import { type UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import type { UserQuery } from '@/features/user/user.repository';
import { UserService } from '@/features/user/user.service';
import type { UserValidator } from '@/features/user/user.validator';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';
import { validatorPayload } from '@/tests/jest-validator.setup';

describe('UserService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockUser = createMockRepository<UserEntity, UserQuery>();
	const mockAccountToken = createMockRepository<
		AccountTokenEntity,
		AccountTokenQuery
	>();

	const serviceAccountToken = new AccountTokenService(
		mockAccountToken.repository,
	);
	const serviceUser = new UserService(
		mockUser.repository,
		serviceAccountToken,
	);

	it('should create entry', async () => {
		const entity = { ...userEntityMock };
		const createData = {
			...validatorPayload(userInputPayloads, 'create'),
		} as ValidatorOutput<UserValidator, 'create'> & {
			status: UserStatusEnum;
			role: UserRoleEnum;
		};

		jest.spyOn(serviceUser, 'findByEmail').mockResolvedValue(null);
		mockUser.repository.save.mockResolvedValue(entity);

		const result = await serviceUser.create(createData);

		expect(mockUser.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<UserEntity>(
		serviceUser,
		mockUser.repository,
		userEntityMock,
	);

	it('should fail when status is unchanged', async () => {
		const entity = { ...userEntityMock };
		entity.status = UserStatusEnum.ACTIVE;

		jest.spyOn(serviceUser, 'findById').mockResolvedValue(entity);

		await expect(
			serviceUser.updateStatus(entity.id, UserStatusEnum.ACTIVE, true),
		).rejects.toThrow(BadRequestError);
	});

	it('should update status', async () => {
		const entity = { ...userEntityMock };
		entity.status = UserStatusEnum.INACTIVE;

		jest.spyOn(serviceUser, 'findById').mockResolvedValue(entity);

		await serviceUser.updateStatus(entity.id, UserStatusEnum.ACTIVE, true);

		expect(mockUser.repository.save).toHaveBeenCalled();
	});

	testServiceDelete<UserEntity, UserQuery>(mockUser.query, serviceUser);
	testServiceRestore<UserEntity, UserQuery>(mockUser.query, serviceUser);
	testServiceFindById<UserEntity, UserQuery>(mockUser.query, serviceUser);

	it('should find entity by email', async () => {
		const entity = { ...userEntityMock };

		mockUser.query.first.mockResolvedValue(entity);

		const result = await serviceUser.findByEmail(entity.email, true);

		expect(mockUser.query.filterByEmail).toHaveBeenCalledWith(entity.email);
		expect(mockUser.query.first).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceFindByFilter<UserEntity, UserQuery, UserValidator>(
		mockUser.query,
		serviceUser,
		validatorPayload<UserValidator, 'find', 'output'>(
			userOutputPayloads,
			'find',
		),
	);
});
