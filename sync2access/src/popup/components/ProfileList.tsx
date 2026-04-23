import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CryptoJS from 'crypto-js';
import { Plus, Trash2, FileDown, FileUp, Search, ChevronDown, Check, X, Save, ArrowLeft, Eye, EyeOff, FileText, Clipboard, ClipboardCheck, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../ui/dialog';
import { cn } from '../lib/utils';

interface CookieItem { name: string; value: string; domain: string; path: string; secure: boolean; httpOnly: boolean; sameSite: string; expirationDate?: number; hostOnly?: boolean; session?: boolean; storeId?: string; }
interface Profile { id: string; name: string; domain: string; cookies: CookieItem[]; createdAt: string; updatedAt: string; }
interface Props { domain: string; }

/* â”€â”€ Expandable Cookie Row (Cookie Editor style) â”€â”€ */
function CookieRow({ cookie, index }: { cookie: CookieItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="border-b border-border last:border-b-0">
      <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer select-none hover:bg-accent/50 transition-colors", expanded && "bg-accent/30")}
        onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} aria-expanded={expanded}>
        <ChevronDown className={cn("size-3 text-muted-foreground shrink-0 transition-transform duration-150", expanded && "rotate-180")} />
        <span className="text-xs font-medium truncate flex-1">{cookie.name}</span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{cookie.value}</span>
      </div>
      {expanded && (
        <div className="px-3 py-2 bg-secondary/30 space-y-1 text-[10px] border-t border-border/50">
          <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
            <span className="text-muted-foreground font-medium">Value</span>
            <span className="font-mono break-all">{cookie.value || '(empty)'}</span>
            <span className="text-muted-foreground font-medium">Domain</span>
            <span className="font-mono">{cookie.domain}</span>
            <span className="text-muted-foreground font-medium">Path</span>
            <span className="font-mono">{cookie.path || '/'}</span>
            {cookie.expirationDate && (<>
              <span className="text-muted-foreground font-medium">Expires</span>
              <span>{new Date(cookie.expirationDate * 1000).toLocaleString()}</span>
            </>)}
            <span className="text-muted-foreground font-medium">Flags</span>
            <div className="flex gap-1.5 flex-wrap">
              {cookie.secure && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">Secure</Badge>}
              {cookie.httpOnly && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">HttpOnly</Badge>}
              {cookie.sameSite && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{cookie.sameSite}</Badge>}
              {cookie.session && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">Session</Badge>}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/* â”€â”€ Profile Card (expandable, Cookie Editor style) â”€â”€ */
function ProfileCard({ profile, isActive, onSwitch, onDelete }: { profile: Profile; isActive: boolean; onSwitch: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = profile.cookies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.value.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={cn("rounded-md border overflow-hidden transition-colors", isActive ? "border-primary/50 shadow-sm" : "border-border")}>
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-2.5 py-2 cursor-pointer select-none", isActive ? "bg-primary/5" : "hover:bg-accent/50")}
        onClick={() => setExpanded(!expanded)}>
        <ChevronDown className={cn("size-3.5 text-muted-foreground shrink-0 transition-transform duration-150", expanded && "rotate-180")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{profile.name}</span>
            {isActive && <Badge className="text-[9px] px-1.5 py-0 h-4">{t('profiles.active')}</Badge>}
          </div>
          <p className="text-[10px] text-muted-foreground">{t('profiles.cookieCount', { count: profile.cookies.length })}</p>
        </div>
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {!isActive && <Button size="icon-xs" variant="ghost" onClick={onSwitch} title={t('profiles.switch')}><Check className="size-3" /></Button>}
          <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete} title={t('profiles.delete')}><Trash2 className="size-3" /></Button>
        </div>
      </div>

      {/* Expanded: cookie list */}
      {expanded && (
        <div className="border-t border-border">
          {profile.cookies.length > 5 && (
            <div className="relative px-2 py-1.5 border-b border-border/50 bg-secondary/20">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cookies..." className="h-6 pl-7 text-[10px]" />
            </div>
          )}
          <ul className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0
              ? <li className="px-3 py-2 text-[10px] text-muted-foreground text-center">No cookies match</li>
              : filtered.map((c, i) => <CookieRow key={`${c.name}-${c.domain}-${i}`} cookie={c} index={i} />)}
          </ul>
          <div className="px-2.5 py-1.5 border-t border-border/50 bg-secondary/20 text-[10px] text-muted-foreground">
            {t('profiles.createdAt', { date: new Date(profile.createdAt).toLocaleDateString() })}
          </div>
        </div>
      )}
    </div>
  );
}

/* â”€â”€ Main ProfileList â”€â”€ */
export function ProfileList({ domain }: Props) {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'import' | 'export'>('list');
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);

  useEffect(() => { load(); }, [domain]);

  async function load() {
    try {
      const [pr, ar] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'getProfiles', domain }),
        chrome.runtime.sendMessage({ action: 'getActiveProfile', domain }),
      ]);
      setProfiles(pr?.profiles || []);
      setActiveId(ar?.profileId || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function switchProfile(id: string) {
    const res = await chrome.runtime.sendMessage({ action: 'switchProfile', domain, profileId: id });
    if (res?.success) { setActiveId(id); } else { alert(t('profiles.switchFailed', { error: res?.error })); }
  }

  async function deleteProfile(id: string, name: string) {
    if (!confirm(t('profiles.deleteConfirm', { name }))) return;
    await chrome.runtime.sendMessage({ action: 'deleteProfile', domain, profileId: id });
    load();
  }

  if (loading) return <p className="text-xs text-muted-foreground text-center py-4">{t('common.loading')}</p>;

  async function clearCookies() {
    setClearMsg(null);
    setClearing(true);
    try {
      // Auto-backup: copy current cookies to clipboard in J2Team format
      const captured = await chrome.runtime.sendMessage({ action: 'getCookiesForDomain', domain });
      const cookies = captured?.cookies || [];
      if (cookies.length > 0) {
        const cookieData = cookies.map((c: any) => ({
          domain: c.domain, expirationDate: c.expirationDate,
          hostOnly: c.hostOnly ?? (c.domain ? !c.domain.startsWith('.') : true),
          httpOnly: c.httpOnly ?? false, name: c.name, path: c.path || '/',
          sameSite: c.sameSite || 'unspecified', secure: c.secure ?? false,
          session: c.session ?? !c.expirationDate, storeId: c.storeId || '0', value: c.value
        }));
        await navigator.clipboard.writeText(JSON.stringify(cookieData, null, 2));
      }
      // Clear cookies
      const res = await chrome.runtime.sendMessage({ action: 'clearCookiesForDomain', domain });
      if (res?.success) {
        setClearMsg(t('clearCookies.success', { count: res.removed }));
        // Reload active tab to reflect cleared state
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) chrome.tabs.reload(tab.id);
        setTimeout(() => setClearMsg(null), 3000);
      } else {
        setClearMsg(res?.error || 'Failed');
      }
    } catch (e: any) { setClearMsg(e.message); }
    setClearing(false);
  }

  if (view === 'create') return <CreateView domain={domain} onBack={() => setView('list')} onSuccess={() => { load(); setView('list'); }} />;
  if (view === 'import') return <ImportView domain={domain} onBack={() => setView('list')} onSuccess={() => { load(); setView('list'); }} />;
  if (view === 'export') return <ExportView domain={domain} onBack={() => setView('list')} />;

  return (
    <div className="flex flex-col">
      {/* Profile list */}
      <div className="space-y-1.5 min-h-[60px]">
        {profiles.length === 0
          ? <p className="text-xs text-muted-foreground text-center py-6">{t('profiles.empty')}</p>
          : profiles.map(p => (
            <ProfileCard key={p.id} profile={p} isActive={p.id === activeId}
              onSwitch={() => switchProfile(p.id)} onDelete={() => deleteProfile(p.id, p.name)} />
          ))}
        {profiles.length >= 10 && <p className="text-[10px] text-destructive text-center">{t('profiles.maxProfilesReached')}</p>}
      </div>

      {/* Bottom action bar (Cookie Editor style) */}
      <div className="flex items-center mt-2.5 border-t border-border pt-2">
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={() => setView('create')} disabled={profiles.length >= 10}>
          <Plus className="size-3" /><span className="text-[10px]">{t('profiles.create')}</span>
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={() => setView('import')} disabled={profiles.length >= 10}>
          <FileUp className="size-3" /><span className="text-[10px]">{t('profiles.import')}</span>
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={() => setView('export')}>
          <FileDown className="size-3" /><span className="text-[10px]">{t('profiles.export')}</span>
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="xs" className="flex-1 gap-1 text-destructive hover:text-destructive" onClick={clearCookies} disabled={clearing}>
          <Trash2 className="size-3" /><span className="text-[10px]">{clearing ? '...' : t('clearCookies.label')}</span>
        </Button>
      </div>
      {clearMsg && <p className="text-[10px] text-muted-foreground text-center mt-1">{clearMsg}</p>}
    </div>
  );
}

/* â”€â”€ Create Profile View (slides in like Cookie Editor) â”€â”€ */
function CreateView({ domain, onBack, onSuccess }: { domain: string; onBack: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    try {
      const cookies = await chrome.runtime.sendMessage({ action: 'captureCurrentCookies', domain });
      if (cookies?.error) throw new Error(cookies.error);
      const res = await chrome.runtime.sendMessage({ action: 'createProfile', name: name.trim(), domain, cookies: cookies.cookies });
      if (res?.success) onSuccess();
      else setError(res?.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t('profiles.profileName')}</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('profiles.namePlaceholder')} disabled={busy} autoFocus
          onKeyDown={e => e.key === 'Enter' && create()} />
        <p className="text-[10px] text-muted-foreground">{t('profiles.createFromCurrent')}</p>
      </div>
      {error && <p className="text-destructive text-[10px]">{error}</p>}
      <div className="flex items-center border-t border-border pt-2">
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={onBack} disabled={busy}>
          <ArrowLeft className="size-3" />{t('common.cancel')}
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={create} disabled={busy || !name.trim()}>
          <Save className="size-3" />{busy ? t('common.loading') : t('common.create')}
        </Button>
      </div>
    </div>
  );
}

/* â”€â”€ Format parsers (Cookie Editor inspired) â”€â”€ */
function parseHeaderString(text: string): CookieItem[] {
  return text.split(';').map(pair => pair.trim()).filter(Boolean).map(pair => {
    const eq = pair.indexOf('=');
    const name = eq > 0 ? pair.slice(0, eq).trim() : pair.trim();
    const value = eq > 0 ? pair.slice(eq + 1).trim() : '';
    return { name, value, domain: '', path: '/', secure: false, httpOnly: false, sameSite: 'lax' };
  });
}

function parseNetscape(text: string): CookieItem[] {
  return text.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(line => {
    const parts = line.split('\t');
    if (parts.length < 7) return null;
    return { domain: parts[0], path: parts[2], secure: parts[3] === 'TRUE', httpOnly: false,
      expirationDate: parseInt(parts[4]) || undefined, name: parts[5], value: parts[6], sameSite: 'lax' };
  }).filter(Boolean) as CookieItem[];
}

function parseCookieObject(c: any): CookieItem {
  return {
    name: c.name, value: c.value, domain: c.domain || '', path: c.path || '/',
    secure: c.secure ?? false, httpOnly: c.httpOnly ?? false,
    sameSite: c.sameSite || 'unspecified',
    expirationDate: c.expirationDate,
    hostOnly: c.hostOnly ?? (c.domain ? !c.domain.startsWith('.') : undefined),
    session: c.session ?? !c.expirationDate,
    storeId: c.storeId,
  };
}

function detectAndParse(text: string): { cookies: CookieItem[]; format: string; profileName?: string } {
  const trimmed = text.trim();
  // Encrypted J2TEAM
  if (trimmed.startsWith('j2cpwd')) return { cookies: [], format: 'encrypted' };
  // Try JSON
  try {
    const parsed = JSON.parse(trimmed);
    // Plain array of cookies (J2TEAM / Cookie-Editor standard format)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name !== undefined) {
      return { cookies: parsed.map(parseCookieObject), format: 'j2team' };
    }
    // Legacy wrapper format: { url, cookies: [...] }
    if (parsed.url && Array.isArray(parsed.cookies)) {
      return { cookies: parsed.cookies.map(parseCookieObject), format: 'j2team' };
    }
    // Profiles backup
    if (parsed.profiles) return { cookies: [], format: 'backup', profileName: 'backup' };
    return { cookies: [], format: 'unknown' };
  } catch {}
  // Try Netscape
  if (trimmed.includes('\t') && (trimmed.startsWith('.') || trimmed.startsWith('#') || trimmed.includes('TRUE') || trimmed.includes('FALSE'))) {
    const cookies = parseNetscape(trimmed);
    if (cookies.length) return { cookies, format: 'netscape' };
  }
  // Try Header String
  if (trimmed.includes('=') && trimmed.includes(';')) {
    const cookies = parseHeaderString(trimmed);
    if (cookies.length) return { cookies, format: 'headerstring' };
  }
  return { cookies: [], format: 'unknown' };
}

function formatToNetscape(cookies: CookieItem[]): string {
  const lines = ['# Netscape HTTP Cookie File', '# Generated by Sync2Access Extension', ''];
  cookies.forEach(c => { lines.push(`${c.domain}\t${c.hostOnly ? 'FALSE' : 'TRUE'}\t${c.path}\t${c.secure ? 'TRUE' : 'FALSE'}\t${c.expirationDate || 0}\t${c.name}\t${c.value}`); });
  return lines.join('\n');
}

function formatToHeaderString(cookies: CookieItem[]): string {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

/* â”€â”€ Import View (File + Text, multi-format) â”€â”€ */
function ImportView({ domain, onBack, onSuccess }: { domain: string; onBack: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  // Encrypted state
  const [encrypted, setEncrypted] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  // Preview
  const [preview, setPreview] = useState<{ cookies: CookieItem[]; format: string } | null>(null);

  function reset() { setError(null); setSuccess(null); setPreview(null); setEncrypted(null); setPwd(''); }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    reset();
    setProfileName(file.name.replace(/\.(json|txt)$/i, ''));
    try {
      const text = await file.text();
      processInput(text);
    } catch (err: any) { setError(err.message); }
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleTextParse() {
    if (!textInput.trim()) return;
    reset();
    processInput(textInput);
  }

  function processInput(text: string) {
    const result = detectAndParse(text);
    if (result.format === 'encrypted') { setEncrypted(text.trim()); return; }
    if (result.format === 'backup') { importBackup(text); return; }
    if (result.format === 'unknown' || result.cookies.length === 0) { setError('Could not parse input. Supported: JSON, J2TEAM, Header String, Netscape.'); return; }
    setPreview(result);
  }

  async function importBackup(text: string) {
    setBusy(true);
    try {
      const parsed = JSON.parse(text);
      const res = await chrome.runtime.sendMessage({ action: 'importProfiles', data: parsed });
      if (res?.success) { setSuccess(`Imported ${res.result?.imported || 0} profiles`); setTimeout(onSuccess, 1200); }
      else setError(res?.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setBusy(false);
  }

  async function doImport() {
    if (!preview?.cookies.length) return;
    setBusy(true); setError(null);
    try {
      const name = profileName.trim() || `Import ${new Date().toLocaleDateString()}`;
      const res = await chrome.runtime.sendMessage({ action: 'createProfile', name, domain, cookies: preview.cookies });
      if (res?.success) { setSuccess(`Imported ${preview.cookies.length} cookies as "${name}"`); setTimeout(onSuccess, 1200); }
      else setError(res?.error || 'Failed');
    } catch (e: any) { setError(e.message); }
    setBusy(false);
  }

  async function decryptAndImport() {
    if (!encrypted || !pwd) return;
    setBusy(true); setError(null);
    try {
      let data = encrypted; if (data.startsWith('j2cpwd')) data = data.slice(6);
      const decrypted = CryptoJS.AES.decrypt(data.trim(), pwd).toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Wrong password');
      const result = detectAndParse(decrypted);
      if (result.cookies.length === 0) throw new Error('No cookies found after decryption');
      const name = profileName.trim() || 'Decrypted Import';
      const res = await chrome.runtime.sendMessage({ action: 'createProfile', name, domain, cookies: result.cookies });
      if (res?.success) { setSuccess(`Imported ${result.cookies.length} cookies`); setTimeout(onSuccess, 1200); }
      else setError(res?.error || 'Failed');
    } catch (e: any) { setError(e.message || 'Wrong password or corrupted data'); }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle tabs */}
      <div className="flex rounded-md border border-border overflow-hidden">
        <button onClick={() => { setMode('file'); reset(); }} className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors", mode === 'file' ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-accent")}>
          <FileUp className="size-3" />File
        </button>
        <div className="w-px bg-border" />
        <button onClick={() => { setMode('text'); reset(); }} className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors", mode === 'text' ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-accent")}>
          <FileText className="size-3" />Paste Text
        </button>
      </div>

      {/* Encrypted password prompt */}
      {encrypted ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-secondary/50 border border-border">
            <span className="text-[10px]">🔒</span>
            <span className="text-[10px] text-muted-foreground flex-1">Encrypted J2TEAM file detected</span>
          </div>
          <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Profile name" className="text-xs" />
          <div className="relative">
            <Input type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Enter password to decrypt"
              onKeyDown={e => e.key === 'Enter' && decryptAndImport()} className="text-xs pr-8" autoFocus />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            </button>
          </div>
        </div>
      ) : preview ? (
        /* Preview parsed cookies */
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-secondary/50 border border-border">
            <Check className="size-3 text-success shrink-0" />
            <span className="text-[10px] flex-1">
              Detected <strong>{preview.format.toUpperCase()}</strong> - {preview.cookies.length} cookies
            </span>
          </div>
          <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Profile name (optional)" className="text-xs" autoFocus />
          <ul className="max-h-[100px] overflow-y-auto rounded-md border border-border/50 divide-y divide-border/30">
            {preview.cookies.slice(0, 20).map((c, i) => (
              <li key={i} className="flex items-center gap-1.5 px-2 py-1 text-[10px]">
                <span className="font-medium truncate flex-1">{c.name}</span>
                <span className="text-muted-foreground truncate max-w-[100px] font-mono">{c.value}</span>
              </li>
            ))}
            {preview.cookies.length > 20 && <li className="px-2 py-1 text-[10px] text-muted-foreground text-center">+{preview.cookies.length - 20} more</li>}
          </ul>
        </div>
      ) : mode === 'file' ? (
        /* File input */
        <div className="space-y-1">
          <Input ref={fileRef} type="file" accept=".json,.txt,.cookies" onChange={handleFile} disabled={busy}
            className="text-xs file:mr-2 file:text-[10px] file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-2 file:py-1 file:cursor-pointer" />
          <p className="text-[10px] text-muted-foreground">JSON | J2TEAM | Header String | Netscape | Encrypted (.txt)</p>
        </div>
      ) : (
        /* Text paste area */
        <div className="space-y-1">
          <textarea value={textInput} onChange={e => setTextInput(e.target.value)} disabled={busy}
            className="w-full h-[120px] rounded-md border border-input bg-transparent px-2.5 py-2 text-[10px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground"
            placeholder={'JSON:\n[{"name":"session","value":"abc123",...}]\n\nHeader String:\nsession=abc123; token=xyz\n\nNetscape:\n.example.com\tTRUE\t/\tFALSE\t0\tsession\tabc123'} />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Paste cookies in any supported format</p>
            <Button variant="ghost" size="xs" onClick={handleTextParse} disabled={busy || !textInput.trim()} className="text-[10px] gap-1">
              <Search className="size-3" />Parse
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-[10px] px-0.5">{error}</p>}
      {success && <p className="text-success text-[10px] font-medium px-0.5">{success}</p>}

      {/* Bottom action bar */}
      <div className="flex items-center border-t border-border pt-2">
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={() => { if (preview || encrypted) { reset(); } else onBack(); }} disabled={busy}>
          <ArrowLeft className="size-3" />{preview || encrypted ? 'Back' : t('common.cancel')}
        </Button>
        {(preview || encrypted) && (<>
          <div className="w-px h-5 bg-border" />
          <Button variant="ghost" size="xs" className="flex-1 gap-1" disabled={busy || (encrypted ? !pwd : false)}
            onClick={encrypted ? decryptAndImport : doImport}>
            <FileUp className="size-3" />{busy ? '...' : (encrypted ? 'Decrypt & Import' : 'Import')}
          </Button>
        </>)}
      </div>
    </div>
  );
}

/* --- Export View (multi-format: J2TEAM, Encrypted, Header String, Netscape, Backup, Copy) --- */
function ExportView({ domain, onBack }: { domain: string; onBack: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<string | null>(null);

  function download(content: string, filename: string) {
    const blob = new Blob([content], { type: filename.endsWith('.json') ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Delay cleanup to ensure download triggers before popup closes
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  async function getCookies(): Promise<CookieItem[]> {
    const res = await chrome.runtime.sendMessage({ action: 'getCookiesForDomain', domain });
    return res?.cookies || [];
  }

  function toJ2Team(cookies: CookieItem[]): CookieItem[] {
    return cookies.map(c => ({
      domain: c.domain, expirationDate: c.expirationDate,
      hostOnly: c.hostOnly ?? (c.domain ? !c.domain.startsWith('.') : true),
      httpOnly: c.httpOnly ?? false,
      name: c.name, path: c.path || '/',
      sameSite: c.sameSite === 'no_restriction' ? 'no_restriction' : (c.sameSite?.toLowerCase() || 'unspecified'),
      secure: c.secure ?? false,
      session: c.session ?? !c.expirationDate,
      storeId: c.storeId || '0', value: c.value
    }));
  }

  async function doExport(format: 'j2team' | 'encrypted' | 'headerstring' | 'netscape' | 'json-array' | 'backup', action: 'download' | 'copy' | 'preview') {
    if (format === 'encrypted' && !pwd) { setError('Password required'); return; }
    setBusy(true); setError(null); setSuccess(null); setPreviewText(null);
    try {
      if (format === 'backup') {
        const res = await chrome.runtime.sendMessage({ action: 'exportProfiles', domains: [domain] });
        if (!res?.success) throw new Error(res?.error || 'Export failed');
        const text = JSON.stringify(res.data, null, 2);
        if (action === 'download') { download(text, `profiles-${domain}-${Date.now()}.json`); setSuccess(`Profiles backup downloaded`); }
        else if (action === 'copy') { await navigator.clipboard.writeText(text); showCopied('backup'); }
        else { setPreviewText(text); setPreviewFormat('Profiles Backup'); }
        setBusy(false); return;
      }

      const cookies = await getCookies();
      if (!cookies.length) { setError('No cookies found for this domain'); setBusy(false); return; }

      let output = '';
      let filename = '';
      switch (format) {
        case 'j2team': output = JSON.stringify(toJ2Team(cookies), null, 2); filename = `${domain}_cookies.json`; break;
        case 'encrypted': output = 'j2cpwd' + CryptoJS.AES.encrypt(JSON.stringify(toJ2Team(cookies)), pwd).toString(); filename = `${domain}_encrypted.txt`; break;
        case 'headerstring': output = formatToHeaderString(cookies); filename = `${domain}_cookies.txt`; break;
        case 'netscape': output = formatToNetscape(cookies); filename = `${domain}_cookies_netscape.txt`; break;
        case 'json-array': output = JSON.stringify(cookies, null, 2); filename = `${domain}_cookies_raw.json`; break;
      }

      if (action === 'download') { download(output, filename); setSuccess(`Copied: Exported ${cookies.length} cookies (${format})`); }
      else if (action === 'copy') { await navigator.clipboard.writeText(output); showCopied(format); }
      else { setPreviewText(output); setPreviewFormat(format.toUpperCase()); }
    } catch (e: any) { setError(e.message); }
    setBusy(false);
  }

  function showCopied(fmt: string) { setCopied(fmt); setSuccess(`Copied to clipboard`); setTimeout(() => setCopied(null), 2000); }

  const formats: { key: string; label: string; format: 'j2team' | 'encrypted' | 'headerstring' | 'netscape' | 'json-array' | 'backup'; needsPwd?: boolean }[] = [
    { key: 'j2team', label: 'J2TEAM Cookies', format: 'j2team' },
    { key: 'json', label: 'JSON Array', format: 'json-array' },
    { key: 'header', label: 'Header String', format: 'headerstring' },
    { key: 'netscape', label: 'Netscape', format: 'netscape' },
  ];

  return (
    <div className="space-y-2">
      {previewText ? (
        /* Preview mode */
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium">{previewFormat} Preview</span>
            <Button variant="ghost" size="xs" className="text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(previewText); showCopied('preview'); }}>
              {copied === 'preview' ? <ClipboardCheck className="size-3 text-success" /> : <Copy className="size-3" />}Copy
            </Button>
          </div>
          <textarea readOnly value={previewText} className="w-full h-[140px] rounded-md border border-input bg-secondary/30 px-2.5 py-2 text-[10px] font-mono resize-none" />
        </div>
      ) : (
        /* Export format buttons */
        <div className="space-y-1">
          {formats.map(f => (
            <div key={f.key} className="flex items-center gap-1 rounded-md border border-border/50 overflow-hidden">
              <button onClick={() => doExport(f.format, 'download')} disabled={busy}
                className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent/50 transition-colors text-left">
                <FileDown className="size-3 text-muted-foreground shrink-0" />{f.label}
              </button>
              <div className="w-px h-5 bg-border/50" />
              <button onClick={() => doExport(f.format, 'copy')} disabled={busy} title="Copy to clipboard"
                className="px-2 py-1.5 hover:bg-accent/50 transition-colors">
                {copied === f.format ? <ClipboardCheck className="size-3 text-success" /> : <Clipboard className="size-3 text-muted-foreground" />}
              </button>
              <div className="w-px h-5 bg-border/50" />
              <button onClick={() => doExport(f.format, 'preview')} disabled={busy} title="Preview"
                className="px-2 py-1.5 hover:bg-accent/50 transition-colors">
                <Eye className="size-3 text-muted-foreground" />
              </button>
            </div>
          ))}

          {/* Encrypted export row with password */}
          <div className="rounded-md border border-border/50 overflow-hidden">
            <div className="flex items-center gap-1 px-2.5 py-1.5">
              <span className="text-[10px]">🔒</span>
              <span className="text-[10px] font-medium flex-1">Encrypted J2TEAM</span>
              <Button variant="ghost" size="xs" className="text-[10px] h-5 px-1.5" onClick={() => doExport('encrypted', 'download')} disabled={busy || !pwd}>
                <FileDown className="size-3" />
              </Button>
            </div>
            <div className="px-2.5 pb-1.5">
              <div className="relative">
                <Input type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Set encryption password" className="text-[10px] h-7 pr-7" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Profiles backup */}
          <div className="flex items-center gap-1 rounded-md border border-border/50 overflow-hidden">
            <button onClick={() => doExport('backup', 'download')} disabled={busy}
              className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent/50 transition-colors text-left">
              <Save className="size-3 text-muted-foreground shrink-0" />Profiles Backup
            </button>
            <div className="w-px h-5 bg-border/50" />
            <button onClick={() => doExport('backup', 'copy')} disabled={busy} title="Copy to clipboard"
              className="px-2 py-1.5 hover:bg-accent/50 transition-colors">
              {copied === 'backup' ? <ClipboardCheck className="size-3 text-success" /> : <Clipboard className="size-3 text-muted-foreground" />}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-[10px] px-0.5">{error}</p>}
      {success && <p className="text-success text-[10px] font-medium px-0.5">{success}</p>}

      <div className="flex items-center border-t border-border pt-2">
        <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={() => { if (previewText) { setPreviewText(null); setPreviewFormat(null); } else onBack(); }}>
          <ArrowLeft className="size-3" />{previewText ? 'Back' : t('common.close')}
        </Button>
      </div>
    </div>
  );
}
