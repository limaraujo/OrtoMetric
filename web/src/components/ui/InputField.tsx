import type { AuthFormProps } from "../../types/auth";

export default function InputField({ id, label, value, onChange, type = "text", error }: AuthFormProps) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-200">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                placeholder={`Digite seu ${label.toLowerCase()}`}
            />
            {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
        </div>
    )
}