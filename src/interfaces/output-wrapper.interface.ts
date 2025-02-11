import {ZodIssue} from 'zod';

export interface OutputWrapperInterface {
    success: boolean,
    message: string,
    errors: Array<ZodIssue | Record<string, any>>;
    data: any,
    meta: { [key: string]: any },
    request: {
        url: string
        headers: any;
        method: string;
        query: any;
        body: any;
        params: any;
    }
}
