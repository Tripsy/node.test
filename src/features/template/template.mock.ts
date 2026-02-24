import type TemplateEntity from '@/features/template/template.entity';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import {
	OrderByEnum,
	type TemplateValidator,
} from '@/features/template/template.validator';
import { createPastDate } from '@/helpers';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getTemplateEntityMock(): TemplateEntity {
	return {
		id: 1,
		label: 'email-welcome',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Welcome',
			html: '<p>Hello</p>',
		},
		created_at: createPastDate(86400),
		updated_at: null,
		deleted_at: null,
	};
}

export const templateInputPayloads = createValidatorPayloads<
	TemplateValidator,
	'create' | 'update' | 'find'
>({
	create: {
		label: 'email-welcome',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Welcome',
			html: '<p>Hello {{ name }}</p>',
		},
	},
	update: {
		label: 'email-welcome',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Welcome Updated',
			html: '<p>Hello {{ name }}</p>',
		},
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'welcome',
			language: 'en',
			type: TemplateTypeEnum.EMAIL,
			is_deleted: false,
		},
	},
});

export const templateOutputPayloads = createValidatorPayloads<
	TemplateValidator,
	'find' | 'create',
	'output'
>({
	create: {
		label: 'email-welcome',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Welcome',
			html: '<p>Hello {{ name }}</p>',
		},
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'welcome',
			language: 'en',
			type: TemplateTypeEnum.EMAIL,
			is_deleted: false,
		},
	},
});
