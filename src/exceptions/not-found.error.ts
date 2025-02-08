class NotFoundError extends Error {
    public statusCode: number;

    constructor(message?: string) {
        super();

        this.message = message ?? 'Not Found';
        this.statusCode = 404;
    }
}

export default NotFoundError;
