import { expect, jest } from '@jest/globals';
import type { ObjectLiteral } from 'typeorm';
import type { Repository } from 'typeorm/repository/Repository';
import type RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';

export function createMockQuery() {
	return {
		// Chainable methods
		filterBy: jest.fn().mockReturnThis(),
		filterById: jest.fn().mockReturnThis(),
		filterByRange: jest.fn().mockReturnThis(),
		filterByTerm: jest.fn().mockReturnThis(),
		filterByStatus: jest.fn().mockReturnThis(),
		filterByEmail: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		pagination: jest.fn().mockReturnThis(),
		withDeleted: jest.fn().mockReturnThis(),

		// Methods from RepositoryAbstract
		filterAny: jest.fn().mockReturnThis(),

		// Execute methods
		save: jest.fn(),
		delete: jest.fn(),
		restore: jest.fn(),
		firstOrFail: jest.fn(),
		first: jest.fn(),
		all: jest.fn(),
	};
}

export function createMockRepository<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>() {
	const query = createMockQuery() as unknown as jest.Mocked<Q>;

	const createQueryMock = jest.fn(() => {
		return query;
	});

	const repository = {
		createQuery: createQueryMock,
		save: jest.fn(),
	} as unknown as jest.Mocked<Repository<E>> & {
		createQuery(): Q;
	};

	return {
		query,
		repository,
	};
}

interface IUpdateService<E> {
	update(data: Partial<E> & { id: number }): Promise<Partial<E>>;
}

export function testServiceUpdate<E extends ObjectLiteral>(
	service: IUpdateService<E>,
	repository: jest.Mocked<Repository<E>>,
	saveData: E & { id: number },
) {
	it('should update', async () => {
		repository.save.mockResolvedValue(saveData);

		await service.update(saveData);

		expect(repository.save).toHaveBeenCalled();
	});
}

interface IDeleteService {
	delete(id: number): Promise<void>;
}

export function testServiceDelete<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(query: jest.Mocked<Q>, service: IDeleteService) {
	it('should delete by id', async () => {
		query.delete.mockResolvedValue(1);

		await service.delete(1);

		expect(query.filterById).toHaveBeenCalledWith(1);
		expect(query.delete).toHaveBeenCalledWith();
	});
}

interface IDeleteMultipleService {
	delete(data: { ids: number[] }): Promise<number>;
}

export function testServiceDeleteMultiple<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(
	query: jest.Mocked<Q>,
	service: IDeleteMultipleService,
	deleteData: { ids: number[] },
) {
	it('should delete by ids', async () => {
		query.delete.mockResolvedValue(3);

		const result = await service.delete(deleteData);

		expect(query.delete).toHaveBeenCalledWith(false, true, true);
		expect(result).toBe(3);
	});
}

interface IRestoreService {
	restore(id: number): Promise<void>;
}

export function testServiceRestore<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(query: jest.Mocked<Q>, service: IRestoreService) {
	it('should restore by id', async () => {
		query.restore.mockReturnThis();

		await service.restore(1);

		expect(query.filterById).toHaveBeenCalledWith(1);
		expect(query.restore).toHaveBeenCalledWith();
	});
}

interface IFindByIdService<E extends ObjectLiteral> {
	findById(id: number, withDeleted?: boolean): Promise<E>;
}

export function testServiceFindById<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(query: jest.Mocked<Q>, service: IFindByIdService<E>) {
	it('should find entity by id', async () => {
		const entity = { id: 1 };

		query.firstOrFail.mockResolvedValue(entity);

		const result = await service.findById(1, true);

		expect(query.filterById).toHaveBeenCalledWith(1);
		expect(query.firstOrFail).toHaveBeenCalled();
		expect(result).toBe(entity);
	});
}

interface IFindByFilterService<
	E extends ObjectLiteral,
	V extends Record<'find', unknown>,
> {
	findByFilter(
		filter: ValidatorOutput<V, 'find'>,
		withDeleted?: boolean,
	): Promise<[E[], number] | E[]>;
}

export function testServiceFindByFilter<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
	V extends Record<'find', unknown>,
>(
	query: jest.Mocked<Q>,
	service: IFindByFilterService<E, V>,
	findData: ValidatorOutput<V, 'find'>,
) {
	it('should apply filters and return paginated results', async () => {
		query.all.mockResolvedValue([[], 0]);

		const result = await service.findByFilter(findData);

		expect(query.all).toHaveBeenCalledWith(true);
		expect(result).toEqual([[], 0]);
	});
}
