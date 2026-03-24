import fs from 'fs';
import path from 'path';

// Israel Ministry of Transport API Configuration
// This file manages the data.gov.il CKAN API settings
// The resource ID can change when the government updates their datasets

const CONFIG_PATH = path.join(process.cwd(), 'mot-api-config.json');

interface MotApiConfig {
  resourceId: string;
  apiUrl: string;
  lastCheck: string | null;
  lastCheckStatus: 'ok' | 'error' | null;
  lastCheckMessage: string | null;
  alternativeResourceIds: string[];
}

const DEFAULT_CONFIG: MotApiConfig = {
  resourceId: '053cea08-09bc-40ec-8f7a-156f0677aff3',
  apiUrl: 'https://data.gov.il/api/3/action/datastore_search',
  lastCheck: null,
  lastCheckStatus: null,
  lastCheckMessage: null,
  // Known alternative resource IDs that have been used in the past
  alternativeResourceIds: [
    '053cea08-09bc-40ec-8f7a-156f0677aff3', // Primary - private & commercial vehicles
    'cd3acc5c-03c3-4c89-9c54-d40f93c0d790', // Alternative dataset
    '851ecab1-0622-4dbe-a6c7-f950cf82abf9', // Older version
  ],
};

export function getMotConfig(): MotApiConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    console.warn('Failed to read MOT config, using defaults');
  }
  return DEFAULT_CONFIG;
}

export function saveMotConfig(config: Partial<MotApiConfig>): void {
  try {
    const current = getMotConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save MOT config:', err);
  }
}

export function getResourceId(): string {
  return getMotConfig().resourceId;
}

export function getApiUrl(): string {
  return getMotConfig().apiUrl;
}
