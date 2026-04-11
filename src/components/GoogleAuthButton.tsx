import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { initializeGoogleAuth, requestGoogleAccessToken, storeGoogleToken, getStoredGoogleToken, clearGoogleToken } from "@/integrations/google/oauth";
import { LogIn, LogOut } from "lucide-react";

export function GoogleAuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Google Auth on mount
  useEffect(() => {
    initializeGoogleAuth()
      .then(() => {
        setIsInitialized(true);
        // Check if already logged in
        const token = getStoredGoogleToken();
        if (token) {
          setIsLoggedIn(true);
        }
      })
      .catch((err) => {
        console.error("Failed to initialize Google Auth:", err);
      });
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const token = await requestGoogleAccessToken();
      storeGoogleToken(token);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Login error:", err);
      alert("Gagal login dengan Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearGoogleToken();
    setIsLoggedIn(false);
  };

  if (!isInitialized) {
    return null;
  }

  if (isLoggedIn) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout Google
      </Button>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      size="sm"
      className="gap-2"
    >
      <LogIn className="h-4 w-4" />
      {isLoading ? "Logging in..." : "Login Google"}
    </Button>
  );
}
