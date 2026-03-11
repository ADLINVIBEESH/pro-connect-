import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GoogleAuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

const GoogleAuthButton = ({
  label,
  className,
  type = "button",
  ...props
}: GoogleAuthButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 text-[15px] font-semibold text-foreground shadow-sm transition-all hover:bg-muted/60 active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-5 w-5 shrink-0"
      >
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.233 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.053 6.053 29.277 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819A11.995 11.995 0 0 1 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.682 0-14.348 4.337-17.694 10.691Z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.176 0 9.868-1.977 13.409-5.197l-6.19-5.238C29.147 35.091 26.656 36 24 36c-5.212 0-9.619-3.316-11.283-7.946l-6.522 5.025C9.504 39.556 16.591 44 24 44Z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.086 5.565h.002l6.19 5.238C36.971 39.201 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default GoogleAuthButton;
