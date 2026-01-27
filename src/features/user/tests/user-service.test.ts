import { expect, jest } from '@jest/globals';
import { BadRequestError } from '@/exceptions';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import type { AccountTokenQuery } from '@/features/account/account-token.repository';
import { AccountTokenService } from '@/features/account/account-token.service';
import {
    getUserEntityMock,
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
		const entity = getUserEntityMock();
		const createData = userOutputPayloads.get('create');

		jest.spyOn(serviceUser, 'findByEmail').mockResolvedValue(null);
		mockUser.repository.save.mockResolvedValue(entity);

		const result = await serviceUser.create(createData);

		expect(mockUser.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<UserEntity>(
		serviceUser,
		mockUser.repository,
        getUserEntityMock(),
	);

	it('should fail when status is unchanged', async () => {
		const entity = getUserEntityMock();
		entity.status = UserStatusEnum.ACTIVE;

		jest.spyOn(serviceUser, 'findById').mockResolvedValue(entity);

		await expect(
			serviceUser.updateStatus(entity.id, UserStatusEnum.ACTIVE, true),
		).rejects.toThrow(BadRequestError);
	});

	it('should update status', async () => {
		const entity = getUserEntityMock();
		entity.status = UserStatusEnum.INACTIVE;

		jest.spyOn(serviceUser, 'findById').mockResolvedValue(entity);

		await serviceUser.updateStatus(entity.id, UserStatusEnum.ACTIVE, true);

		expect(mockUser.repository.save).toHaveBeenCalled();
	});

	testServiceDelete<UserEntity, UserQuery>(mockUser.query, serviceUser);
	testServiceRestore<UserEntity, UserQuery>(mockUser.query, serviceUser);
	testServiceFindById<UserEntity, UserQuery>(mockUser.query, serviceUser);

	it('should find entity by email', async () => {
		const entity = getUserEntityMock();

		mockUser.query.first.mockResolvedValue(entity);

		const result = await serviceUser.findByEmail(entity.email, true);

		expect(mockUser.query.filterByEmail).toHaveBeenCalledWith(entity.email);
		expect(mockUser.query.first).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceFindByFilter<UserEntity, UserQuery, UserValidator>(
		mockUser.query,
		serviceUser,
        userOutputPayloads.get('find'),
	);
});
