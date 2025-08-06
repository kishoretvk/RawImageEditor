import React, { useEffect, useRef } from "react";
import "./AdSenseBox.css";

// Shared loader: inject AdSense script once
function ensureAdSenseScript(client) {
  if (typeof window === "undefined") return;
  if (window.__adsenseLoaded) return;
  const existing = document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js"]');
  if (existing) {
    window.__adsenseLoaded = true;
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js?client=${encodeURIComponent(client)}`;
  s.crossOrigin = "anonymous";
  s.onload = () => { window.__adsenseLoaded = true; };
  document.head.appendChild(s);
}

/**
 * AdSenseBox
 * Renders a non-distracting AdSense unit. Loads the AdSense script once and reuses it.
 *
 * Props:
 *  - client: your AdSense publisher id (e.g., "ca-pub-3347414112529675")
 *  - slot: optional ad slot id (string). If omitted, auto-format is used.
 *  - layout: "landing" | "editor" to apply size presets
 *  - className: optional className
 */
export default function AdSenseBox({ client = "ca-pub-3347414112529675", slot = "", layout = "landing", className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    ensureAdSenseScript(client);

    // Push after a tick to allow script to init
    const t = setTimeout(() => {
      try {
        if (window.adsbygoogle && ref.current) {
          window.adsbygoogle.push({});
        }
      } catch {}
    }, 50);
    return () => clearTimeout(t);
  }, [client, slot]);

  const classes = ["adsense-box", `is-${layout}`, className].filter(Boolean).join(" ");

  // Use auto format when no explicit slot is provided
  const useAuto = !slot;

  return (
    <aside className={classes} aria-label="advertisement">
      <div className="adsense-box__label">Sponsored</div>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        {...(useAuto
          ? { "data-ad-format": "auto", "data-full-width-responsive": "true" }
          : { "data-ad-slot": slot, "data-ad-format": "rectangle" })}
      />
    </aside>
  );
}
