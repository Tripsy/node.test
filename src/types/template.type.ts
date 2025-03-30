export type EmailContent = {
    subject: string;
    text?: string;
    html: string;
    layout?: string;
}

export type EmailTemplate = {
    templateId: number | null;
    language: string,
    emailContent: EmailContent
}
