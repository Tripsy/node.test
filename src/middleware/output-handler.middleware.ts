import {NextFunction, Request, Response} from 'express';
import {OutputWrapperInterface} from '../interfaces/output-wrapper.interface';

export const outputHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.output = new OutputWrapper(req, res);

    next();
};

class OutputWrapper {
    private readonly result: OutputWrapperInterface;
    private res: Response;

    constructor(req: Request, res: Response) {
        this.result = {
            success: false,
            message: '',
            errors: [],
            data: [],
            meta: [],
            request: {
                url: req.originalUrl,
                method: req.method,
                headers: req.headers,
                body: req.body,
                params: req.params,
                query: req.query
            }
        };

        this.res = res
    }

    #set(path, value): void  {
        if (typeof path !== 'string' || path.trim() === '') {
            throw new Error('Path must be a non-empty string');
        }

        const keys = path.split('.');
        let current: OutputWrapperInterface = this.result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    success(value: boolean): this {
        this.result.success = value;

        return this;
    }

    message(value: string): this {
        this.result.message = value;

        return this;
    }

    errors(value: string[]): this {
        this.result.errors = value;

        return this;
    }

    pushError(value: string, key: string = ''): this {
        if (key) {
            this.result.errors[key] = value;
        } else {
            this.result.errors.push(value);
        }

        return this;
    }

    data(value: any, key = null): this {
        key = key ? `data.${key}` : 'data';

        this.#set(key, value);

        return this;
    }

    meta(value: any, key = null): this {
        key = key ? `meta.${key}` : 'meta';

        this.#set(key, value);

        return this;
    }

    raw(filter: boolean = true): OutputWrapperInterface {
        // If statusCode is 200, force success to true
        if ([200].includes(this.res.statusCode)) {
            this.success(true)
        }

        if (filter) {
            const filteredResult: Partial<OutputWrapperInterface> = { ...this.result };

            if (filteredResult.errors && filteredResult.errors.length === 0) {
                delete filteredResult.errors;
            }

            if (filteredResult.data && Object.keys(filteredResult.data).length === 0) {
                delete filteredResult.data;
            }

            if (filteredResult.meta && Object.keys(filteredResult.meta).length === 0) {
                delete filteredResult.meta;
            }

            return filteredResult as OutputWrapperInterface;
        }

        return JSON.parse(JSON.stringify(this.result));
    }

    /**
     * When serializing an object, JavaScript looks for a toJSON() property on that specific object.
     * If the toJSON() property is a function, then that method customizes the JSON serialization behavior.
     * JavaScript will then serialize the returned value from the toJSON() method.
     */
    toJSON(): OutputWrapperInterface {
        return this.raw();
    }
}
