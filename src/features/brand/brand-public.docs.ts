import { Configuration } from '@/config/settings.config';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import { brandInputPayloads } from '@/features/brand/brand.mock';
import { OrderByEnum } from '@/features/brand/brand.validator';
import type { brandPublicController } from '@/features/brand/brand-public.controller';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

/**
 * The visitor-facing half of the brand feature, mounted under `/public/brands` by
 * `brand-public.routes.ts`. Documented separately from `brand.docs.ts` because it is a route
 * module of its own - a different base path, a different controller, and no bearer token -
 * even though both describe the same entity.
 */
export const docs: Record<
	keyof typeof brandPublicController,
	ApiInputDocumentation
> = {
	find: helperApiInputDocumentation({
		description: 'List the published brands of one type',
		success: {
			status: 200,
			description: 'Brand list',
			dataSample: {
				entries: [
					{
						id: 1,
						brand_type: BrandTypeEnum.PRODUCT,
						name: 'Pepsi',
						slug: 'pepsi',
						sort_order: 0,
						contents: [
							{
								language: 'en',
								description: 'Juicy juice',
								meta: null,
							},
						],
					},
				],
				pagination: {
					page: 1,
					limit: 5,
					total: 0,
				},
				query: {
					order_by: OrderByEnum.SORT_ORDER,
					direction: OrderDirectionEnum.ASC,
					limit: 5,
					page: 1,
					filter: {
						language: 'en',
						brand_type: BrandTypeEnum.PRODUCT,
					},
				},
			},
		},
		withErrors: [422],
		request: {
			notes: `Only ${BrandStatusEnum.ACTIVE} brands are addressable - status and deleted rows are pinned by the service, not filterable. Each row carries its name and slug on the row itself and its contents in one language at most`,
			query: {
				page: {
					type: 'number',
					required: false,
					default: 1,
				},
				limit: {
					type: 'number',
					required: false,
					default: Configuration.get('filter.limit'),
				},
				order_by: {
					type: 'enum',
					required: false,
					values: Object.values(OrderByEnum),
					default: OrderByEnum.SORT_ORDER,
				},
				direction: {
					type: 'enum',
					required: false,
					values: Object.values(OrderDirectionEnum),
					default: OrderDirectionEnum.ASC,
				},
				filter: {
					language: {
						type: 'enum',
						required: false,
						values: Configuration.get('language.supported'),
						condition:
							'falls back to the request language; the join is a LEFT one, so a brand with no content in it is still listed, with an empty contents array',
					},
					brand_type: {
						type: 'enum',
						required: false,
						values: Object.values(BrandTypeEnum),
						default: BrandTypeEnum.PRODUCT,
					},
					term: {
						type: 'string',
						required: false,
						condition: `at least ${Configuration.get('filter.termMinLength')} characters; matches the name or the joined description, or the id when the term is numeric`,
					},
				},
			},
			sample: brandInputPayloads.publicFind,
		},
	}),
};
