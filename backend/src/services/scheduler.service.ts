import cron from 'node-cron';
import { scrapingHub } from '../scrapers/hub';
import { googleSheetsService } from './google-sheets.service';
import { deduplicationService } from './deduplication.service';
import { proxyService } from './proxy.service';
import { SearchConfig } from '../models/search-config.model';

/**
 * Service for scheduling and managing scraping jobs
 */
export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private activeSearches: Map<string, SearchConfig> = new Map();

  constructor() {
    console.log('[Scheduler] Service initialized');
  }

  /**
   * Schedule a new search job
   */
  scheduleSearch(searchConfig: SearchConfig): void {
    if (!searchConfig.schedule.enabled || !searchConfig.schedule.cron) {
      console.log(`[Scheduler] Search "${searchConfig.name}" not scheduled (disabled or no cron)`);
      return;
    }

    // If already scheduled, remove first
    if (this.jobs.has(searchConfig.id)) {
      this.unscheduleSearch(searchConfig.id);
    }

    const task = cron.schedule(searchConfig.schedule.cron, async () => {
      console.log(`[Scheduler] Executing scheduled search: ${searchConfig.name}`);
      await this.executeSearch(searchConfig);
    });

    this.jobs.set(searchConfig.id, task);
    this.activeSearches.set(searchConfig.id, searchConfig);

    console.log(
      `[Scheduler] Scheduled "${searchConfig.name}" with cron: ${searchConfig.schedule.cron}`
    );
  }

  /**
   * Unschedule a search job
   */
  unscheduleSearch(searchId: string): void {
    const task = this.jobs.get(searchId);

    if (task) {
      task.stop();
      this.jobs.delete(searchId);
      this.activeSearches.delete(searchId);
      console.log(`[Scheduler] Unscheduled search: ${searchId}`);
    }
  }

  /**
   * Execute a search manually
   */
  async executeSearch(searchConfig: SearchConfig): Promise<void> {
    try {
      console.log(`[Scheduler] Starting search: ${searchConfig.name}`);

      // Get proxy config if enabled
      const proxyConfig = searchConfig.scraper.useProxy
        ? proxyService.getProxyConfig(true)
        : { enabled: false };

      // Prepare scraping job
      const jobConfig = {
        portal: searchConfig.portal,
        filters: searchConfig.filters,
        engineName: searchConfig.scraper.engine || 'puppeteer',
        engineConfig: {
          headless: searchConfig.scraper.headless !== false,
          proxy: proxyConfig,
          timeout: 30000,
        },
        scrapeDetails: searchConfig.scraper.scrapeDetails || false,
        scrapeContactInfo: searchConfig.scraper.scrapeContactInfo || false,
        rateLimitMs: searchConfig.scraper.rateLimitMs || 2000,
      };

      // Execute scraping
      const result = await scrapingHub.scrape(jobConfig);

      if (!result.success) {
        console.error(`[Scheduler] Search failed: ${searchConfig.name}`, result.errors);
        return;
      }

      console.log(`[Scheduler] Found ${result.listings.length} listings`);

      // Filter duplicates
      const { unique, duplicates } = deduplicationService.filterDuplicates(
        result.listings
      );

      console.log(
        `[Scheduler] ${unique.length} new listings, ${duplicates.length} duplicates skipped`
      );

      if (unique.length === 0) {
        console.log(`[Scheduler] No new listings to save`);
        return;
      }

      // Save to Google Sheets
      if (searchConfig.output.googleSheetsUrl) {
        const spreadsheetId = extractSpreadsheetId(
          searchConfig.output.googleSheetsUrl
        );

        if (spreadsheetId) {
          await googleSheetsService.appendListings(spreadsheetId, unique);
          console.log(
            `[Scheduler] Saved ${unique.length} listings to Google Sheets`
          );
        }
      }

      // Mark as scraped in deduplication DB
      deduplicationService.markAsScraped(unique);

      console.log(`[Scheduler] Search completed: ${searchConfig.name}`);
    } catch (error) {
      console.error(`[Scheduler] Error executing search:`, error);
    }
  }

  /**
   * Pause a scheduled job
   */
  pauseSearch(searchId: string): void {
    const task = this.jobs.get(searchId);

    if (task) {
      task.stop();
      console.log(`[Scheduler] Paused search: ${searchId}`);
    }
  }

  /**
   * Resume a paused job
   */
  resumeSearch(searchId: string): void {
    const task = this.jobs.get(searchId);
    const config = this.activeSearches.get(searchId);

    if (task && config) {
      task.start();
      console.log(`[Scheduler] Resumed search: ${searchId}`);
    }
  }

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): Array<{
    id: string;
    name: string;
    cron: string;
    portal: string;
    active: boolean;
  }> {
    const jobs: Array<any> = [];

    for (const [id, config] of this.activeSearches) {
      jobs.push({
        id,
        name: config.name,
        cron: config.schedule.cron || '',
        portal: config.portal,
        active: true, // TODO: track if paused
      });
    }

    return jobs;
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    for (const [id, task] of this.jobs) {
      task.stop();
      console.log(`[Scheduler] Stopped job: ${id}`);
    }

    this.jobs.clear();
    this.activeSearches.clear();
  }
}

/**
 * Extract spreadsheet ID from URL
 */
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Export singleton
export const schedulerService = new SchedulerService();
