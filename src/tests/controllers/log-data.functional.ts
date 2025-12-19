import request from 'supertest';
import app from '@/app';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import { LogDataLevelEnum } from '@/features/log-data/log-data.entity';
import LogDataPolicy from '@/features/log-data/log-data.policy';
import * as cacheProvider from '@/providers/cache.provider';
import '../jest-functional.setup';
import {
	getLogDataRepository,
	type LogDataQuery,
} from '@/features/log-data/log-data.repository';
import { routeLink } from '@/helpers/routing.helper';
import * as subscriberHelper from '@/helpers/subscriber.helper';

beforeEach(() => {
	jest.clearAllMocks();
	jest.restoreAllMocks();

	jest.spyOn(LogDataPolicy.prototype, 'isAuthenticated').mockReturnValue(
		true,
	);
	jest.spyOn(LogDataPolicy.prototype, 'isAdmin').mockReturnValue(true);
	jest.spyOn(LogDataPolicy.prototype, 'hasPermission').mockReturnValue(false);
});

describe('LogDataController - read', () => {
	const logDataReadLink = routeLink('logData.read', { id: 1 }, false);

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

	it('should fail if not authenticated', async () => {
		jest.spyOn(LogDataPolicy.prototype, 'isAuthenticated').mockReturnValue(
			false,
		);

		const response = await request(app).get(logDataReadLink).send();

		expect(response.status).toBe(401);
	});

	it("should fail if it doesn't have proper permission", async () => {
		jest.spyOn(LogDataPolicy.prototype, 'isAdmin').mockReturnValue(false);

		const response = await request(app).get(logDataReadLink).send();

		expect(response.status).toBe(403);
	});

	it('should return success', async () => {
		const mockCacheProvider = {
			buildKey: jest.fn().mockReturnValue('cache-key'),
			get: jest
				.fn()
				.mockImplementation(async (_key, fallbackFunction) => {
					return await fallbackFunction();
				}),
		} as jest.MockedObject<
			ReturnType<typeof cacheProvider.getCacheProvider>
		>;

		jest.spyOn(cacheProvider, 'getCacheProvider').mockReturnValue(
			mockCacheProvider,
		);

		const mockQueryBuilderLogData = {
			filterById: jest.fn().mockReturnThis(),
			withDeleted: jest.fn().mockReturnThis(),
			firstOrFail: jest.fn().mockResolvedValue(mockLogData),
		} as unknown as LogDataQuery;

		jest.spyOn(getLogDataRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderLogData,
		);

		const response = await request(app).get(logDataReadLink).send();

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty(
			'request_id',
			mockLogData.request_id,
		);
		expect(response.body.data).toHaveProperty('pid', mockLogData.pid);
		expect(mockQueryBuilderLogData.filterById).toHaveBeenCalledWith(1);
	});
});

describe('LogDataController - delete', () => {
	const logDataDeleteLink = routeLink('logData.delete', {}, false);
	const testData = { ids: [1, 2, 3] };

	it('should fail if not authenticated', async () => {
		jest.spyOn(LogDataPolicy.prototype, 'isAuthenticated').mockReturnValue(
			false,
		);

		const response = await request(app)
			.delete(logDataDeleteLink)
			.send(testData);

		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		const mockQueryBuilderLogData = {
			filterBy: jest.fn().mockReturnThis(),
			delete: jest.fn().mockResolvedValue(1),
		} as unknown as LogDataQuery;

		jest.spyOn(getLogDataRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderLogData,
		);

		jest.spyOn(subscriberHelper, 'logHistory').mockImplementation();

		const response = await request(app)
			.delete(logDataDeleteLink)
			.send(testData);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('log-data.success.delete');
		expect(mockQueryBuilderLogData.filterBy).toHaveBeenCalledWith(
			'id',
			[1, 2, 3],
			'IN',
		);
		expect(mockQueryBuilderLogData.delete).toHaveBeenCalled();
	});
});
