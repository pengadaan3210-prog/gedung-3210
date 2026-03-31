import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;

  onRetry?: () => void;
  error?: Error | null;
}

const ErrorState = ({ message = "Gagal memuat data", onRetry, error }: ErrorStateProps) => {
  const isDev = import.meta.env.DEV;

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="text-center max-w-md">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {error?.message && (
          <p className="text-xs text-muted-foreground mt-2 break-words">
            {error.message}
          </p>
        )}
        {isDev && error && (
          <details className="mt-2 text-xs text-muted-foreground bg-muted rounded p-2">
            <summary className="cursor-pointer">Detail Error</summary>
            <pre className="whitespace-pre-wrap break-words">{error.stack}</pre>
          </details>
        )}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3 mr-2" />Coba Lagi
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
