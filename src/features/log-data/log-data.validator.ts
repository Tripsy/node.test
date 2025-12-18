import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { makeFindValidator, validateDate } from '@/helpers';

export function LogDataDeleteValidator() {
	return z.object({
		ids: z.array(z.number(), {
			message: lang('log_data.validation.ids_invalid'),
		}),
	});
}

enum OrderByEnum {
	ID = 'id',
	PID = 'pid',
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
				.number({ message: lang('error.invalid_number') })
				.optional(),
			pid: z
				.string({ message: lang('error.invalid_string') })
				.min(cfg('filter.termMinLength') as number, {
					message: lang('error.string_min', {
						min: cfg('filter.termMinLength') as string,
						term: 'pid',
					}),
				})
				.optional(),
			category: z.enum(LogDataCategoryEnum).optional(),
			level: z.enum(LogDataLevelEnum).optional(),
			term: z
				.string({ message: lang('error.invalid_string') })
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
				message: lang('error.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}
