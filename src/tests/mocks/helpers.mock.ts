import { jest } from '@jest/globals';

import { Configuration } from '@/config/settings.config';
import type { ObjectValue } from '@/helpers';

export function mockUuid(): string {
	return '123e4567-e89b-12d3-a456-426614174000';
}

export function mockConfig(key: string, value: ObjectValue) {
	const originalGet = Configuration.get;

	jest.spyOn(Configuration, 'get').mockImplementation((configKey: string) => {
		if (configKey === key) {
			return value;
		}
		return originalGet(configKey);
	});
}
