import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import {
	makeFindValidator,
	validateDate,
	validateNumber,
	validateString,
} from '@/helpers';

export function LogHistoryDeleteValidator() {
	return z.object({
		ids: z.array(z.number(), {
			message: lang('log_history.validation.ids_invalid'),
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

		filterShape: {
			entity: validateString(lang('error.invalid_string')).optional(),
			entity_id: validateNumber(lang('error.invalid_number')).optional(),
			action: validateString(lang('error.invalid_string')).optional(),
			request_id: validateString(lang('error.invalid_string')).optional(),
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
				message: lang('error.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}
