import { jest } from '@jest/globals';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { logDataPolicy } from '@/features/log-data/log-data.policy';
import logDataRoutes from '@/features/log-data/log-data.routes';
import { logDataService } from '@/features/log-data/log-data.service';
import type { LogDataValidator } from '@/features/log-data/log-data.validator';
import { logDataMock } from '@/features/log-data/tests/log-data.mock';
import type { ValidatorDto } from '@/helpers';
import {
	testControllerDeleteMultiple,
	testControllerFind,
	testControllerRead,
} from '@/tests/jest-controller.setup';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'LogDataController';
const basePath = logDataRoutes.basePath;
const mockEntry = logDataMock();

testControllerRead<LogDataEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: logDataPolicy,
});

testControllerDeleteMultiple<ValidatorDto<LogDataValidator, 'delete'>>({
	controller: controller,
	basePath: basePath,
	policy: logDataPolicy,
	service: logDataService,
});

testControllerFind<LogDataEntity, ValidatorDto<LogDataValidator, 'find'>>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: logDataPolicy,
	service: logDataService,
	filterData: {
		filter: {
			category: LogDataCategoryEnum.SYSTEM,
			level: LogDataLevelEnum.ERROR,
			create_date_start: mockPastDate(14400),
			create_date_end: mockPastDate(7200),
			term: 'timeout',
		},
	},
});
