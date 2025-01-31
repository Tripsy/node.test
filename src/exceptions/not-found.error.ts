class NotFoundError extends Error {
    public statusCode: number;

    constructor() {
        super();

        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

export default NotFoundError;
