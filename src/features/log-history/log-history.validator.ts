import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	makeFindValidator,
	validateDate,
	validateNumber,
	validateString,
} from '@/lib/helpers';

export function LogHistoryDeleteValidator() {
	return z.object({
		ids: z.array(z.number(), {
			message: lang('shared.error.invalid_ids', {
				name: 'ids',
			}),
		}),
	});
}

enum OrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	ENTITY_ID = 'entity_id',
	RECORDED_AT = 'recorded_at',
}

export function LogHistoryFindValidator() {
	return makeFindValidator({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: cfg('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			entity: validateString(
				lang('shared.error.invalid_string'),
			).optional(),
			entity_id: validateNumber(
				lang('shared.error.invalid_number'),
			).optional(),
			action: validateString(
				lang('shared.error.invalid_string'),
			).optional(),
			request_id: validateString(
				lang('shared.error.invalid_string'),
			).optional(),
			recorded_at_start: validateDate(),
			recorded_at_end: validateDate(),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter.recorded_at_start &&
			data.filter.recorded_at_end &&
			data.filter.recorded_at_start > data.filter.recorded_at_end
		) {
			ctx.addIssue({
				path: ['filter', 'recorded_at_start'],
				message: lang('shared.error.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}
