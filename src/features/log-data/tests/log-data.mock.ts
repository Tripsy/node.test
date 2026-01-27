import type LogDataEntity from '@/features/log-data/log-data.entity';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import {
	type LogDataValidator,
	OrderByEnum,
} from '@/features/log-data/log-data.validator';
import { createPastDate, formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { createValidatorPayloads } from '@/tests/jest-validator.setup';

export function getLogDataEntityMock(): LogDataEntity {
	return {
		id: 1,
		pid: 'yyy',
		request_id: 'xxx',
		category: 'system',
		level: LogDataLevelEnum.ERROR,
		message: 'Lorem ipsum',
		context: undefined,
		created_at: createPastDate(28800),
	};
}

export const logDataInputPayloads = createValidatorPayloads<
	LogDataValidator,
	'find' | 'delete'
>({
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			id: 1,
			category: LogDataCategoryEnum.SYSTEM,
			level: LogDataLevelEnum.ERROR,
			create_date_start: formatDate(createPastDate(14400)),
			create_date_end: formatDate(createPastDate(7200)),
			term: 'timeout',
		},
	},
	delete: { ids: [1, 2, 3] },
});

export const logDataOutputPayloads = createValidatorPayloads<
	LogDataValidator,
	'find',
	'output'
>({
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			category: LogDataCategoryEnum.SYSTEM,
			level: LogDataLevelEnum.ERROR,
			create_date_start: createPastDate(14400),
			create_date_end: createPastDate(7200),
			term: 'timeout',
		},
	},
});
