import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { canonicalizeSkillName } from "@/lib/profileCompletion";

export const profileInputClass =
  "mt-2.5 h-11 w-full rounded-[16px] border border-black/10 bg-white px-3.5 text-[15px] text-[#111111] outline-none transition placeholder:text-black/35 hover:border-black/18 focus:border-[#f28c28]/60 focus:ring-4 focus:ring-[#f28c28]/10 disabled:cursor-not-allowed disabled:opacity-55";
export const profileTextareaClass =
  "mt-2.5 min-h-[132px] w-full rounded-[18px] border border-black/10 bg-white px-3.5 py-3 text-[15px] text-[#111111] outline-none transition placeholder:text-black/35 hover:border-black/18 focus:border-[#f28c28]/60 focus:ring-4 focus:ring-[#f28c28]/10";
export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#f28c28] px-5 text-sm font-semibold text-[#170b02] shadow-[0_18px_40px_-22px_rgba(242,140,40,0.75)] transition hover:bg-[#ff9e43] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f28c28]/18 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-black/78 transition hover:border-black/18 hover:text-black";
export const pillButtonClass =
  "rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black/74 transition hover:border-[#f28c28]/36 hover:text-[#b85f09]";

export const StepTitle = ({ title }: { title: string }) => (
  <div className="max-w-3xl space-y-1.5 text-left">
    <h1 className="font-display text-[2rem] font-black tracking-[-0.05em] text-[#111111] sm:text-[2.65rem]">{title}</h1>
  </div>
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-2 text-sm font-medium text-[#ff8d8d]">{message}</p> : null;

export const TagInput = ({
  id,
  label,
  values,
  onChange,
  suggestions,
  placeholder,
  error,
  helperText,
  normalizer = canonicalizeSkillName,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder: string;
  error?: string;
  helperText?: string;
  normalizer?: (value: string) => string;
}) => {
  const [input, setInput] = useState("");

  const addTag = (rawValue: string) => {
    const nextValue = normalizer(rawValue.trim());
    if (!nextValue || values.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
      setInput("");
      return;
    }

    onChange([...values, nextValue]);
    setInput("");
  };

  const filteredSuggestions = suggestions
    .filter((suggestion) => !values.some((value) => value.toLowerCase() === suggestion.toLowerCase()))
    .filter((suggestion) => !input || suggestion.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="space-y-2.5">
      <div>
        <label htmlFor={id} className="text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-black/48">
          {label}
        </label>

        <div className="mt-2.5 rounded-[18px] border border-black/10 bg-white px-3.5 py-3 transition hover:border-black/18 focus-within:border-[#f28c28]/60 focus-within:ring-4 focus-within:ring-[#f28c28]/10">
          {values.length > 0 ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-2 rounded-full border border-[#f28c28]/20 bg-[#f28c28]/10 px-3 py-1.5 text-sm font-medium text-[#ffb15a]"
                >
                  {value}
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    onClick={() => onChange(values.filter((entry) => entry !== value))}
                    className="rounded-full text-[#ffb15a] transition hover:text-[#111111]"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <input
            id={id}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(input);
              } else if (event.key === "Backspace" && !input && values.length > 0) {
                onChange(values.slice(0, -1));
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-[15px] text-[#111111] outline-none placeholder:text-black/35"
          />
        </div>
      </div>

      {helperText ? <p className="text-sm leading-6 text-black/56">{helperText}</p> : null}
      <FieldError message={error} />

      {filteredSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={pillButtonClass}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const TogglePill = ({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full border px-4 py-2 text-sm font-semibold transition",
      active
        ? "border-[#f28c28]/40 bg-[#fff5ea] text-[#b85f09]"
        : "border-black/10 bg-white text-black/74 hover:border-black/18 hover:text-[#111111]",
      className
    )}
  >
    {children}
  </button>
);
