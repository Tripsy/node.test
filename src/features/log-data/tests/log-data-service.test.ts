import {expect, jest} from '@jest/globals';
import {LogDataService} from "@/features/log-data/log-data.service";

const createMockQuery = () => {
    const query: any = {};

    query.filterBy = jest.fn().mockReturnValue(query);
    query.filterById = jest.fn().mockReturnValue(query);
    query.filterByRange = jest.fn().mockReturnValue(query);
    query.filterByTerm = jest.fn().mockReturnValue(query);
    query.orderBy = jest.fn().mockReturnValue(query);
    query.pagination = jest.fn().mockReturnValue(query);

    query.firstOrFail = jest.fn();
    query.all = jest.fn();
    query.delete = jest.fn();

    return query;
};

const createMockRepository = () => {
    const query = createMockQuery();

    return {
        query,
        repository: {
            createQuery: jest.fn().mockReturnValue(query),
        },
    };
};

export function testServiceDeleteMultiple(query: any, service: any) {
    it('should delete by ids', async () => {
        query.delete.mockResolvedValue(1);

        await service.delete({ids: [1, 2, 3]});

        expect(query.filterBy).toHaveBeenCalledWith('id', [1, 2, 3], 'IN');
        expect(query.delete).toHaveBeenCalledWith(false, true, true);
    });
}

export function testServiceFindById(query: any, service: any) {
    it('should find entity by id', async () => {
        const entity = {id: 1};

        query.firstOrFail.mockResolvedValue(entity);

        const result = await service.findById(1);

        expect(query.filterById).toHaveBeenCalledWith(1);
        expect(query.firstOrFail).toHaveBeenCalled();
        expect(result).toBe(entity);
    });
}

export function testServiceFindByFilter(query: any, service: any) {
    it('should apply filters and return paginated results', async () => {
        const data = {
            filter: {
                id: 1,
                create_date_start: '2024-01-01',
                create_date_end: '2024-01-31',
                category: 'system',
                level: 'error',
                term: 'timeout',
            },
            order_by: 'created_at',
            direction: 'DESC',
            page: 1,
            limit: 10,
        };

        query.all.mockResolvedValue([]);

        const result = await service.findByFilter(data);

        expect(query.filterById).toHaveBeenCalledWith(1);
        expect(query.filterByRange).toHaveBeenCalledWith('created_at', '2024-01-01', '2024-01-31');
        expect(query.filterBy).toHaveBeenCalledWith('category', 'system');
        expect(query.filterBy).toHaveBeenCalledWith('level', 'error');
        expect(query.filterByTerm).toHaveBeenCalledWith('timeout');
        expect(query.orderBy).toHaveBeenCalledWith('created_at', 'DESC');
        expect(query.pagination).toHaveBeenCalledWith(1, 10);
        expect(query.all).toHaveBeenCalled();
        expect(result).toEqual([]);
    });
}

const crudServiceTests = [
    testServiceDeleteMultiple,
    testServiceFindById,
    testServiceFindByFilter,
];

// Create mocks ONCE at the top level
const mock = createMockRepository();
const query = mock.query;
const service = new LogDataService(mock.repository as any);

describe('LogDataService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Run CRUD tests
    crudServiceTests.forEach(test => test(query, service));
});


// function createServiceTestSuite(
//     serviceName: string,
//     ServiceClass: any,
//     tests: Array<(query: any, service: any) => void>
// ) {
//     describe(`${serviceName} Service`, () => {
//         let service: any;
//         let query: any;
//
//         beforeEach(() => {
//             const mock = createMockRepository();
//             query = mock.query;
//             service = new ServiceClass(mock.repository);
//         });
//
//         afterEach(() => {
//             jest.clearAllMocks();
//         });
//
//         tests.forEach(test => test(query, service));
//     });
// }
//
// createServiceTestSuite('LogData', LogDataService, [
//     testServiceDeleteMultiple,
//     testServiceFindById,
//     testServiceFindByFilter
// ]);