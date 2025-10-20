import { SearchFilters } from '../scrapers/portals/portal.interface';

/**
 * Search configuration model
 */
export interface SearchConfig {
  id: string;
  name: string;
  portal: string;
  searchType: 'rent' | 'sale';
  filters: SearchFilters;
  scraper: ScraperConfig;
  schedule: ScheduleConfig;
  output: OutputConfig;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  enabled: boolean;
}

export interface ScraperConfig {
  engine: string; // 'puppeteer', 'playwright', etc.
  useProxy: boolean;
  headless: boolean;
  scrapeDetails?: boolean;
  scrapeContactInfo?: boolean;
  rateLimitMs?: number;
}

export interface ScheduleConfig {
  enabled: boolean;
  cron?: string; // Cron expression: '0 9 * * *' = daily at 9am
  timezone?: string;
}

export interface OutputConfig {
  googleSheetsUrl?: string;
  notifyEmail?: string;
  webhook?: string;
}

/**
 * Default configuration template
 */
export const defaultSearchConfig: Partial<SearchConfig> = {
  searchType: 'rent',
  filters: {
    searchType: 'rent',
    location: 'madrid-ciudad',
  },
  scraper: {
    engine: 'puppeteer',
    useProxy: false,
    headless: true,
    scrapeDetails: false,
    scrapeContactInfo: false,
    rateLimitMs: 2000,
  },
  schedule: {
    enabled: false,
  },
  output: {},
  enabled: true,
};
