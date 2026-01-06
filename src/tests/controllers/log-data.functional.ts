import { jest } from '@jest/globals';
import '../jest-functional.setup';
import request from 'supertest';
import app from '@/app';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import { LogDataLevelEnum } from '@/features/log-data/log-data.entity';
import {logDataPolicy} from "@/features/log-data/log-data.policy";
import { cacheProvider } from '@/lib/providers/cache.provider';
import {logDataService} from "@/features/log-data/log-data.service";
import {mockAuthorized, mockNotAllowed} from "@/tests/jest-functional.setup";
import logDataRoutes from "@/features/log-data/log-data.routes";

beforeEach(() => {
	jest.restoreAllMocks();
});

const mockLogData: LogDataEntity = {
    id: 1,
    pid: 'yyy',
    request_id: 'xxx',
    category: 'system',
    level: LogDataLevelEnum.ERROR,
    message: 'Lorem ipsum',
    context: undefined,
    created_at: new Date(),
};
const basePath = logDataRoutes.basePath;

describe('LogDataController - read', () => {
	const link = `${basePath}/1`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).get(link).send();

		expect(response.status).toBe(401);
	});

	it('should fail if it doesn\'t have proper permission', async () => {
        mockNotAllowed(logDataPolicy);

		const response = await request(app).get(link).send();

		expect(response.status).toBe(403);
	});

    it('should return success', async () => {
        mockAuthorized(logDataPolicy);

        jest.spyOn(cacheProvider, 'get').mockImplementation(async (_key, fallback) => {
            return mockLogData;
        });

        const response = await request(app).get(link).send();

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('request_id', mockLogData.request_id);
        expect(response.body.data).toHaveProperty('pid', mockLogData.pid);
    });
});

describe('LogDataController - delete', () => {
	const link = `${basePath}`;
    const testData = {
        ids: [3, 4]
    };

	it('should fail if not authenticated', async () => {
        const response = await request(app).delete(link).send();

        expect(response.status).toBe(401);
	});

	it('should fail if it doesn\'t have proper permission', async () => {
        mockNotAllowed(logDataPolicy);

		const response = await request(app).delete(link).send();

		expect(response.status).toBe(403);
	});

    it('should return success', async () => {
        mockAuthorized(logDataPolicy);

        jest.spyOn(logDataService, 'delete').mockResolvedValue(3);

        const response = await request(app).delete(link).send(testData);

        expect(response.status).toBe(200);
    });
});

describe('LogDataController - find', () => {
	const link = `${basePath}`;
    const testQuery = {
        page: 1,
        limit: 2,
        order_by: 'created_at',
        direction: 'DESC',
        filter: {
            category: 'system',
            level: 'error',
            create_date_start: '2024-01-15',
            create_date_end: '2024-01-20',
            term: 'timeout'
        }
    };

    it('failed validation', async () => {
        mockAuthorized(logDataPolicy);

        const response = await request(app).get(link).query({});

        expect(response.status).toBe(400);
    });

    it('should return success', async () => {
        mockAuthorized(logDataPolicy);

        jest.spyOn(logDataService, 'findByFilter').mockResolvedValue([
            [mockLogData],
            1
        ]);

        const response = await request(app).get(link).query(testQuery);

        expect(response.status).toBe(200);
        expect(response.body.data.entries).toHaveLength(1);
        expect(response.body.data.query.limit).toBe(testQuery.limit);
    });
});
