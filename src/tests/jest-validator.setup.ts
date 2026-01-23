import type { z } from 'zod';
import type {
	ValidatorInput,
	ValidatorOutput,
} from '@/shared/abstracts/validator.abstract';

export type ValidatorShape = 'input' | 'output';

export type ValidatorByShape<
	V,
	K extends keyof V,
	S extends ValidatorShape,
> = S extends 'input' ? ValidatorInput<V, K> : ValidatorOutput<V, K>;

export type ValidatorPayloads<
	V,
	K extends keyof V,
	S extends ValidatorShape = 'input',
> = {
	[P in K]: ValidatorByShape<V, P, S>;
};

export function defineValidatorPayloads<
	V,
	K extends keyof V,
	S extends ValidatorShape = 'input',
>(payloads: ValidatorPayloads<V, K, S>): ValidatorPayloads<V, K, S> {
	return payloads;
}

export function validatorPayload<
	V,
	K extends keyof V,
	S extends ValidatorShape = 'input',
>(payloads: ValidatorPayloads<V, K, S>, schema: K): ValidatorByShape<V, K, S> {
	const payload = payloads[schema];

	if (!payload) {
		throw new Error(`No payload defined for schema: ${String(schema)}`);
	}

	return payload;
}

// Debugging
export function addDebugValidated(
	validated: z.ZodSafeParseResult<unknown>,
	hint: string,
) {
	console.log(hint, validated);
}
