import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import { makeFindValidator, validateDate } from '@/lib/helpers';

enum OrderByEnum {
	ID = 'id',
	REQUEST_ID = 'request_id',
	CATEGORY = 'category',
	LEVEL = 'level',
	CREATED_AT = 'created_at',
}

export class LogDataValidator {
	private readonly defaultFilterLimit = cfg('filter.limit') as number;

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

	find() {
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
				category: z.enum(LogDataCategoryEnum).optional(),
				level: z.enum(LogDataLevelEnum).optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
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
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const logDataValidator = new LogDataValidator();

export type LogDataValidatorDeleteDto = z.infer<
	ReturnType<LogDataValidator['delete']>
>;
export type LogDataValidatorFindDto = z.infer<
	ReturnType<LogDataValidator['find']>
>;
