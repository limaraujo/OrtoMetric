export type AuthMode = "login" | "register";

export type AuthFormProps = {
    id?: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    error?: string;
    required?: boolean;
    placeholder?: string;
    containerClassName?: string;
    labelClassName?: string;
    inputClassName?: string;
};

export type AuthFormData = {
    username: string;
    email: string;
    password: string;
};

export type LoginResponse = {
    user: {
        id: number;
        username: string;
        email: string;
    };
};


export type AuthForm = {
    mode: AuthMode;
    form: AuthFormData;
    error: string;
    fieldErrors: Partial<Record<keyof AuthFormData, string>>;
    isSubmitting: boolean;
    onChange: (field: keyof AuthFormData, value: string) => void;
    onSubmit: () => void;
    onSwitchMode: (mode: AuthMode) => void;
};
