import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { MailQueueStatusEnum } from '@/features/mail-queue/mail-queue.entity';
import { dateSchema, makeJsonFilterSchema } from '@/helpers';

export const MailQueueDeleteValidator = z.object({
	ids: z.array(z.number(), {
		message: lang('mail_queue.validation.ids_invalid'),
	}),
});

enum OrderByEnum {
	ID = 'id',
	TEMPLATE_ID = 'template_id',
	SENT_AT = 'sent_at',
}

export const MailQueueFindValidator = z
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
			template: z.union([z.string(), z.number()]).optional(),
			language: z
				.string({ message: lang('error.invalid_string') })
				.length(2, {
					message: lang('mail_queue.validation.language_invalid'),
				})
				.optional(),
			status: z.nativeEnum(MailQueueStatusEnum).optional(),
			content: z
				.string({ message: lang('error.invalid_string') })
				.min(cfg('filter.termMinLength') as number, {
					message: lang('error.string_min', {
						min: cfg('filter.termMinLength') as string,
						field: 'content',
					}),
				})
				.optional(),
			to: z
				.string({ message: lang('error.invalid_string') })
				.min(cfg('filter.termMinLength') as number, {
					message: lang('error.string_min', {
						min: cfg('filter.termMinLength') as string,
						field: 'to',
					}),
				})
				.optional(),
			sent_date_start: dateSchema(),
			sent_date_end: dateSchema(),
		})
			.optional()
			.default({
				id: undefined,
				template: undefined,
				language: undefined,
				status: undefined,
				content: undefined,
				to: undefined,
				sent_date_start: undefined,
				sent_date_end: undefined,
			}),
	})
	.superRefine((data, ctx) => {
		if (
			data.filter.sent_date_start &&
			data.filter.sent_date_end &&
			data.filter.sent_date_start > data.filter.sent_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'sent_date_start'],
				message: lang('error.invalid_date_range'),
				code: z.ZodIssueCode.custom,
			});
		}
	});
