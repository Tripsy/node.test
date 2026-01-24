import type LogDataEntity from '@/features/log-data/log-data.entity';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import type {
	LogDataValidator,
	OrderByEnum,
} from '@/features/log-data/log-data.validator';
import { formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { findQueryMock } from '@/tests/jest-controller.setup';
import { defineValidatorPayloads } from '@/tests/jest-validator.setup';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

export function getLogDataEntityMock(): LogDataEntity {
    return {
        id: 1,
        pid: 'yyy',
        request_id: 'xxx',
        category: 'system',
        level: LogDataLevelEnum.ERROR,
        message: 'Lorem ipsum',
        context: undefined,
        created_at: mockPastDate(28800),
    };
}

export const logDataInputPayloads = defineValidatorPayloads<
	LogDataValidator,
	'find' | 'delete'
>({
	find: findQueryMock<LogDataValidator, OrderByEnum>({
		direction: OrderDirectionEnum.DESC,
		page: 4,
		filter: {
			category: LogDataCategoryEnum.SYSTEM,
			level: LogDataLevelEnum.ERROR,
			create_date_start: formatDate(mockPastDate(14400)),
			create_date_end: formatDate(mockPastDate(7200)),
			term: 'timeout',
		},
	}),
	delete: { ids: [1, 2, 3] },
});

export const logDataOutputPayloads = defineValidatorPayloads<
	LogDataValidator,
	'find',
	'output'
>({
	find: findQueryMock<LogDataValidator, OrderByEnum, 'output'>({
		direction: OrderDirectionEnum.DESC,
		page: 4,
		filter: {
			category: LogDataCategoryEnum.SYSTEM,
			level: LogDataLevelEnum.ERROR,
			create_date_start: mockPastDate(14400),
			create_date_end: mockPastDate(7200),
			term: 'timeout',
		},
	}),
});
