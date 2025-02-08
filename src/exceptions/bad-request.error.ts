class BadRequestError extends Error {
    public statusCode: number;

    constructor(message?: string) {
        super();

        this.message = message ?? 'Bad request';
        this.statusCode = 400;
    }
}

export default BadRequestError;
