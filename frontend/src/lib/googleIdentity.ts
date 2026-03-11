type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isDisplayed?: () => boolean;
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (listener?: (notification: GooglePromptNotification) => void) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google sign-in.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google sign-in."));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

export const requestGoogleCredential = async () => {
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();

  if (!clientId) {
    throw new Error("Google sign-in is not configured.");
  }

  await loadGoogleScript();

  return new Promise<string>((resolve, reject) => {
    const idApi = window.google?.accounts?.id;

    if (!idApi) {
      reject(new Error("Google sign-in is unavailable right now."));
      return;
    }

    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    idApi.cancel();
    idApi.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      callback: (response) => {
        finish(() => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error("Google sign-in did not return a credential."));
          }
        });
      },
    });

    idApi.prompt((notification) => {
      const skipped = notification.isSkippedMoment?.() || notification.isDismissedMoment?.() || notification.isNotDisplayed?.();

      if (skipped) {
        finish(() => reject(new Error("Google sign-in was cancelled.")));
      }
    });
  });
};
