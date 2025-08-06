/**
 * Dev-only console helper to explain common extension-originated errors.
 * No-op in production builds.
 *
 * This specifically annotates:
 *  "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"
 *
 * Usage:
 *   import { installExtensionNoiseGuard } from '../utils/dev/extensionNoiseGuard';
 *   if (import.meta.env.DEV) installExtensionNoiseGuard();
 */
export function installExtensionNoiseGuard() {
  if (typeof window === "undefined") return;
  if (!import.meta || !import.meta.env || !import.meta.env.DEV) return;

  const targetMsg =
    "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received";

  const origError = console.error;
  const origWarn = console.warn;

  const annotate = (args) => {
    try {
      const first = args && args[0] ? String(args[0]) : "";
      if (first && first.includes(targetMsg)) {
        // Print an explanatory line right before the original error
        origWarn.call(
          console,
          "[dev-note] This message is typically emitted by a browser extension content script (e.g., password manager, ad blocker, dev helper). " +
            "It is not coming from the app. Try Incognito/no extensions to confirm."
        );
      }
    } catch {}
  };

  console.error = function (...args) {
    annotate(args);
    return origError.apply(this, args);
  };

  console.warn = function (...args) {
    annotate(args);
    return origWarn.apply(this, args);
  };

  if (import.meta.env.DEV) {
    // One-time note in console to indicate helper installed
    try {
      // eslint-disable-next-line no-console
      console.info(
        "[dev-note] Extension noise guard installed. Extension-originated async listener errors will be annotated."
      );
    } catch {}
  }
}
