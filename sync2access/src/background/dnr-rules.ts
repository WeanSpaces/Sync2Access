// ============================================================
// Sync2Access Extension - DNR Rules Manager
// Manages DeclarativeNetRequest rules for intercepting logout
// URLs and redirecting them to the confirmation page.
// Reverse-engineered from minified source v1.7.0
// ============================================================

import type { LogoutPreventionSettings } from '../shared/types';
import {
  DEFAULT_LOGOUT_PATTERNS,
  DNR_RULE_BASE_ID,
  DNR_BYPASS_RULE_ID,
  BYPASS_TOKEN_PARAM,
} from '../shared/constants';
import { getSettings } from './logout-prevention';

/**
 * Escape special regex characters in a pattern string,
 * then convert wildcard (*) to regex (.*).
 */
function patternToRegex(pattern: string): string {
  // Escape all regex special chars except *
  let escaped = pattern.replace(/[.+?^${}()|[\]\\-]/g, '\\$&');
  // Convert * to .*
  escaped = escaped.replace(/\*/g, '.*');
  return escaped;
}

/**
 * Create a DNR redirect rule for a specific logout URL pattern.
 * When matched, the navigation is redirected to logout-confirm.html
 * with the original URL as a query parameter.
 */
function createLogoutRule(
  ruleId: number,
  pattern: string
): chrome.declarativeNetRequest.Rule {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        regexSubstitution: `${chrome.runtime.getURL('logout-confirm.html')}?url=\\0`,
      },
    },
    condition: {
      regexFilter: `^(https?://[^?#]*${patternToRegex(pattern)}[^?#]*)`,
      isUrlFilterCaseSensitive: false,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };
}

/**
 * Create the bypass allow rule.
 * This rule has higher priority (2) and allows URLs containing
 * the bypass token parameter to pass through without redirection.
 */
function createBypassRule(): chrome.declarativeNetRequest.Rule {
  return {
    id: DNR_BYPASS_RULE_ID,
    priority: 2,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
    },
    condition: {
      urlFilter: `*${BYPASS_TOKEN_PARAM}=*`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };
}

/**
 * Enable logout DNR rules with the given excluded domains.
 * Creates redirect rules for all default logout patterns and
 * a bypass allow rule for the bypass token.
 */
export async function enableLogoutRules(excludedDomains: string[] = []): Promise<void> {
  const rules: chrome.declarativeNetRequest.Rule[] = [];

  // Add the bypass allow rule (higher priority)
  rules.push(createBypassRule());

  // Add redirect rules for each logout pattern
  DEFAULT_LOGOUT_PATTERNS.forEach((pattern, index) => {
    const rule = createLogoutRule(DNR_RULE_BASE_ID + index, pattern);

    // Apply domain exclusions if any
    if (excludedDomains.length > 0 && rule.condition) {
      (rule.condition as any).excludedRequestDomains = excludedDomains;
    }

    rules.push(rule);
  });

  // Get existing dynamic rules that we manage
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const managedRuleIds = existingRules
    .filter((rule) => rule.id === DNR_BYPASS_RULE_ID || (rule.id >= DNR_RULE_BASE_ID && rule.id < DNR_RULE_BASE_ID + 100))
    .map((rule) => rule.id);

  // Remove old rules and add new ones atomically
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: managedRuleIds,
    addRules: rules,
  });

  console.log('[Sync2Access] DNR logout rules enabled:', rules.length);
}

/**
 * Disable all logout DNR rules.
 */
export async function disableLogoutRules(): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const managedRuleIds = existingRules
    .filter((rule) => rule.id === DNR_BYPASS_RULE_ID || (rule.id >= DNR_RULE_BASE_ID && rule.id < DNR_RULE_BASE_ID + 100))
    .map((rule) => rule.id);

  if (managedRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: managedRuleIds,
    });
    console.log('[Sync2Access] DNR logout rules disabled');
  }
}

/**
 * Update DNR rules based on the current enabled state.
 */
export async function updateLogoutRules(enabled: boolean, excludedDomains: string[]): Promise<void> {
  if (enabled) {
    await enableLogoutRules(excludedDomains);
  } else {
    await disableLogoutRules();
  }
}

/**
 * Initialize DNR rules from stored settings.
 * Called on extension startup / service worker activation.
 */
export async function initializeDnrRules(settingsGetter: () => Promise<LogoutPreventionSettings>): Promise<void> {
  const settings = await settingsGetter();
  if (settings.enabled) {
    await enableLogoutRules(settings.excludedDomains);
  } else {
    await disableLogoutRules();
  }
}
