import type { AuthFormProps } from "../../features/auth/types";

export default function InputField({
    id,
    label,
    value,
    onChange,
    type = "text",
    error,
    required = true,
    placeholder,
    containerClassName,
    labelClassName,
    inputClassName,
}: AuthFormProps) {
    const resolvedPlaceholder = placeholder ?? `Digite seu ${label.toLowerCase()}`
    const resolvedLabelClassName = labelClassName ?? "mb-1 block text-sm font-semibold text-foreground"
    const resolvedInputClassName = inputClassName ?? "clinical-input"

    return (
        <div className={containerClassName}>
            <label htmlFor={id} className={resolvedLabelClassName}>
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className={resolvedInputClassName}
                placeholder={resolvedPlaceholder}
            />
            {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
    )
}