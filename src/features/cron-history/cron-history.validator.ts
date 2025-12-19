import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { CronHistoryStatusEnum } from '@/features/cron-history/cron-history.entity';
import { makeFindValidator, validateDate } from '@/helpers';

export function CronHistoryDeleteValidator() {
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
	LABEL = 'label',
	START_AT = 'start_at',
}

export function CronHistoryFindValidator() {
	return makeFindValidator({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		filterShape: {
			id: z.coerce
				.number({ message: lang('shared.error.invalid_number') })
				.optional(),
			term: z
				.string({ message: lang('shared.error.invalid_string') })
				.optional(),
			status: z.enum(CronHistoryStatusEnum).optional(),
			start_date_start: validateDate(),
			start_date_end: validateDate(),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter.start_date_start &&
			data.filter.start_date_end &&
			data.filter.start_date_start > data.filter.start_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: lang('shared.error.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}
