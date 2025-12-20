import type { NextFunction, Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/lib/exceptions/bad-request.error';

export const validateParamsWhenId = (...args: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const validated: Record<string, number> = {};
		const errors: Record<string, unknown>[] = [];

		for (const name of args) {
			const value = parseInt(req.params[name], 10);

			if (Number.isNaN(value) || value <= 0) {
				errors.push({
					[name]: lang('shared.error.invalid_id', { name }),
				});
			} else {
				validated[name] = value;
			}
		}

		if (errors.length > 0) {
			res.locals.output.errors(errors);

			throw new BadRequestError();
		}

		// Attach the validated IDs to the response object for later use
		res.locals.validated = {
			...(res.locals.validated || {}),
			...validated,
		};

		next(); // Proceed to the next middleware or route handler
	};
};

export const validateParamsWhenStatus = (data: Record<string, unknown[]>) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const validated: Record<string, string> = {};
		const errors: Record<string, unknown>[] = [];

		for (const [name, allowedValues] of Object.entries(data)) {
			const value = req.params[name];

			if (!allowedValues.includes(value)) {
				errors.push({
					[name]: lang('shared.error.invalid_status', {
						name: name,
						allowedValues: allowedValues.join(', '),
					}),
				});
			} else {
				validated[name] = value;
			}
		}

		if (errors.length > 0) {
			res.locals.output.errors(errors);

			throw new BadRequestError();
		}

		// Attach the validated IDs to the response object for later use
		res.locals.validated = {
			...(res.locals.validated || {}),
			...validated,
		};

		next(); // Proceed to the next middleware or route handler
	};
};

export const validateParamsWhenString = (...args: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const validated: Record<string, string> = {};

		for (const name of args) {
			validated[name] = req.params[name];
		}

		// Attach the validated IDs to the response object for later use
		res.locals.validated = {
			...(res.locals.validated || {}),
			...validated,
		};

		next(); // Proceed to the next middleware or route handler
	};
};
