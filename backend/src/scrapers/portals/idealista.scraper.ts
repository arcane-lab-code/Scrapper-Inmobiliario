import { ScraperEngine } from '../engines/scraper.interface';
import {
  PortalScraper,
  SearchFilters,
  PropertyListing,
  PropertyDetails,
  ContactInfo,
} from './portal.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Scraper for Idealista.com
 */
export class IdealistaScraper implements PortalScraper {
  name = 'idealista';
  baseUrl = 'https://www.idealista.com';

  buildSearchUrl(filters: SearchFilters): string {
    const { searchType, location, zone } = filters;

    // Base path: /alquiler-viviendas/ or /venta-viviendas/
    const action = searchType === 'rent' ? 'alquiler' : 'venta';
    let url = `${this.baseUrl}/${action}-viviendas/`;

    // Add location
    if (location) {
      url += `${location}/`;
    }

    // Add zone if specified
    if (zone) {
      url += `con-${zone.replace(/\s+/g, '-')}/`;
    }

    // Build query parameters
    const params: string[] = [];

    if (filters.priceMin) {
      params.push(`precioDesde=${filters.priceMin}`);
    }

    if (filters.priceMax) {
      params.push(`precioHasta=${filters.priceMax}`);
    }

    if (filters.rooms && filters.rooms.length > 0) {
      params.push(`habitaciones=${filters.rooms.join(',')}`);
    }

    if (filters.bathrooms) {
      params.push(`banos=${filters.bathrooms}`);
    }

    if (filters.propertyType) {
      const typeMap: { [key: string]: string } = {
        piso: 'pisos',
        casa: 'casas',
        chalet: 'chalets',
        atico: 'aticos',
        duplex: 'duplex',
        estudio: 'estudios',
      };
      params.push(`tipoInmueble=${typeMap[filters.propertyType] || 'pisos'}`);
    }

    if (filters.onlyWithPhotos) {
      params.push('conFotos=true');
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return url;
  }

  async scrapeListings(
    engine: ScraperEngine,
    filters: SearchFilters
  ): Promise<PropertyListing[]> {
    const url = this.buildSearchUrl(filters);
    console.log(`[${this.name}] Scraping: ${url}`);

    await engine.navigateTo(url);

    // Wait for listings to load
    try {
      await engine.waitForSelector('article.item', 10000);
    } catch (error) {
      console.warn(`[${this.name}] No listings found or timeout`);
      return [];
    }

    // Extract listings data
    const listings = await this.extractListingsFromPage(engine);

    // Scrape pagination if exists
    const hasNextPage = await this.hasNextPage(engine);
    if (hasNextPage) {
      // For now, we'll just scrape the first page
      // In production, implement pagination logic
      console.log(`[${this.name}] More pages available (not implemented yet)`);
    }

    console.log(`[${this.name}] Found ${listings.length} listings`);
    return listings;
  }

  private async extractListingsFromPage(
    engine: ScraperEngine
  ): Promise<PropertyListing[]> {
    const html = await engine.getHTML();

    // Use page.evaluate to extract data in browser context
    const page = (engine as any).getPage?.();
    if (!page) {
      throw new Error('Cannot get page from engine');
    }

    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('article.item'));

      return items.map((item) => {
        // Extract basic info
        const titleEl = item.querySelector('.item-link');
        const priceEl = item.querySelector('.item-price');
        const detailsEl = item.querySelector('.item-detail');
        const addressEl = item.querySelector('.item-link');

        // Extract URL and ID
        const url = titleEl?.getAttribute('href') || '';
        const id = url.split('/').pop()?.split('.')[0] || '';

        // Extract price
        const priceText = priceEl?.textContent?.trim() || '';
        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;

        // Extract details (rooms, size, etc.)
        const detailsText = detailsEl?.textContent?.trim() || '';
        const detailsParts = detailsText.split('·').map((s) => s.trim());

        let rooms = 0;
        let size = 0;
        let bathrooms = 0;

        detailsParts.forEach((part) => {
          if (part.includes('hab')) {
            rooms = parseInt(part) || 0;
          } else if (part.includes('m²')) {
            size = parseInt(part) || 0;
          } else if (part.includes('baño')) {
            bathrooms = parseInt(part) || 0;
          }
        });

        // Extract image
        const imgEl = item.querySelector('img');
        const images = imgEl?.getAttribute('src')
          ? [imgEl.getAttribute('src')!]
          : [];

        // Extract address
        const address = addressEl?.textContent?.trim() || '';

        return {
          id,
          url: url.startsWith('http') ? url : `https://www.idealista.com${url}`,
          title: titleEl?.textContent?.trim() || '',
          price,
          currency: 'EUR',
          address,
          rooms,
          bathrooms,
          size,
          images,
          isAgency: false, // Will be determined later
        };
      });
    });

    return listings.map((listing) => ({
      ...listing,
      portal: this.name,
      scrapedAt: new Date(),
    }));
  }

  async scrapeListingDetails(
    engine: ScraperEngine,
    url: string
  ): Promise<PropertyDetails> {
    console.log(`[${this.name}] Scraping details: ${url}`);

    await engine.navigateTo(url);

    // Wait for content
    try {
      await engine.waitForSelector('.details-property', 10000);
    } catch (error) {
      console.warn(`[${this.name}] Details not found`);
    }

    const page = (engine as any).getPage?.();
    if (!page) {
      throw new Error('Cannot get page from engine');
    }

    const details = await page.evaluate((portalName: string) => {
      // Extract detailed information
      const result: any = {
        portal: portalName,
        url: window.location.href,
        scrapedAt: new Date().toISOString(),
      };

      // Title
      const titleEl = document.querySelector('h1.main-info__title-main');
      result.title = titleEl?.textContent?.trim() || '';

      // Price
      const priceEl = document.querySelector('.info-data-price');
      const priceText = priceEl?.textContent?.trim() || '';
      result.price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
      result.currency = 'EUR';

      // Address
      const addressEl = document.querySelector('.main-info__title-minor');
      result.address = addressEl?.textContent?.trim() || '';

      // Description
      const descEl = document.querySelector('.comment');
      result.description = descEl?.textContent?.trim() || '';
      result.fullDescription = result.description;

      // Details
      const detailsItems = Array.from(
        document.querySelectorAll('.details-property_features li')
      );

      detailsItems.forEach((item) => {
        const text = item.textContent?.toLowerCase() || '';

        if (text.includes('habitacion')) {
          result.rooms = parseInt(text) || 0;
        } else if (text.includes('baño')) {
          result.bathrooms = parseInt(text) || 0;
        } else if (text.includes('m²')) {
          result.size = parseInt(text) || 0;
        } else if (text.includes('planta')) {
          result.floor = text;
        } else if (text.includes('ascensor')) {
          result.hasElevator = true;
        }
      });

      // Features
      const featuresEls = Array.from(
        document.querySelectorAll('.details-property_features li')
      );
      result.features = featuresEls.map((el) => el.textContent?.trim() || '');

      // Images
      const imageEls = Array.from(
        document.querySelectorAll('.detail-image img')
      );
      result.images = imageEls
        .map((img) => img.getAttribute('src'))
        .filter(Boolean);

      // Stats
      const statsEl = document.querySelector('.stats-data');
      if (statsEl) {
        result.stats = {
          views: 0,
          favorites: 0,
          contacts: 0,
        };
      }

      // Agency info
      const agencyEl = document.querySelector('.about-advertiser');
      result.isAgency = !!agencyEl;

      // Reference
      const refEl = document.querySelector('.txt-ref');
      result.reference = refEl?.textContent?.trim() || '';

      return result;
    }, this.name);

    return {
      ...details,
      id: uuidv4(),
      scrapedAt: new Date(),
    } as PropertyDetails;
  }

  async extractContactInfo(
    engine: ScraperEngine,
    url: string
  ): Promise<ContactInfo> {
    await engine.navigateTo(url);

    try {
      await engine.waitForSelector('.about-advertiser', 5000);
    } catch (error) {
      console.warn(`[${this.name}] Contact info not found`);
      return { isAgency: false };
    }

    const page = (engine as any).getPage?.();
    if (!page) {
      throw new Error('Cannot get page from engine');
    }

    const contactInfo = await page.evaluate(() => {
      const result: any = { isAgency: false };

      // Agency name
      const agencyEl = document.querySelector('.advertiser-name');
      result.companyName = agencyEl?.textContent?.trim() || '';
      result.isAgency = !!result.companyName;

      // Phone - usually requires clicking to reveal
      const phoneEl = document.querySelector('.phone-btn');
      result.phone = phoneEl?.textContent?.trim() || '';

      // Email - might not be directly visible
      // Would need additional interaction

      return result;
    });

    return contactInfo;
  }

  private async hasNextPage(engine: ScraperEngine): Promise<boolean> {
    const page = (engine as any).getPage?.();
    if (!page) return false;

    return await page.evaluate(() => {
      const nextBtn = document.querySelector('.next');
      return !!nextBtn && !nextBtn.classList.contains('disabled');
    });
  }
}
