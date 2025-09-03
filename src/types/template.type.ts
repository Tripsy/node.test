export type PageContent = {
    title: string;
    body: string;
    layout?: string;
}

export type EmailContent = {
    subject: string;
    text?: string;
    html: string;
    layout?: string;
}

export type TemplateVars = Record<string, string | number | boolean | string[] | Record<string, any>>;

export type EmailTemplate = {
    id?: number;
    language: string;
    content: EmailContent;
    vars?: TemplateVars;
}
