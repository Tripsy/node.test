export interface OutputWrapperInterface {
    success: boolean,
    message: string,
    errors: (string | { [key: string]: string })[],
    data: any,
    meta: any[]
}
