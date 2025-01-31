class NotAllowedError extends Error {
    public statusCode: number;

    constructor() {
        super();

        this.name = 'NotAllowedError';
        this.statusCode = 403;
    }
}

export default NotAllowedError;
