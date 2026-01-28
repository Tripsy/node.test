import type { z } from 'zod';

export function addDebugValidated(
	validated: z.ZodSafeParseResult<unknown>,
	hint: string,
) {
	console.log(hint, validated);
}
