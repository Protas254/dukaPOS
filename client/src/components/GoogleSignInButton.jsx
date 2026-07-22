import React, { useEffect, useRef, useState } from "react";
import { api } from "@/api/apiClient";
import { Loader2 } from "lucide-react";

/**
 * GoogleSignInButton
 * Renders the official Google Sign-In button using Google Identity Services.
 * On success, sends the credential token to our backend and redirects.
 *
 * Props:
 *   onError(message) - called when sign-in fails
 *   redirectTo - path to redirect after successful login (default: "/")
 */
export default function GoogleSignInButton({ onError, redirectTo = "/" }) {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    // Load the Google Identity Services script
    const scriptId = "google-identity-services";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setSdkReady(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setSdkReady(true);
    }
  }, [clientId]);

  useEffect(() => {
    if (!sdkReady || !clientId || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: buttonRef.current.offsetWidth || 400,
      logo_alignment: "center",
    });
  }, [sdkReady, clientId]);

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      await api.auth.googleLogin(response.credential);
      window.location.href = redirectTo;
    } catch (err) {
      onError?.(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // If no client ID is configured, render a disabled placeholder
  if (!clientId) {
    return (
      <div className="w-full h-12 flex items-center justify-center rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground cursor-not-allowed">
        Google Sign-In not configured
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 z-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      {/* Google renders its button into this div */}
      <div
        ref={buttonRef}
        className="w-full overflow-hidden rounded-lg"
        style={{ minHeight: "44px" }}
      />
    </div>
  );
}
