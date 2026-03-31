import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message = "Gagal memuat data", onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <AlertTriangle className="h-8 w-8 text-destructive" />
    <p className="text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Coba Lagi
      </Button>
    )}
  </div>
);

export default ErrorState;
