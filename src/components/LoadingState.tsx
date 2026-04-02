import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = "Memuat data..." }: LoadingStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-accent" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default LoadingState;
