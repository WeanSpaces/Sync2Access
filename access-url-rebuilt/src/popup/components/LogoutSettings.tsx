import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface Props { domain: string; }

export function LogoutSettings({ domain }: Props) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [domainProtected, setDomainProtected] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [domain]);

  async function load() {
    setLoading(true);
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getLogoutSettings' });
      if (res) {
        setEnabled(res.enabled ?? false);
        setBlockedCount(res.blockedCount ?? 0);
        const excluded: string[] = res.excludedDomains || [];
        setDomainProtected(!excluded.includes(domain));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function toggleGlobal(checked: boolean) {
    const res = await chrome.runtime.sendMessage({ action: 'setLogoutEnabled', enabled: checked });
    if (res?.success) { setEnabled(checked); load(); }
  }

  async function toggleDomain(checked: boolean) {
    const res = await chrome.runtime.sendMessage({ action: 'toggleLogoutDomain', domain, enabled: checked });
    if (res?.success) { setDomainProtected(checked); load(); }
  }

  if (loading) return <p className="text-xs text-muted-foreground">{t('common.loading')}</p>;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <Label className="text-xs font-medium cursor-pointer">{t('logoutPrevention.title')}</Label>
          <span className="text-[10px] text-muted-foreground">{t('logoutPrevention.description')}</span>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleGlobal} />
      </div>

      <div className="rounded-md border border-border px-3 py-2">
        <p className="text-[10px] text-muted-foreground">
          {t('logoutPrevention.blockedCount', { count: blockedCount })}
        </p>
      </div>

      {domain && (
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <Label className="text-xs font-medium">{t('logoutPrevention.currentDomain')}</Label>
            <span className="text-[10px] text-muted-foreground">
              {domainProtected
                ? t('logoutPrevention.disableForDomain', { domain })
                : t('logoutPrevention.enableForDomain', { domain })}
            </span>
          </div>
          <Switch checked={domainProtected} onCheckedChange={toggleDomain} disabled={!enabled} />
        </div>
      )}
    </div>
  );
}
