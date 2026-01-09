import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { CronHistoryStatusEnum } from '@/features/cron-history/cron-history.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import { makeFindValidator, validateDate } from '@/lib/helpers';

enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	START_AT = 'start_at',
}

export class CronHistoryValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public delete() {
		return z.object({
			ids: z.array(
				z.coerce
					.number({
						message: lang('shared.validation.invalid_ids', {
							name: 'ids',
						}),
					})
					.positive(),
				{
					message: lang('shared.validation.invalid_ids', {
						name: 'ids',
					}),
				},
			),
		});
	}

	public find() {
		return makeFindValidator({
			orderByEnum: OrderByEnum,
			defaultOrderBy: OrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
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
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const cronHistoryValidator = new CronHistoryValidator();
