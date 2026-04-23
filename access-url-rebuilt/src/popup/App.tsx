import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe, ChevronDown, Check, Copy, Trash2 } from 'lucide-react';
import { useTheme } from './lib/theme-provider';
import { useCurrentTab, useCookies } from './hooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { ProfileList } from './components/ProfileList';
import { LogoutSettings } from './components/LogoutSettings';
import { cn } from './lib/utils';

const SHARE_URL = 'https://friendshouse.io.vn';

/* ── Theme Toggle ── */
function ThemeToggle() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(!open)}>
        <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">{t('theme.toggle')}</span>
      </Button>
      {open && (
        <div className={cn('absolute right-0 top-full mt-1 z-[9999] min-w-[100px] rounded-md border bg-popover p-1 shadow-md', 'animate-in fade-in-0 zoom-in-95')}>
          {(['light', 'dark', 'system'] as const).map(mode => (
            <button key={mode} className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-default"
              onClick={() => { setTheme(mode); setOpen(false); }}>{t(`theme.${mode}`)}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Language Switcher ── */
function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const langs = [{ code: 'en', name: 'English' }, { code: 'vi', name: 'Tiếng Việt' }, { code: 'zh', name: '中文' }, { code: 'ko', name: '한국어' }, { code: 'ru', name: 'Русский' }];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(!open)}>
        <Globe className="h-3.5 w-3.5" />
        <span className="sr-only">{t('language.switch')}</span>
      </Button>
      {open && (
        <div className={cn('absolute right-0 top-full mt-1 z-[9999] min-w-[100px] rounded-md border bg-popover p-1 shadow-md', 'animate-in fade-in-0 zoom-in-95')}>
          {langs.map(l => (
            <button key={l.code} className={cn('w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-default', i18n.language === l.code && 'font-semibold')}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}>{l.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Share Form sub-components ── */
function PasswordInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <Label htmlFor="password" className="text-xs">{t('passwordInput.label')} <span className="text-muted-foreground">{t('passwordInput.optional')}</span></Label>
      <Input id="password" type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={t('passwordInput.placeholder')} className={error ? 'border-destructive' : ''} />
      {error && <p className="text-destructive text-[10px]">{error}</p>}

    </div>
  );
}

function ExpirationSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation();
  const opts = [{ hours: 1, label: t('expirationSelector.oneHour') }, { hours: 24, label: t('expirationSelector.oneDay') }, { hours: 168, label: t('expirationSelector.oneWeek') }, { hours: 720, label: t('expirationSelector.oneMonth') }, { hours: 2160, label: t('expirationSelector.threeMonths') }];
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t('expirationSelector.label')}</Label>
      <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger size="sm" className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opts.map(o => <SelectItem key={o.hours} value={String(o.hours)} className="text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function UsageLimitSelector({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const { t } = useTranslation();
  const opts = [{ val: '1', label: t('usageLimitSelector.times', { count: 1 }) }, { val: '5', label: t('usageLimitSelector.times', { count: 5 }) }, { val: '10', label: t('usageLimitSelector.times', { count: 10 }) }, { val: '25', label: t('usageLimitSelector.times', { count: 25 }) }, { val: '50', label: t('usageLimitSelector.times', { count: 50 }) }, { val: '100', label: t('usageLimitSelector.times', { count: 100 }) }, { val: 'unlimited', label: t('usageLimitSelector.unlimited') }];
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t('usageLimitSelector.label')}</Label>
      <Select value={value == null ? 'unlimited' : String(value)} onValueChange={v => onChange(v === 'unlimited' ? null : Number(v))}>
        <SelectTrigger size="sm" className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opts.map(o => <SelectItem key={o.val} value={o.val} className="text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function RedirectUrlInput({ value, onChange, currentUrl }: { value: string; onChange: (v: string) => void; currentUrl: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t('redirectUrl.label')}</Label>
      <Input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={t('redirectUrl.placeholder')} />
      <p className="text-muted-foreground text-[10px]">{t('redirectUrl.hint')}</p>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const { t } = useTranslation();
  const tab = useCurrentTab();
  const { cookies, loading, error } = useCookies(tab?.domain || null);

  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState(168);
  const [maxAccess, setMaxAccess] = useState<number | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [includeLS, setIncludeLS] = useState(false);
  const [lsData, setLsData] = useState<Record<string, string> | null>(null);
  const [lsLoading, setLsLoading] = useState(false);
  const [lsSize, setLsSize] = useState(0);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);

  useEffect(() => { if (tab?.url && !redirectUrl) setRedirectUrl(tab.url); }, [tab?.url]);

  useEffect(() => {
    if (!includeLS || !tab?.tabId) { setLsData(null); setLsSize(0); return; }
    setLsLoading(true);
    chrome.runtime.sendMessage({ action: 'captureLocalStorage', tabId: tab.tabId }, (res) => {
      setLsLoading(false);
      if (res?.success && res.localStorage) {
        setLsData(res.localStorage);
        setLsSize(Math.round(JSON.stringify(res.localStorage).length / 1024));
      } else { setLsData(null); setLsSize(0); }
    });
  }, [includeLS, tab?.tabId]);

  async function createShare() {
    if (!tab?.domain || cookies.length === 0) return;
    setShareError(null);
    try {
      const res = await chrome.runtime.sendMessage({
        action: 'shareCookies',
        cookies,
        password,
        domain: tab.domain,
        expiresInHours: expiresIn,
        maxAccess,
        redirectUrl: redirectUrl || null,
      });
      if (res?.success && (res.shareId || res.id)) {
        setShareId(res.shareId || res.id);
      } else {
        setShareError(res?.error || 'Failed to create share');
      }
    } catch (e: any) { setShareError(e.message); }
  }

  async function clearCookies() {
    if (!tab?.domain || cookies.length === 0) return;
    setClearMsg(null);
    setClearing(true);
    try {
      // Auto-backup: copy cookies to clipboard in J2Team format before clearing
      const cookieData = cookies.map((c: any) => ({
        domain: c.domain, expirationDate: c.expirationDate,
        hostOnly: c.hostOnly ?? (c.domain ? !c.domain.startsWith('.') : true),
        httpOnly: c.httpOnly ?? false, name: c.name, path: c.path || '/',
        sameSite: c.sameSite || 'unspecified', secure: c.secure ?? false,
        session: c.session ?? !c.expirationDate, storeId: c.storeId || '0', value: c.value
      }));
      await navigator.clipboard.writeText(JSON.stringify(cookieData, null, 2));

      // Now clear
      const res = await chrome.runtime.sendMessage({ action: 'clearCookiesForDomain', domain: tab.domain });
      if (res?.success) {
        setClearMsg(t('clearCookies.success', { count: res.removed }));
        // Reload tab to reflect cleared state
        if (tab.tabId) chrome.tabs.reload(tab.tabId);
      } else {
        setClearMsg(res?.error || 'Failed to clear cookies');
      }
    } catch (e: any) { setClearMsg(e.message); }
    setClearing(false);
  }

  /* ── Header ── */
  const Header = () => (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      <span className="text-sm font-semibold text-foreground">{t('popup.title')}</span>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </div>
  );

  /* ── Cannot access ── */
  if (!tab) {
    return (
      <div className="w-80 bg-card text-card-foreground rounded-lg border shadow-sm">
        <Header />
        <div className="p-3"><p className="text-destructive text-sm">{t('popup.cannotAccess')}</p></div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="w-80 bg-card text-card-foreground rounded-lg border shadow-sm">
        <Header />
        <div className="p-3"><p className="text-muted-foreground text-sm">{t('popup.loadingCookies')}</p></div>
      </div>
    );
  }

  /* ── Share created ── */
  if (shareId) {
    const shareUrl = `${SHARE_URL}/s/${shareId}`;
    return (
      <div className="w-80 bg-card text-card-foreground rounded-lg border shadow-sm">
        <Header />
        <div className="p-3 text-center space-y-3">
          <div className="text-success font-semibold">{t('shareCreation.title')}</div>
          <p className="text-xs text-muted-foreground">{t('shareCreation.message', { count: cookies.length, domain: tab.domain })}</p>
          <div className="flex gap-2">
            <Input type="text" value={shareUrl} readOnly className="font-mono text-xs" />
            <Button variant="secondary" size="sm" className="shrink-0" onClick={async () => { await navigator.clipboard.writeText(shareUrl); }}>
              <Copy className="h-4 w-4" />{t('copyUrlButton.label')}
            </Button>
          </div>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setShareId(null); setPassword(''); setExpiresIn(168); setMaxAccess(null); setRedirectUrl(tab.url); }}>
            {t('shareCreation.createAnother')}
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main UI ── */
  return (
    <div className="w-[340px] bg-card text-card-foreground rounded-lg border shadow-sm">
      <Header />
      <div className="p-3">
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8 mb-3">
            <TabsTrigger value="share" className="text-xs h-7">{t('tabs.share')}</TabsTrigger>
            <TabsTrigger value="profiles" className="text-xs h-7">{t('tabs.profiles')}</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-7">{t('tabs.settings')}</TabsTrigger>
          </TabsList>

          {/* ── Share Tab ── */}
          <TabsContent value="share" className="space-y-2.5 mt-0">
            <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-muted-foreground shrink-0">{t('popup.domain')}:</span>
                <span className="text-xs font-medium truncate">{tab.domain}</span>
              </div>
              <Badge variant="secondary" className="text-xs font-medium px-1.5 py-0.5 shrink-0">
                {cookies.length} {t('popup.cookiesFound')}
              </Badge>
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}

            {cookies.length > 0 && (
              <div className="space-y-2">
                {/* localStorage toggle */}
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="include-ls" className="text-xs font-medium cursor-pointer">{t('localStorage.include')}</Label>
                    {lsLoading && <span className="text-[10px] text-muted-foreground">{t('common.loading')}</span>}
                    {!lsLoading && includeLS && lsData && (
                      <span className={`text-[10px] ${lsSize > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {Object.keys(lsData).length} {t('localStorage.items')} ({lsSize}KB)
                      </span>
                    )}
                    {includeLS && lsSize > 500 && <span className="text-[10px] text-destructive">{t('localStorage.tooLarge')}</span>}
                  </div>
                  <Switch id="include-ls" checked={includeLS} onCheckedChange={setIncludeLS} />
                </div>

                <PasswordInput value={password} onChange={setPassword} />
                <div className="grid grid-cols-2 gap-2">
                  <ExpirationSelector value={expiresIn} onChange={setExpiresIn} />
                  <UsageLimitSelector value={maxAccess} onChange={setMaxAccess} />
                </div>
                <RedirectUrlInput value={redirectUrl} onChange={setRedirectUrl} currentUrl={tab.url} />

                {shareError && <p className="text-destructive text-xs">{shareError}</p>}

                <Button onClick={createShare} disabled={cookies.length === 0} className="w-full h-8 text-xs">
                  {t('shareButton.label')}
                </Button>
                <Button variant="outline" onClick={clearCookies} disabled={cookies.length === 0 || clearing} className="w-full h-8 text-xs gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="size-3" />
                  {clearing ? t('common.loading') : t('clearCookies.label')}
                </Button>
                {clearMsg && <p className="text-[10px] text-muted-foreground text-center">{clearMsg}</p>}
              </div>
            )}

            {cookies.length === 0 && <p className="text-muted-foreground text-xs text-center py-3">{t('popup.noCookies')}</p>}
          </TabsContent>

          {/* ── Profiles Tab ── */}
          <TabsContent value="profiles" className="mt-0">
            <ProfileList domain={tab.domain} />
          </TabsContent>

          {/* ── Settings Tab ── */}
          <TabsContent value="settings" className="mt-0">
            <LogoutSettings domain={tab.domain} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
