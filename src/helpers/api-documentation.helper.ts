import type { z } from 'zod';
import type { HttpStatusCode } from '@/exceptions';
import sharedMessages from '@/shared/locales/en.json';
import {FeatureRoutesModule} from "@/config/routes.setup";

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

type ZodIssue = z.core.$ZodIssue;

type ContentProperties = {
	success: {
		type: 'boolean';
		value: boolean;
	};
	message?: {
		type: 'string';
		value?: string;
	};
	errors?: {
		type: 'array';
		format: Array<ZodIssue>;
	};
	data?: {
		type: 'object' | 'array' | 'string' | 'number';
		sample?: Record<string, unknown> | string | number;
	};
};

type EntryResponseInput = {
	status: HttpStatusCode;
    content: ContentProperties;
    description: string;
};

type RequestShapeParam = {
	type: string;
	required: boolean;
	format?: string;
	values?: Array<string>;
	condition?: string;
};

export type ApiInputDocumentation = {
	description: string;
	authorization: string;
	responses: (HttpStatusCode | EntryResponseInput)[];
	request: {
        type: 'body' | 'query' | 'params';
        schema: Record<string, RequestShapeParam>;
        sample: Record<string, unknown>;
    };
};

type EntryResponseOutput = {
	description: string;
	content: ContentProperties;
};

export type ApiOutputDocumentation = Omit<
	ApiInputDocumentation,
	'responses'
> & {
    method: HttpMethod;
    path: string;
	responses: Partial<Record<HttpStatusCode, EntryResponseOutput>>;
};

export class ApiDocumentation<C> {
    private actions: Record<keyof C, ApiOutputDocumentation> = {} as Record<
        keyof C,
        ApiOutputDocumentation
    >;

	determineSuccess(status: HttpStatusCode) {
		return status >= 200 && status < 300;
	}

	displayErrors(): ContentProperties['errors'] {
		return {
			type: 'array',
			format: [
				{
					code: 'invalid_type',
					path: ['field'],
					message: 'Validation error',
				} as ZodIssue,
			],
		};
	}

	convertToEntryResponseInput(code: HttpStatusCode): EntryResponseInput {
        const success = this.determineSuccess(code);
        const content: ContentProperties = {
            success: {
                type: 'boolean',
                value: success,
            },
            message: {
                type: 'string',
            },
        };

        let description = '';

        switch (code) {
            case 400:
                description = sharedMessages.error.check_errors;
                content.errors = this.displayErrors();
                break;
            case 401:
                description = sharedMessages.error.unauthorized;
                break;
            case 403:
                description = sharedMessages.error.not_allowed;
                break;
            case 404:
                description = sharedMessages.error.not_found;
                break;
            default:
                throw new Error(`convertToEntryResponseInput is not implemented for status code ${code}`);
        }

		return {
            status: code,
            description: description,
            content: content
        }
	}

	addActionDocumentation(
		action: keyof C,
		documentation: ApiOutputDocumentation,
	) {
		this.actions[action] = documentation;
	}

	output() {
		return this.actions;
	}
}

export function generateDocumentation<C>(
    module: FeatureRoutesModule<C>,
    docs: Record<keyof C, ApiInputDocumentation>
): Record<keyof C, ApiOutputDocumentation> {
    const docsGenerator = new ApiDocumentation<C>();

    for (const action in docs) {
        const documentation = docs[action];
        const { responses, ...restDocumentation } = documentation;

        const routeKey = action as keyof typeof module.routes;
        const route = module.routes[routeKey];

        const apiOutputDocumentation = {
            method: route.method,
            path: `${module.basePath}${route.path}`,
            responses: responses.reduce(
                (acc, r) => {
                    if (typeof r === 'number') {
                        acc[r] = docsGenerator.convertToEntryResponseInput(r);
                    } else {
                        acc[r.status] = {
                            description: r.description,
                            content: r.content,
                        };
                    }

                    return acc;
                },
                {} as Partial<Record<HttpStatusCode, EntryResponseOutput>>,
            ),
            ...restDocumentation
        }

        docsGenerator.addActionDocumentation(action, apiOutputDocumentation);
    }

    return docsGenerator.output();
}

// export const discountDocs = {
//     create: {
//         method: 'post',
//         path: '/discounts',
//         description: 'Create a new discount',
//         request: {
//             body: {
//                 label: { type: 'string', required: true },
//                 type: { type: 'enum(PERCENT, FIXED)', required: false },
//                 value: { type: 'number', required: true },
//                 start_at: { type: 'string', format: 'date-time', required: false },
//                 end_at: { type: 'string', format: 'date-time', required: true },
//             },
//         },
//         responses: {
//             201: { description: 'Discount created successfully' },
//             400: { description: 'Validation error' },
//         },
//     },
//     find: {
//         method: 'get',
//         path: '/discounts',
//         description: 'Get a list of discounts',
//         query: {
//             page: 'number',
//             limit: 'number',
//             filter: 'object',
//         },
//         responses: {
//             200: { description: 'List of discounts' },
//         },
//     },
// };
