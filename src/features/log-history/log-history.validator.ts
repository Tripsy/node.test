import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { RequestContextSource } from '@/config/request.context';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum OrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	ACTION = 'action',
	RECORDED_AT = 'recorded_at',
}

export class LogHistoryValidator extends BaseValidator {
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
				entity: this.validateString(
					lang('shared.validation.invalid_string'),
				).optional(),
				entity_id: this.validateNumber(
					lang('shared.validation.invalid_number'),
				).optional(),
				action: this.validateString(
					lang('shared.validation.invalid_string'),
				).optional(),
				request_id: this.validateString(
					lang('shared.validation.invalid_string'),
				).optional(),
				source: z
					.enum(
						RequestContextSource,
						lang('shared.error.invalid_source'),
					)
					.optional(),
				recorded_at_start: this.validateDate(),
				recorded_at_end: this.validateDate(),
			},
		}).superRefine((data, ctx) => {
			if (
				data.filter.recorded_at_start &&
				data.filter.recorded_at_end &&
				data.filter.recorded_at_start > data.filter.recorded_at_end
			) {
				ctx.addIssue({
					path: ['filter', 'recorded_at_start'],
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const logHistoryValidator = new LogHistoryValidator();
