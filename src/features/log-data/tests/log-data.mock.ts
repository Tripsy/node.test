import type LogDataEntity from '@/features/log-data/log-data.entity';
import { LogDataLevelEnum } from '@/features/log-data/log-data.entity';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

export function logDataMock(): LogDataEntity {
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
