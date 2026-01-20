import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	LogDataCategoryEnum,
	LogDataLevelEnum,
} from '@/features/log-data/log-data.entity';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum OrderByEnum {
	ID = 'id',
	REQUEST_ID = 'request_id',
	CATEGORY = 'category',
	LEVEL = 'level',
	CREATED_AT = 'created_at',
}

export class LogDataValidator extends BaseValidator {
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

	find() {
		return this.makeFindValidator({
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
				create_date_start: this.validateDate(),
				create_date_end: this.validateDate(),
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
