import puppeteer, { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ScraperEngine, EngineConfig } from './scraper.interface';

const puppeteerExtra = require('puppeteer-extra');
puppeteerExtra.use(StealthPlugin());

/**
 * Puppeteer implementation of ScraperEngine
 */
export class PuppeteerEngine implements ScraperEngine {
  name = 'puppeteer';
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: EngineConfig | null = null;

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;

    const launchOptions: any = {
      headless: config.headless !== false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    };

    // Configure proxy if enabled
    if (config.proxy?.enabled && config.proxy.host && config.proxy.port) {
      launchOptions.args.push(
        `--proxy-server=${config.proxy.host}:${config.proxy.port}`
      );
    }

    this.browser = await puppeteerExtra.launch(launchOptions);
    this.page = await this.browser.newPage();

    // Set viewport
    if (config.viewport) {
      await this.page.setViewport(config.viewport);
    } else {
      await this.page.setViewport({ width: 1920, height: 1080 });
    }

    // Set user agent
    if (config.userAgent) {
      await this.page.setUserAgent(config.userAgent);
    }

    // Set timeout
    if (config.timeout) {
      this.page.setDefaultTimeout(config.timeout);
    }

    // Authenticate proxy if credentials provided
    if (
      config.proxy?.enabled &&
      config.proxy.username &&
      config.proxy.password
    ) {
      await this.page.authenticate({
        username: config.proxy.username,
        password: config.proxy.password,
      });
    }

    console.log(`[${this.name}] Engine initialized`);
  }

  async navigateTo(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    console.log(`[${this.name}] Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: this.config?.timeout || 30000,
    });
  }

  async extractData(selector: string): Promise<any> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    return await this.page.evaluate((sel) => {
      const elements = Array.from(document.querySelectorAll(sel));
      return elements.map((el) => el.textContent?.trim());
    }, selector);
  }

  async executeScript(script: string): Promise<any> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    return await this.page.evaluate(script);
  }

  async screenshot(path: string): Promise<void> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    await this.page.screenshot({ path, fullPage: true });
    console.log(`[${this.name}] Screenshot saved: ${path}`);
  }

  async getHTML(): Promise<string> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    return await this.page.content();
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    await this.page.waitForSelector(selector, { timeout: timeout || 30000 });
  }

  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    await this.page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    if (!this.page) {
      throw new Error('Engine not initialized');
    }

    await this.page.type(selector, text);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log(`[${this.name}] Engine closed`);
    }
  }

  /**
   * Get current page instance (for advanced usage)
   */
  getPage(): Page | null {
    return this.page;
  }
}
