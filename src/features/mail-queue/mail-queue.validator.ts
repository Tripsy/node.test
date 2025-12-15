import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { MailQueueStatusEnum } from '@/features/mail-queue/mail-queue.entity';
import { makeFindValidator, validateDate } from '@/helpers';

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

export const MailQueueFindValidator = makeFindValidator({
	orderByEnum: OrderByEnum,
	defaultOrderBy: OrderByEnum.ID,

	directionEnum: OrderDirectionEnum,
	defaultDirection: OrderDirectionEnum.ASC,

	filterShape: {
		id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		template: z.union([z.string(), z.number()]).optional(),
		language: z
			.string()
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
			message: lang('error.invalid_date_range'),
			code: z.ZodIssueCode.custom,
		});
	}
});
