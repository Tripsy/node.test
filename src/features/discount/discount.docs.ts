import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import {discountInputPayloads, getDiscountEntityMock} from '@/features/discount/discount.mock';
import {ApiInputDocumentation} from "@/helpers/api-documentation.helper";
import {discountController} from "@/features/discount/discount.controller";

export const docs: Record<keyof typeof discountController, ApiInputDocumentation> = {
    create: {
        description: 'Create a new discount',
        authorization: 'Bearer token required',
        responses: [
            {
                status: 201,
                description: 'Discount created successfully',
                content: {
                    success: {
                        type: 'boolean',
                        value: true
                    },
                    data: {
                        type: 'object',
                        sample: getDiscountEntityMock() as unknown as Record<string, unknown>
                    }
                }
            },
           400, 401, 403,
        ],
        request: {
            type: 'body',
            schema: {
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
            sample: discountInputPayloads.get('create'),
        },
    }
};
