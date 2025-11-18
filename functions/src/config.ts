import { logger } from 'firebase-functions';
import * as functions from 'firebase-functions';

type Nullable<T> = T | null | undefined;

interface ResendConfig {
  apiKey: string;
  sender: string;
}

interface RuntimeConfig {
  resend?: {
    api_key?: string;
    sender?: string;
  };
  app?: {
    url?: string;
  };
  hosting?: {
    url?: string;
  };
}

const ONE_TIME_WARNINGS = new Set<string>();
let cachedResendConfig: ResendConfig | null = null;
let cachedRuntimeConfig: RuntimeConfig | null = null;

const isEmulator =
  process.env.FUNCTIONS_EMULATOR === 'true' ||
  process.env.NODE_ENV === 'development';

function loadRuntimeConfig(): RuntimeConfig {
  if (cachedRuntimeConfig) {
    return cachedRuntimeConfig;
  }
  try {
    cachedRuntimeConfig = functions.config() as RuntimeConfig;
  } catch (error) {
    if (!ONE_TIME_WARNINGS.has('config')) {
      ONE_TIME_WARNINGS.add('config');
      logger.warn(
        'firebase functions:config not available. Run `firebase functions:config:set resend.api_key="..." resend.sender="..."` before deploying.'
      );
    }
    cachedRuntimeConfig = {};
  }
  return cachedRuntimeConfig!;
}

function resolveConfigValue<T>(
  localValue: Nullable<T>,
  configValue: Nullable<T>,
  fallback?: T
): T {
  if (localValue !== null && localValue !== undefined && `${localValue}`.length) {
    return localValue as T;
  }
  if (configValue !== null && configValue !== undefined && `${configValue}`.length) {
    return configValue as T;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error('CONFIG_VALUE_MISSING');
}

export function getResendConfig(): ResendConfig {
  if (cachedResendConfig) {
    return cachedResendConfig;
  }
  const runtimeConfig = loadRuntimeConfig();

  try {
    const apiKey = resolveConfigValue(
      process.env.RESEND_API_KEY,
      runtimeConfig?.resend?.api_key
    );
    const sender = resolveConfigValue(
      process.env.RESEND_SENDER,
      runtimeConfig?.resend?.sender
    );

    cachedResendConfig = { apiKey, sender };
    
    // Validate at cold start (first load)
    if (!apiKey || !sender) {
      const guidance = isEmulator
        ? '\n\n🔧 Local Development: Create functions/.env file with:\n  RESEND_API_KEY=re_xxx\n  RESEND_SENDER=noreply@wasillah.live'
        : '\n\n🔧 Production: Run `firebase functions:config:set resend.api_key="re_xxx" resend.sender="noreply@wasillah.live"`';
      
      logger.error(
        `Missing Resend configuration at cold start.${guidance}\n\nSee functions/.env.example for template.`
      );
      throw new Error('RESEND_CONFIG_MISSING: Required RESEND_API_KEY and RESEND_SENDER not configured');
    }
    
    logger.info('Resend config loaded successfully', {
      hasApiKey: !!apiKey,
      sender,
      source: isEmulator ? 'env' : 'functions.config()',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'CONFIG_VALUE_MISSING') {
      const guidance = isEmulator
        ? '\n\n🔧 Local Development: Create functions/.env file with:\n  RESEND_API_KEY=re_xxx\n  RESEND_SENDER=noreply@wasillah.live'
        : '\n\n🔧 Production: Run `firebase functions:config:set resend.api_key="re_xxx" resend.sender="noreply@wasillah.live"`';
      
      if (!ONE_TIME_WARNINGS.has('resend')) {
        ONE_TIME_WARNINGS.add('resend');
        logger.error(
          `Missing Resend configuration.${guidance}\n\nSee functions/.env.example for template.`
        );
      }
    }
    throw error;
  }

  return cachedResendConfig!;
}

export function getAppUrl(): string {
  const runtimeConfig = loadRuntimeConfig();
  return (
    process.env.APP_URL ||
    runtimeConfig?.app?.url ||
    'https://wasilah-new.web.app'
  );
}

export function getHostingUrl(): string | undefined {
  const runtimeConfig = loadRuntimeConfig();
  return (
    process.env.FIREBASE_HOSTING_URL ||
    runtimeConfig?.hosting?.url
  );
}

export function resetCachedConfig() {
  cachedResendConfig = null;
  cachedRuntimeConfig = null;
}

export const runtimeEnvironment = {
  isEmulator,
};
