import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
};

const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return <LoaderCircle aria-hidden="true" className={cn("animate-spin", className)} />;
};

export default LoadingSpinner;
