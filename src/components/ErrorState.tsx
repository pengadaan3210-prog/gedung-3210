<<<<<<< HEAD
import { AlertTriangle } from "lucide-react";
=======
import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";
>>>>>>> 4d737005464f0583c7782b1547443f20dbdf20d8
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;

  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <AlertTriangle className="h-8 w-8 text-destructive" />
    <p className="text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
      <div className="text-center max-w-md">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {error?.message && (
          <p className="text-xs text-muted-foreground mt-2 break-words">
            {error.message}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Coba Lagi
          </Button>
        )}
      </div>

      {isDev && (
        <div className="mt-6 p-3 bg-muted rounded-lg w-full max-w-md">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Terminal className="h-3 w-3" />
            <span className="font-mono">Development Debug Tips</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 text-left font-mono">
            <li>• Open browser Console (F12) to see error logs</li>
            <li>• Run: window.sheetsDebug.runFullDiagnostic()</li>
            <li>• Check .env file: VITE_SUPABASE_*</li>
            <li>• Verify Supabase function is deployed</li>
            <li>• Check Google Sheets API credentials</li>
          </ul>
        </div>
      )}
  );
};
>>>>>>> 4d737005464f0583c7782b1547443f20dbdf20d8

export default ErrorState;
