import app from '../../app';
import request from 'supertest';
import {routeLink} from '../../config/init-routes.config';
import LogDataRepository from '../../repositories/log-data.repository';
import LogDataEntity from '../../entities/log-data.entity';
import {LogLevelEnum} from '../../enums/log-level.enum';
import LogDataPolicy from '../../policies/log-data.policy';
import * as cacheProvider from '../../providers/cache.provider';
import * as subscriberHelper from '../../helpers/subscriber.helper';
import '../jest-functional.setup';

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(LogDataPolicy.prototype, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(LogDataPolicy.prototype, 'isAdmin').mockReturnValue(true);
    jest.spyOn(LogDataPolicy.prototype, 'hasPermission').mockReturnValue(false);
});

describe('LogDataController - read', () => {
    const logDataReadLink = routeLink('logData.read', {
        id: 1,
    }, false);

    const mockLogData: LogDataEntity = {
        id: 1,
        pid: 'xxx',
        category: 'system',
        level: LogLevelEnum.ERROR,
        message: 'Lorem ipsum',
        context: undefined,
        created_at: new Date(),
        created_at_date: new Date().toISOString().split('T')[0],
    };

    it('should fail if not authenticated', async () => {
        jest.spyOn(LogDataPolicy.prototype, 'isAuthenticated').mockReturnValue(false);

        const response = await request(app)
            .get(logDataReadLink)
            .send();

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should fail if it doesn\'t have proper permission', async () => {
        jest.spyOn(LogDataPolicy.prototype, 'isAdmin').mockReturnValue(false);

        const response = await request(app)
            .get(logDataReadLink)
            .send();

        // Assertions
        expect(response.status).toBe(403);
    });

    it('should return success', async () => {
        jest.spyOn(cacheProvider, 'getCacheProvider').mockReturnValue({
            buildKey: jest.fn().mockReturnValue('cache-key'),
            get: jest.fn().mockImplementation(async (key, fallbackFunction) => {
                return await fallbackFunction(); // Simulating cache miss
            }),
        } as any);

        jest.spyOn(LogDataRepository, 'createQuery').mockReturnValue({
            filterById: jest.fn().mockReturnThis(),
            withDeleted: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockLogData),
        } as any);

        const response = await request(app)
            .get(logDataReadLink)
            .send();

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('pid', mockLogData.pid);
    });
});

describe('LogDataController - delete', () => {
    const logDataDeleteLink = routeLink('logData.delete', {}, false);

    const testData = {
        ids: [1, 2, 3],
    };

    it('should fail if not authenticated', async () => {
        jest.spyOn(LogDataPolicy.prototype, 'isAuthenticated').mockReturnValue(false);

        const response = await request(app)
            .delete(logDataDeleteLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should return success', async () => {
        jest.spyOn(LogDataRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            delete: jest.fn().mockResolvedValue(1),
        } as any);

        jest.spyOn(subscriberHelper, 'logHistory').mockImplementation();

        const response = await request(app)
            .delete(logDataDeleteLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('log_data.success.delete');
    });
});