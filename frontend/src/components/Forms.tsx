import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) { return <label className="field"><span>{label}</span><input {...props} />{error && <small className="field-error">{error}</small>}</label>; }
export function TextArea({ label, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) { return <label className="field"><span>{label}</span><textarea {...props} />{error && <small className="field-error">{error}</small>}</label>; }
