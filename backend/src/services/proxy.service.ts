import { ProxyConfig } from '../scrapers/engines/scraper.interface';

/**
 * Service for managing proxy rotation and IP hiding
 */
export class ProxyService {
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;
  private useProxy = false;

  constructor() {
    this.loadProxies();
  }

  /**
   * Load proxies from configuration or environment
   */
  private loadProxies(): void {
    // Load from environment variable
    const proxyList = process.env.PROXY_LIST;

    if (proxyList) {
      try {
        const proxies = JSON.parse(proxyList);
        this.proxies = proxies;
        console.log(`[ProxyService] Loaded ${this.proxies.length} proxies`);
      } catch (error) {
        console.error('[ProxyService] Failed to parse proxy list:', error);
      }
    }

    // If no proxies loaded, use default free proxies (not recommended for production)
    if (this.proxies.length === 0) {
      console.warn(
        '[ProxyService] No proxies configured. Using direct connection.'
      );
    }
  }

  /**
   * Add a proxy to the pool
   */
  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
    console.log(`[ProxyService] Added proxy: ${proxy.host}:${proxy.port}`);
  }

  /**
   * Get next proxy in rotation
   */
  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

    console.log(`[ProxyService] Using proxy: ${proxy.host}:${proxy.port}`);
    return proxy;
  }

  /**
   * Get random proxy
   */
  getRandomProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * this.proxies.length);
    const proxy = this.proxies[index];

    console.log(`[ProxyService] Using random proxy: ${proxy.host}:${proxy.port}`);
    return proxy;
  }

  /**
   * Get proxy configuration for scraper
   */
  getProxyConfig(useProxy: boolean = true): ProxyConfig {
    if (!useProxy || this.proxies.length === 0) {
      return {
        enabled: false,
      };
    }

    const proxy = this.getNextProxy();

    if (!proxy) {
      return {
        enabled: false,
      };
    }

    return {
      enabled: true,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
    };
  }

  /**
   * Check if proxy is available (ping test)
   */
  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    // TODO: Implement proxy testing
    // For now, assume all proxies work
    return true;
  }

  /**
   * Remove non-working proxies
   */
  async cleanupProxies(): Promise<void> {
    console.log('[ProxyService] Testing proxies...');

    const workingProxies: ProxyConfig[] = [];

    for (const proxy of this.proxies) {
      const isWorking = await this.testProxy(proxy);

      if (isWorking) {
        workingProxies.push(proxy);
      } else {
        console.log(`[ProxyService] Removed non-working proxy: ${proxy.host}`);
      }
    }

    this.proxies = workingProxies;
    console.log(`[ProxyService] ${this.proxies.length} working proxies remaining`);
  }

  /**
   * Get count of available proxies
   */
  getProxyCount(): number {
    return this.proxies.length;
  }

  /**
   * Enable/disable proxy usage
   */
  setUseProxy(use: boolean): void {
    this.useProxy = use;
    console.log(`[ProxyService] Proxy usage ${use ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton
export const proxyService = new ProxyService();
