import { useEffect, useRef } from 'react';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise;

function loadScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/*
 * Cloudflare Turnstile: a privacy-friendly captcha that usually needs no
 * clicks. It gives us a token; the backend checks the token with Cloudflare.
 */
export default function Turnstile({ siteKey, onToken, resetKey }) {
  const container = useRef(null);

  useEffect(() => {
    let widgetId;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: onToken,
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      cancelled = true;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, onToken, resetKey]);

  return <div ref={container} className="turnstile" />;
}
