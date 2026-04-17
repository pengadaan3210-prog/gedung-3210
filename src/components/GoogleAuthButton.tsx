import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { requestGoogleAccessToken, storeGoogleToken, getStoredGoogleToken, clearGoogleToken } from "@/integrations/google/oauth";
import { LogIn, LogOut } from "lucide-react";

export function GoogleAuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Initialize Google Auth on mount
  useEffect(() => {
    let isMounted = true;
    
    initializeGoogleAuth()
      .then(() => {
        if (isMounted) {
          setIsInitialized(true);
          // Check if already logged in
          const token = getStoredGoogleToken();
          if (token) {
            console.log("✅ Found stored Google token");
            setIsLoggedIn(true);
          }
        }
      })
      .catch((err) => {
        console.error("❌ Failed to initialize Google Auth:", err);
        if (isMounted) {
          setErrorMsg("Google Auth library failed to load");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      console.log("🔐 Requesting Google access token...");
      const token = await requestGoogleAccessToken();
      console.log("✅ Got token, storing...", {
        token_type: token.token_type,
        expires_at: new Date(token.expires_at).toISOString(),
      });
      storeGoogleToken(token);
      setIsLoggedIn(true);
      console.log("✅ Login successful");
    } catch (err: any) {
      console.error("❌ Login error:", err);
      const errMsg = err?.message || "Gagal login dengan Google";
      setErrorMsg(errMsg);
      if (err?.message?.includes("popup") || err?.message?.includes("blocked")) {
        alert("Popup login mungkin diblokir. Silakan izinkan popup di browser settings.");
      } else {
        alert(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("🔓 Logging out...");
    clearGoogleToken();
    setIsLoggedIn(false);
    setErrorMsg("");
  };

  if (!isInitialized) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-muted-foreground"
      >
        Loading...
      </Button>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600 font-medium">✓ Google Connected</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {errorMsg && (
        <span className="text-xs text-red-600">{errorMsg}</span>
      )}
      <Button
        onClick={handleLogin}
        disabled={isLoading}
        size="sm"
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        {isLoading ? "Logging in..." : "Login Google"}
      </Button>
    </div>
  );
}
