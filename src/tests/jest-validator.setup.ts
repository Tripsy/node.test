import type { z } from 'zod';
import type {
	ValidatorInput,
	ValidatorOutput,
} from '@/shared/abstracts/validator.abstract';

export type ValidatorShape = 'input' | 'output';

export type ValidatorByShape<V, K extends keyof V, S extends ValidatorShape> =
    S extends 'input' ? ValidatorInput<V, K> : ValidatorOutput<V, K>;

export type ValidatorPayloads<V, K extends keyof V, S extends ValidatorShape = 'input'> = {
    [P in K]: ValidatorByShape<V, P, S>;
};

export function createValidatorPayloads<
    V,
    K extends keyof V,
    S extends ValidatorShape = 'input'
>(payloads: ValidatorPayloads<V, K, S>) {
    return {
        payloads,
        get: <T extends K>(schema: T): ValidatorByShape<V, T, S> => {
            const payload = payloads[schema];

            if (!payload) {
                throw new Error(`No payload for schema: ${String(schema)}`);
            }

            return payload as ValidatorByShape<V, T, S>;
        }
    };
}

export function addDebugValidated(
	validated: z.ZodSafeParseResult<unknown>,
	hint: string,
) {
	console.log(hint, validated);
}
