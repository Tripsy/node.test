import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import BadRequestError from '@/exceptions/bad-request.error';
import { MailQueueStatusEnum } from '@/features/mail-queue/mail-queue.entity';
import { formatDate, isValidDate } from '@/helpers/date.helper';
import { parseJsonFilter } from '@/helpers/utils.helper';

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

export const MailQueueFindValidator = z.object({
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
	filter: z
		.preprocess(
			(val) =>
				parseJsonFilter(val, () => {
					throw new BadRequestError(lang('error.invalid_filter'));
				}),
			z.object({
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
				sent_date_start: z
					.string({ message: lang('error.invalid_string') })
					.optional()
					.refine(
						(val) => {
							if (!val) {
								return true;
							} // Allow undefined or empty string

							return isValidDate(val); // `false` is string is not a valid date
						},
						{
							message: lang('error.invalid_date'),
						},
					)
					.transform((val) => (val ? formatDate(val) : undefined)),
				sent_date_end: z
					.string({ message: lang('error.invalid_string') })
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
			}),
		)
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
});
