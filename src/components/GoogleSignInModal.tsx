import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { storeGoogleToken } from "@/integrations/google/oauth";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GoogleSignInModal({ open, onClose, onSuccess }: GoogleSignInModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load Google library if not loaded
      if (!window.google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google library"));
          document.head.appendChild(script);
        });
      }

      // Use token client for getting access token
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: "521333077807-v2mk1dc8dqn9k4t177qq7gn300n82vk7.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file",
        callback: (response: any) => {
          if (response.error) {
            setError(`Gagal: ${response.error}`);
            setIsLoading(false);
            return;
          }

          if (response.access_token) {
            storeGoogleToken({
              access_token: response.access_token,
              expires_at: Date.now() + ((response.expires_in || 3600) * 1000),
              token_type: response.token_type || "Bearer",
            });
            setIsLoading(false);
            // Call onSuccess which will handle upload and close modal
            onSuccess();
          }
        },
      });

      // Request token - this uses a different flow that's more reliable
      tokenClient.requestAccessToken();
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err?.message || "Gagal login");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login dengan Google</DialogTitle>
          <DialogDescription>
            Silakan login dengan akun Google untuk mengupload file ke Google Drive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Loading..." : "Login dengan Google"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Popup mungkin muncul di atas jendela ini. Silakan check browser anda.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
