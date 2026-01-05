import type { Response } from 'express';
import type { z } from 'zod';
import { BadRequestError } from '@/lib/exceptions';

export abstract class BaseController {
	protected validate<V>(
		validator: z.ZodType,
		sourceData: unknown,
		res: Response,
	) {
		// Validate against the schema
		const validated = validator.safeParse(sourceData);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		return validated.data as V;
	}

	protected async validateAsync<V>(
		validator: z.ZodType,
		sourceData: unknown,
		res: Response,
	) {
		// Validate against the schema
		const validated = await validator.safeParseAsync(sourceData);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		return validated.data as V;
	}
}
