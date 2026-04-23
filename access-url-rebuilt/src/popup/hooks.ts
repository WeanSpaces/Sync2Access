import { useState, useEffect } from 'react';

export interface TabInfo {
  tabId: number;
  url: string;
  domain: string;
  title: string;
}

export function useCurrentTab() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) { setTab(null); return; }
      const t = tabs[0];
      if (t?.id && t?.url) {
        try {
          const u = new URL(t.url);
          setTab({ tabId: t.id, url: t.url, domain: u.hostname, title: t.title || u.hostname });
        } catch { setTab(null); }
      }
    });
  }, []);
  return tab;
}

export function useCookies(domain: string | null) {
  const [cookies, setCookies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!domain) { setLoading(false); return; }
    let cancelled = false;
    chrome.runtime.sendMessage({ action: 'getCookiesForDomain', domain }, (res) => {
      if (!cancelled) {
        setLoading(false);
        if (chrome.runtime.lastError) { setError(chrome.runtime.lastError.message || 'Failed'); return; }
        setCookies(res?.cookies || []);
      }
    });
    return () => { cancelled = true; };
  }, [domain]);
  return { cookies, loading, error };
}
