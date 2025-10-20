/**
 * Interface for scraping engines (Puppeteer, Playwright, etc.)
 */
export interface ScraperEngine {
  name: string;

  /**
   * Initialize the scraper engine
   */
  initialize(config: EngineConfig): Promise<void>;

  /**
   * Navigate to URL
   */
  navigateTo(url: string): Promise<void>;

  /**
   * Extract data from current page
   */
  extractData(selector: string): Promise<any>;

  /**
   * Execute custom script in page context
   */
  executeScript(script: string): Promise<any>;

  /**
   * Take screenshot
   */
  screenshot(path: string): Promise<void>;

  /**
   * Get page HTML
   */
  getHTML(): Promise<string>;

  /**
   * Close browser/engine
   */
  close(): Promise<void>;

  /**
   * Wait for selector
   */
  waitForSelector(selector: string, timeout?: number): Promise<void>;

  /**
   * Click element
   */
  click(selector: string): Promise<void>;

  /**
   * Type text
   */
  type(selector: string, text: string): Promise<void>;
}

export interface EngineConfig {
  headless?: boolean;
  proxy?: ProxyConfig;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  timeout?: number;
}

export interface ProxyConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}
