import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { canonicalizeSkillName } from "@/lib/profileCompletion";

export const profileInputClass =
  "mt-2.5 h-11 w-full rounded-[16px] border border-border bg-muted/40 px-3.5 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 disabled:cursor-not-allowed disabled:opacity-55";
export const profileTextareaClass =
  "mt-2.5 min-h-[132px] w-full rounded-[18px] border border-border bg-muted/40 px-3.5 py-3 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10";
export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-22px_hsl(250,60%,55%,0.5)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/18 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-secondary/40 hover:text-foreground";
export const pillButtonClass =
  "rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-secondary/36 hover:text-secondary";

export const StepTitle = ({ title }: { title: string }) => (
  <div className="max-w-3xl space-y-1.5 text-left">
    <h1 className="font-display text-[2rem] font-black tracking-[-0.05em] text-foreground sm:text-[2.65rem]">{title}</h1>
  </div>
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-2 text-sm font-medium text-destructive">{message}</p> : null;

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
        <label htmlFor={id} className="text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </label>

        <div className="mt-2.5 rounded-[18px] border border-border bg-muted/40 px-3.5 py-3 transition hover:border-border focus-within:border-secondary/50 focus-within:ring-4 focus-within:ring-secondary/10">
          {values.length > 0 ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-sm font-medium text-secondary"
                >
                  {value}
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    onClick={() => onChange(values.filter((entry) => entry !== value))}
                    className="rounded-full text-secondary transition hover:text-foreground"
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
            className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {helperText ? <p className="text-sm leading-6 text-muted-foreground">{helperText}</p> : null}
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
        ? "border-secondary/40 bg-secondary/15 text-secondary"
        : "border-border bg-card text-muted-foreground hover:border-secondary/30 hover:text-foreground",
      className
    )}
  >
    {children}
  </button>
);
