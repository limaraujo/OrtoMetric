export type AuthMode = "login" | "register";

export type AuthFormProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
};

export type LoginResponse = {
    access_token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
};


export type AuthForm = {
    mode: AuthMode;
    form: {
        username: string;
        email: string;
        password: string;
    };
    error: string;
    isSubmitting: boolean;
    onChange: (field: string, value: string) => void;
    onSubmit: () => void;
    onSwitchMode: (mode: AuthMode) => void;
};
