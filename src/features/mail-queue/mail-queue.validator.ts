import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { MailQueueStatusEnum } from '@/features/mail-queue/mail-queue.entity';
import { makeFindValidator, validateDate, validateLanguage } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

enum OrderByEnum {
	ID = 'id',
	TEMPLATE_ID = 'template_id',
	SENT_AT = 'sent_at',
}

export class MailQueueValidator {
	private readonly termMinLength = Configuration.get(
		'filter.termMinLength',
	) as number;
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
				template: z.union([z.string(), z.number()]).optional(),
				language: validateLanguage().optional(),
				status: z.enum(MailQueueStatusEnum).optional(),
				content: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.min(this.termMinLength, {
						message: lang('shared.validation.string_min', {
							min: this.termMinLength.toString(),
							field: 'content',
						}),
					})
					.optional(),
				to: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.min(this.termMinLength, {
						message: lang('shared.validation.string_min', {
							min: this.termMinLength.toString(),
							field: 'to',
						}),
					})
					.optional(),
				sent_date_start: validateDate(),
				sent_date_end: validateDate(),
			},
		}).superRefine((data, ctx) => {
			if (
				data.filter.sent_date_start &&
				data.filter.sent_date_end &&
				data.filter.sent_date_start > data.filter.sent_date_end
			) {
				ctx.addIssue({
					path: ['filter', 'sent_date_start'],
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const mailQueueValidator = new MailQueueValidator();
