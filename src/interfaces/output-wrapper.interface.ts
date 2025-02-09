export interface OutputWrapperInterface {
    success: boolean,
    message: string,
    errors: (string | { [key: string]: string })[],
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
