import { jest } from '@jest/globals';
import '../jest-controller.setup';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { logDataPolicy } from '@/features/log-data/log-data.policy';
import logDataRoutes from '@/features/log-data/log-data.routes';
import { logDataService } from '@/features/log-data/log-data.service';
import type { LogDataValidator } from '@/features/log-data/log-data.validator';
import type { ValidatorDto } from '@/lib/helpers';
import { mockPastDate } from '@/tests/jest.setup';
import {
	entityDataMock,
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
	mockEntry: entityDataMock<LogDataEntity>('log-data'),
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
	mockEntry: entityDataMock<LogDataEntity>('log-data'),
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
