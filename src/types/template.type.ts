export type PageContent = {
	title: string;
	body: string;
	vars?: TemplateVars;
	layout?: string;
};

type TemplateVarValue =
	| string
	| number
	| boolean
	| string[]
	| { [key: string]: TemplateVarValue }
	| TemplateVarValue[];

type TemplateVars = Record<string, TemplateVarValue>;

export type EmailContent = {
	subject: string;
	text?: string;
	html: string;
	vars?: TemplateVars;
	layout?: string;
};

export type EmailTemplate = {
	id?: number;
	language: string;
	content: EmailContent;
};
