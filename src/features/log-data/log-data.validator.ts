import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { makeFindValidator, validateDate } from '@/helpers';

export function LogDataDeleteValidator() {
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
	REQUEST_ID = 'request_id',
	CATEGORY = 'category',
	LEVEL = 'level',
	CREATED_AT = 'created_at',
}

export function LogDataFindValidator() {
	return makeFindValidator({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		filterShape: {
			id: z.coerce
				.number({
					message: lang('shared.error.invalid_stringnvalid_number'),
				})
				.optional(),
			category: z.enum(LogDataCategoryEnum).optional(),
			level: z.enum(LogDataLevelEnum).optional(),
			term: z
				.string({ message: lang('shared.error.invalid_string') })
				.optional(),
			create_date_start: validateDate(),
			create_date_end: validateDate(),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter.create_date_start &&
			data.filter.create_date_end &&
			data.filter.create_date_start > data.filter.create_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: lang('shared.error.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}
