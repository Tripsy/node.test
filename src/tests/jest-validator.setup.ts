import type { z } from 'zod';
import type { ValidatorInput } from '@/shared/abstracts/validator.abstract';

export type ValidatorPayloads<V, K extends keyof V = keyof V> = {
	[P in K]: ValidatorInput<V, P>;
};

export function defineValidatorPayloads<V, K extends keyof V>(
	payloads: ValidatorPayloads<V, K>,
): ValidatorPayloads<V, K> {
	return payloads;
}

export function validatorPayload<
	P extends Record<string, unknown>,
	K extends keyof P,
>(payloads: P, schema: K): P[K] {
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
