import { ScraperEngine, EngineConfig } from './engines/scraper.interface';
// NOTE: PuppeteerEngine disabled - not needed for MockScraper
// import { PuppeteerEngine } from './engines/puppeteer.engine';
import { DummyEngine } from './engines/dummy.engine';
import {
  PortalScraper,
  SearchFilters,
  ScrapingResult,
  PropertyListing,
} from './portals/portal.interface';
import { IdealistaScraper } from './portals/idealista.scraper';
import { MockScraper } from './portals/mock.scraper';
import { TecnocasaScraper } from './portals/tecnocasa.scraper';

/**
 * Central hub for managing scraping operations
 * Provides abstraction layer between engines and portals
 */
export class ScrapingHub {
  private engines: Map<string, new () => ScraperEngine> = new Map();
  private portals: Map<string, PortalScraper> = new Map();

  constructor() {
    // Register available engines
    // Using DummyEngine as default for MockScraper (no browser needed)
    this.registerEngine('dummy', DummyEngine);
    this.registerEngine('puppeteer', DummyEngine); // Alias for backwards compatibility

    // Register available portals
    // NOTE: Using mock scraper by default for testing without real scraping
    this.registerPortal('mock', new MockScraper());
    this.registerPortal('tecnocasa', new TecnocasaScraper());

    // Real scrapers (disabled for now)
    // this.registerPortal('idealista', new IdealistaScraper());

    console.log('[ScrapingHub] Initialized with engines and portals');
  }

  /**
   * Register a new scraping engine
   */
  registerEngine(name: string, engineClass: new () => ScraperEngine): void {
    this.engines.set(name, engineClass);
    console.log(`[ScrapingHub] Registered engine: ${name}`);
  }

  /**
   * Register a new portal scraper
   */
  registerPortal(name: string, scraper: PortalScraper): void {
    this.portals.set(name, scraper);
    console.log(`[ScrapingHub] Registered portal: ${name}`);
  }

  /**
   * Get list of available engines
   */
  getAvailableEngines(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Get list of available portals
   */
  getAvailablePortals(): string[] {
    return Array.from(this.portals.keys());
  }

  /**
   * Execute a scraping job
   */
  async scrape(config: ScrapingJobConfig): Promise<ScrapingResult> {
    const startTime = Date.now();
    console.log('[ScrapingHub] Starting scraping job:', config.portal);

    // Get engine
    const EngineClass = this.engines.get(config.engineName || 'puppeteer');
    if (!EngineClass) {
      throw new Error(`Engine not found: ${config.engineName}`);
    }

    // Get portal scraper
    const portal = this.portals.get(config.portal);
    if (!portal) {
      throw new Error(`Portal not found: ${config.portal}`);
    }

    const engine = new EngineClass();
    const listings: PropertyListing[] = [];
    const errors: string[] = [];

    try {
      // Initialize engine with config
      await engine.initialize(config.engineConfig);

      // Scrape listings
      const scrapedListings = await portal.scrapeListings(
        engine,
        config.filters
      );
      listings.push(...scrapedListings);

      // Optionally scrape details for each listing
      if (config.scrapeDetails) {
        console.log(
          `[ScrapingHub] Scraping details for ${listings.length} listings...`
        );

        for (const listing of listings) {
          try {
            const details = await portal.scrapeListingDetails(
              engine,
              listing.url
            );
            Object.assign(listing, details);

            // Rate limiting - wait between requests
            if (config.rateLimitMs) {
              await this.sleep(config.rateLimitMs);
            }
          } catch (error) {
            const errMsg = `Failed to scrape details for ${listing.url}: ${error}`;
            console.error(`[ScrapingHub] ${errMsg}`);
            errors.push(errMsg);
          }
        }
      }

      // Optionally scrape contact info
      if (config.scrapeContactInfo) {
        console.log(
          `[ScrapingHub] Scraping contact info for ${listings.length} listings...`
        );

        for (const listing of listings) {
          try {
            const contactInfo = await portal.extractContactInfo(
              engine,
              listing.url
            );

            // Store contact info in listing
            (listing as any).contactInfo = contactInfo;

            if (config.rateLimitMs) {
              await this.sleep(config.rateLimitMs);
            }
          } catch (error) {
            const errMsg = `Failed to scrape contact for ${listing.url}: ${error}`;
            console.error(`[ScrapingHub] ${errMsg}`);
            errors.push(errMsg);
          }
        }
      }
    } catch (error) {
      const errMsg = `Scraping failed: ${error}`;
      console.error(`[ScrapingHub] ${errMsg}`);
      errors.push(errMsg);

      return {
        success: false,
        listings: [],
        errors,
        scrapedCount: 0,
        timestamp: new Date(),
      };
    } finally {
      // Always close the engine
      await engine.close();
    }

    const duration = Date.now() - startTime;
    console.log(
      `[ScrapingHub] Job completed in ${duration}ms. Found ${listings.length} listings`
    );

    return {
      success: errors.length === 0 || listings.length > 0,
      listings,
      errors: errors.length > 0 ? errors : undefined,
      totalFound: listings.length,
      scrapedCount: listings.length,
      timestamp: new Date(),
    };
  }

  /**
   * Build search URL for a portal (useful for testing)
   */
  buildSearchUrl(portal: string, filters: SearchFilters): string {
    const portalScraper = this.portals.get(portal);
    if (!portalScraper) {
      throw new Error(`Portal not found: ${portal}`);
    }

    return portalScraper.buildSearchUrl(filters);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export interface ScrapingJobConfig {
  portal: string;
  filters: SearchFilters;
  engineName?: string;
  engineConfig: EngineConfig;
  scrapeDetails?: boolean;
  scrapeContactInfo?: boolean;
  rateLimitMs?: number; // Delay between requests in milliseconds
}

// Export singleton instance
export const scrapingHub = new ScrapingHub();
