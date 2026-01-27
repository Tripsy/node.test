import { jest } from '@jest/globals';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import { logDataPolicy } from '@/features/log-data/log-data.policy';
import logDataRoutes from '@/features/log-data/log-data.routes';
import { logDataService } from '@/features/log-data/log-data.service';
import type {
	LogDataValidator,
	OrderByEnum,
} from '@/features/log-data/log-data.validator';
import {
    getLogDataEntityMock,
    logDataInputPayloads,
} from '@/features/log-data/tests/log-data.mock';
import {
	testControllerDeleteMultiple,
	testControllerFind,
	testControllerRead,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'LogDataController';
const basePath = logDataRoutes.basePath;

testControllerRead<LogDataEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: getLogDataEntityMock(),
	policy: logDataPolicy,
});

testControllerDeleteMultiple<LogDataValidator>({
	controller: controller,
	basePath: basePath,
	policy: logDataPolicy,
	service: logDataService,
});

testControllerFind<LogDataEntity, LogDataValidator, OrderByEnum>({
	controller: controller,
	basePath: basePath,
	entityMock: getLogDataEntityMock(),
	policy: logDataPolicy,
	service: logDataService,
	findData: logDataInputPayloads.get('find'),
});
