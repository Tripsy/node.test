export type AuthTokenPayload = {
	user_id: number;
	ident: string;
};

export type ConfirmationTokenPayload = {
	user_id: number;
	user_email: string;
	user_email_new?: string;
};

export type AuthValidToken = {
	ident: string;
	label: string;
	used_at: Date;
};
