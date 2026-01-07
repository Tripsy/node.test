import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	validateBoolean,
	validateLanguage,
	validateMeta,
	validateString,
} from '@/lib/helpers';

enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export class CategoryValidator {
	private readonly defaultFilterLimit = cfg('filter.limit') as number;

	private categoryContentSchema() {
		return z.object({
			language: validateLanguage(),
			label: validateString(lang('category.validation.label_invalid')),
			slug: validateString(
				lang('category.validation.slug_invalid'),
			).transform((val) => val.trim().toLowerCase()),
			meta: validateMeta(),
			description: validateString(
				lang('category.validation.description_invalid'),
			).optional(),
		});
	}

	create() {
		return z.object({
			type: z.enum(CategoryTypeEnum, {
				message: lang('category.validation.type_invalid'),
			}),
			parent_id: z.coerce
				.number({ message: lang('shared.error.invalid_parent_id') })
				.optional(),
			content: this.categoryContentSchema().array(),
		});
	}

	update() {
		return z
			.object({
				parent_id: z.coerce
					.number({ message: lang('shared.error.invalid_parent_id') })
					.optional(),
				content: this.categoryContentSchema().array().optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: ['parent_id', 'content'].join(', '),
				}),
				path: ['_global'],
			});
	}

	read() {
		return z.object({
			with_ancestors: validateBoolean().default(false),
			with_children: validateBoolean().default(false),
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
				language: validateLanguage().optional(),
				type: z
					.enum(CategoryTypeEnum, {
						message: lang('category.validation.type_invalid'),
					})
					.default(CategoryTypeEnum.ARTICLE),
				status: z
					.enum(CategoryStatusEnum, {
						message: lang('category.validation.status_invalid'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				is_deleted: validateBoolean().default(false),
			},
		});
	}

	statusUpdate() {
		return z.object({
			force: validateBoolean().default(false), // Used to force the `inactive` status update even if the category has active descendants
		});
	}
}

export const categoryValidator = new CategoryValidator();
