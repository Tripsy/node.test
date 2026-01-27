import type { FeatureRoutesModule } from '@/config/routes.setup';
import type { discountController } from '@/features/discount/discount.controller';
import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import discountMessages from '@/features/discount/locales/en.json';
import { ApiDocumentation } from '@/helpers/api-documentation.helper';

function generateDocumentation(
	routesModule: FeatureRoutesModule<typeof discountController>,
) {
	const docsGenerator = new ApiDocumentation<keyof typeof discountController>(
		'discount',
		discountMessages,
		routesModule.basePath,
	);

	docsGenerator.addActionDocumentation('create', {
		method: routesModule.routes.create.method,
		path: routesModule.routes.create.path,
		description: 'Create a new discount',
		authorization: 'Bearer token required',
		responses: docsGenerator.responsesCreate('Create a new discount'),
		requestShape: {
			body: {
				label: { type: 'string', required: true },
				scope: {
					type: 'enum',
					required: true,
					values: Object.values(DiscountScopeEnum),
				},
				reason: {
					type: 'enum',
					required: true,
					values: Object.values(DiscountReasonEnum),
				},
				reference: { type: 'string', required: false },
				type: {
					type: 'enum',
					required: true,
					values: Object.values(DiscountTypeEnum),
				},
				rules: {
					type: 'object',
					required: false,
					format: 'Record<string, number | number[] | string | string[]>',
				},
				value: {
					type: 'number',
					required: true,
					condition: 'positive',
				},
				start_at: {
					type: 'string',
					format: 'date-time',
					required: false,
				},
				end_at: {
					type: 'string',
					format: 'date-time',
					required: false,
				},
				notes: { type: 'string', required: false },
			},
		},
	});

	return docsGenerator.output();
}

export const documentation = generateDocumentation;
