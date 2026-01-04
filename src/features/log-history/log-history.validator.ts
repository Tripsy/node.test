import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { RequestContextSource } from '@/config/request.context';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	makeFindValidator,
	validateDate,
	validateNumber,
	validateString,
} from '@/lib/helpers';

enum OrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	ACTION = 'action',
	RECORDED_AT = 'recorded_at',
}

class LogHistoryValidator {
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
				entity: validateString(
					lang('shared.validation.invalid_string'),
				).optional(),
				entity_id: validateNumber(
					lang('shared.validation.invalid_number'),
				).optional(),
				action: validateString(
					lang('shared.validation.invalid_string'),
				).optional(),
				request_id: validateString(
					lang('shared.validation.invalid_string'),
				).optional(),
				source: z
					.enum(
						RequestContextSource,
						lang('shared.error.invalid_source'),
					)
					.optional(),
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
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const userValidator = new LogHistoryValidator();

export type LogHistoryValidatorDeleteDto = z.infer<
	ReturnType<LogHistoryValidator['delete']>
>;
export type LogHistoryValidatorFindDto = z.infer<
	ReturnType<LogHistoryValidator['find']>
>;
