export type EmailTemplate = {
    templateId: number | null;
    language: string,
    emailContent: {
        subject: string;
        text?: string;
        html: string;
    }
}

export type EmailContent = {
    subject: string;
    text?: string;
    html: string;
}