import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { dateSchema, makeJsonFilterSchema } from '@/helpers';

export const LogDataDeleteValidator = z.object({
	ids: z.array(z.number(), {
		message: lang('log_data.validation.ids_invalid'),
	}),
});

enum OrderByEnum {
	ID = 'id',
	PID = 'pid',
	CATEGORY = 'category',
	LEVEL = 'level',
	CREATED_AT = 'created_at',
}

export const LogDataFindValidator = z
	.object({
		order_by: z.nativeEnum(OrderByEnum).optional().default(OrderByEnum.ID),
		direction: z
			.nativeEnum(OrderDirectionEnum)
			.optional()
			.default(OrderDirectionEnum.ASC),
		limit: z.coerce
			.number({ message: lang('error.invalid_number') })
			.min(1)
			.optional()
			.default(cfg('filter.limit') as number),
		page: z.coerce
			.number({ message: lang('error.invalid_number') })
			.min(1)
			.optional()
			.default(1),
		filter: makeJsonFilterSchema({
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
			category: z.nativeEnum(LogDataCategoryEnum).optional(),
			level: z.nativeEnum(LogDataLevelEnum).optional(),
			term: z
				.string({ message: lang('error.invalid_string') })
				.optional(),
			create_date_start: dateSchema(),
			create_date_end: dateSchema(),
		})
			.optional()
			.default({
				id: undefined,
				pid: undefined,
				category: undefined,
				level: undefined,
				term: undefined,
				create_date_start: undefined,
				create_date_end: undefined,
			}),
	})
	.superRefine((data, ctx) => {
		if (
			data.filter.create_date_start &&
			data.filter.create_date_end &&
			data.filter.create_date_start > data.filter.create_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: lang('error.invalid_date_range'),
				code: z.ZodIssueCode.custom,
			});
		}
	});
