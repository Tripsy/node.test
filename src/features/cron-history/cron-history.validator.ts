import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { CronHistoryStatusEnum } from '@/features/cron-history/cron-history.entity';
import { formatDate, isValidDate, makeJsonFilterSchema } from '@/helpers';

export const CronHistoryDeleteValidator = z.object({
	ids: z.array(z.number(), {
		message: lang('cron_history.validation.ids_invalid'),
	}),
});

enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	START_AT = 'start_at',
}

export const CronHistoryFindValidator = z
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
			term: z
				.string({ message: lang('error.invalid_string') })
				.optional(),
			status: z.nativeEnum(CronHistoryStatusEnum).optional(),
			start_date_start: z
				.string()
				.optional()
				.refine(
					(val) => {
						if (!val) {
							return true;
						} // allow undefined or empty string

						return isValidDate(val); // `false` is string is not a valid date
					},
					{
						message: lang('error.invalid_date'),
					},
				)
				.transform((val) => (val ? formatDate(val) : undefined)),
			start_date_end: z
				.string()
				.optional()
				.refine(
					(val) => {
						if (!val) {
							return true;
						} // allow undefined or empty string

						return isValidDate(val); // `false` is string is not a valid date
					},
					{
						message: lang('error.invalid_date'),
					},
				)
				.transform((val) => (val ? formatDate(val) : undefined)),
		})
			.optional()
			.default({
				id: undefined,
				term: undefined,
				status: undefined,
				start_date_start: undefined,
				start_date_end: undefined,
			}),
	})
	.superRefine((data, ctx) => {
		if (
			data.filter.start_date_start &&
			data.filter.start_date_end &&
			data.filter.start_date_start > data.filter.start_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: lang('error.invalid_date_range'),
				code: z.ZodIssueCode.custom,
			});
		}
	});
