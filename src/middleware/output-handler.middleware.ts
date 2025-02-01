import {NextFunction, Request, Response} from 'express';
import {OutputWrapperInterface} from '../interfaces/output-wrapper.interface';
import {HttpStatusCode} from '../types/http-status-code.type';

export const outputHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.output = new OutputWrapper();

    next();
};

class OutputWrapper {
    private httpStatusCode: HttpStatusCode = 200;
    private readonly result: OutputWrapperInterface;

    constructor() {
        this.result = {
            success: false,
            message: '',
            errors: [],
            data: [],
            meta: [],
        };
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

    code(value?: HttpStatusCode): HttpStatusCode  {
        if (value) {
            return this.httpStatusCode = value;
        }

        return this.httpStatusCode;
    }

    raw(filter: boolean = true): OutputWrapperInterface {
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
}
