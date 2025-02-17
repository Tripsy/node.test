export type AuthTokenPayload = {
    user_id: number;
    ident: string;
};

export type ConfirmationTokenPayload = {
    user_id: number;
    user_email: string;
};

export type AuthValidToken = {
    ident: string;
    label: string;
    used_at: Date;
}