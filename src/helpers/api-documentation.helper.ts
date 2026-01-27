import type { z } from 'zod';
import type { HttpStatusCode } from '@/exceptions';
import sharedMessages from '@/shared/locales/en.json';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

type LocalesMessages = {
	success: Record<string, string>;
	validation?: Record<string, string>;
	error?: Record<string, string>;
};

type ZodIssue = z.core.$ZodIssue;

type ContentProperties = {
	success: boolean;
	message: string;
	errors?: Array<ZodIssue>;
	data?: Record<string, unknown>;
};

type EntryResponseInput = {
	status: HttpStatusCode;
	description: string;
	properties?: ContentProperties;
};

type RequestShapeParam = {
	type: string;
	required: boolean;
	format?: string;
	values?: Array<string>;
	condition?: string;
};

type RequestShape = {
	body?: Record<string, RequestShapeParam>;
	query?: Record<string, RequestShapeParam>;
	params?: Record<string, RequestShapeParam>;
};

type ApiInputDocumentation = {
	method: HttpMethod;
	path: string;
	description: string;
	authorization: string;
	responses: EntryResponseInput[];
	requestShape: RequestShape;
};

type EntryResponseOutput = {
	description: string;
	content: ContentProperties;
};

export type ApiOutputDocumentation = {
	method: HttpMethod;
	path: string;
	description: string;
	authorization: string;
	responses: Partial<Record<HttpStatusCode, EntryResponseOutput>>;
	requestShape: RequestShape;
};

export class ApiDocumentation<A extends string> {
	private actions: Record<A, ApiOutputDocumentation> = {} as Record<
		A,
		ApiOutputDocumentation
	>;

	constructor(
		private readonly entity: string,
		private readonly locales: LocalesMessages,
		private readonly basePath: string,
	) {}

	determineSuccess(status: HttpStatusCode) {
		return status >= 200 && status < 300;
	}

	determineSuccessMessage(action: A): ContentProperties['message'] {
		return this.locales.success[action] ?? 'not defined';
	}

	displayErrors(): ContentProperties['errors'] {
		return [
			{
				code: 'invalid_type',
				path: ['field'],
				message: 'Validation error',
			} as ZodIssue,
		];
	}

	determineData(action: A): ContentProperties['data'] | undefined {
		switch (action) {
			case 'create':
			case 'update':
			case 'read':
				return { type: 'object', description: `${this.entity} data` };
		}
	}

	actionResponse(
		action: A,
		status: HttpStatusCode,
		description: string,
		properties?: ContentProperties,
	): EntryResponseOutput {
		const success = this.determineSuccess(status);
		const contentProperties: ContentProperties = {
			success: success,
			message: '',
		};

		if (success) {
			contentProperties.message = this.determineSuccessMessage(action);

			const data = this.determineData(action);

			if (data) {
				contentProperties.data = data;
			}
		} else {
			if (status === 400) {
				contentProperties.message = sharedMessages.error.check_errors;
				contentProperties.errors = this.displayErrors();
			} else if (status === 404) {
				contentProperties.message = sharedMessages.error.not_found;
			} else if (status === 401) {
				contentProperties.message = sharedMessages.error.unauthorized;
			} else if (status === 403) {
				contentProperties.message = sharedMessages.error.not_allowed;
			}
		}

		return {
			description: description,
			content: {
				...contentProperties,
				...properties,
			},
		};
	}

	responseHelperCreate(description: string): EntryResponseInput {
		return {
			status: 201,
			description: description,
		};
	}

	responseHelperValidationError(
		description: string = 'Validation error',
	): EntryResponseInput {
		return {
			status: 400,
			description: description,
		};
	}

	responseHelperAuthorizationError(
		description: string = 'Unauthorized',
	): EntryResponseInput {
		return {
			status: 401,
			description: description,
		};
	}

	responseHelperNotAllowedError(
		description: string = 'Not allowed',
	): EntryResponseInput {
		return {
			status: 403,
			description: description,
		};
	}

	responsesCreate(
		description: string,
		withAuthorizationError = true,
		withNotAllowedError = true,
	) {
		const responses = [
			this.responseHelperCreate(description),
			this.responseHelperValidationError(),
		];

		if (withAuthorizationError) {
			responses.push(this.responseHelperAuthorizationError());
		}

		if (withNotAllowedError) {
			responses.push(this.responseHelperNotAllowedError());
		}

		return responses;
	}

	addActionDocumentation(
		action: A,
		actionInputDocumentation: ApiInputDocumentation,
	) {
		this.actions[action] = {
			...actionInputDocumentation,
			path: `${this.basePath}${actionInputDocumentation.path}`,
			responses: actionInputDocumentation.responses.reduce(
				(acc, r) => {
					acc[r.status] = this.actionResponse(
						action,
						r.status,
						r.description,
						r.properties,
					);

					return acc;
				},
				{} as Partial<Record<HttpStatusCode, EntryResponseOutput>>,
			),
		};
	}

	output() {
		return this.actions;
	}
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
