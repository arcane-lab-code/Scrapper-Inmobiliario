import { ScraperEngine, EngineConfig } from './scraper.interface';

/**
 * Dummy engine for scrapers that don't need actual browser automation
 * Used by MockScraper and similar non-browser-based scrapers
 */
export class DummyEngine implements ScraperEngine {
  name = 'dummy';

  async initialize(config: EngineConfig): Promise<void> {
    // No initialization needed for dummy engine
    console.log('[DummyEngine] Initialized (no-op)');
  }

  async navigate(url: string): Promise<void> {
    // No navigation needed
    console.log('[DummyEngine] Navigate (no-op):', url);
  }

  async getPageContent(): Promise<string> {
    // Return empty content
    return '';
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    // No waiting needed
  }

  async click(selector: string): Promise<void> {
    // No clicking needed
  }

  async type(selector: string, text: string): Promise<void> {
    // No typing needed
  }

  async evaluate<T>(fn: string | ((...args: any[]) => T), ...args: any[]): Promise<T> {
    // No evaluation needed
    return undefined as T;
  }

  async screenshot(path: string): Promise<void> {
    // No screenshot needed
  }

  async close(): Promise<void> {
    // No cleanup needed
    console.log('[DummyEngine] Closed (no-op)');
  }
}
