import request from 'supertest';
import app from '@/app';
import { routeLink } from '@/config/init-routes.config';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import LogDataPolicy from '@/features/log-data/log-data.policy';
import LogDataRepository from '@/features/log-data/log-data.repository';
import { LogDataLevelEnum } from '@/features/log-data/log-data-level.enum';
import * as subscriberHelper from '@/helpers/subscriber.helper';
import * as cacheProvider from '@/providers/cache.provider';
import '../jest-functional.setup';

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
		pid: 'xxx',
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
		} as jest.MockedObject<
			ReturnType<typeof LogDataRepository.createQuery>
		>;

		jest.spyOn(LogDataRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderLogData,
		);

		const response = await request(app).get(logDataReadLink).send();

		expect(response.status).toBe(200);
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
		} as jest.MockedObject<
			ReturnType<typeof LogDataRepository.createQuery>
		>;

		jest.spyOn(LogDataRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderLogData,
		);

		jest.spyOn(subscriberHelper, 'logHistory').mockImplementation();

		const response = await request(app)
			.delete(logDataDeleteLink)
			.send(testData);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('log_data.success.delete');
		expect(mockQueryBuilderLogData.filterBy).toHaveBeenCalledWith(
			'id',
			[1, 2, 3],
			'IN',
		);
		expect(mockQueryBuilderLogData.delete).toHaveBeenCalled();
	});
});
