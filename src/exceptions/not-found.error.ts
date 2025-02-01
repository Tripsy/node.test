class NotFoundError extends Error {
    public statusCode: number;

    constructor() {
        super();

        this.message = 'Not Found';
        this.statusCode = 404;
    }
}

export default NotFoundError;
