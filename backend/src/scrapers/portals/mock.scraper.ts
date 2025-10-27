import { ScraperEngine } from '../engines/scraper.interface';
import {
  PortalScraper,
  SearchFilters,
  PropertyListing,
  PropertyDetails,
  ContactInfo,
} from './portal.interface';

/**
 * Mock scraper for testing without real scraping
 * Returns sample data for development and testing
 */
export class MockScraper implements PortalScraper {
  name = 'mock';
  baseUrl = 'https://example.com';

  buildSearchUrl(filters: SearchFilters): string {
    const { searchType, location, priceMin, priceMax } = filters;
    return `${this.baseUrl}/${searchType}/${location}?min=${priceMin}&max=${priceMax}`;
  }

  async scrapeListings(
    engine: ScraperEngine,
    filters: SearchFilters
  ): Promise<PropertyListing[]> {
    console.log('[MockScraper] Generating sample listings...');
    await this.sleep(500);

    const mockListings: PropertyListing[] = [
      {
        id: 'mock-001',
        url: 'https://example.com/property/001',
        portal: 'mock',
        title: 'Precioso piso en el centro de Madrid',
        price: 1200,
        currency: 'EUR',
        address: 'Calle Gran Vía, 45',
        district: 'Centro',
        neighborhood: 'Sol',
        rooms: 3,
        bathrooms: 2,
        size: 85,
        floor: '3º',
        hasElevator: true,
        condition: 'Buen estado',
        energyRating: 'D',
        description: 'Amplio piso completamente reformado en pleno centro de Madrid',
        features: ['Ascensor', 'Aire acondicionado', 'Calefacción', 'Armarios empotrados'],
        images: ['https://via.placeholder.com/400x300/3498db/ffffff?text=Salon'],
        publishedDate: new Date('2024-01-15'),
        updatedDate: new Date(),
        stats: { views: 245, favorites: 12, contacts: 8 },
        isAgency: true,
        scrapedAt: new Date(),
      },
      {
        id: 'mock-002',
        url: 'https://example.com/property/002',
        portal: 'mock',
        title: 'Moderno apartamento con terraza',
        price: 950,
        currency: 'EUR',
        address: 'Calle de Fuencarral, 120',
        district: 'Chamberí',
        neighborhood: 'Trafalgar',
        rooms: 2,
        bathrooms: 1,
        size: 65,
        floor: '5º',
        hasElevator: true,
        condition: 'A estrenar',
        energyRating: 'B',
        description: 'Apartamento de nueva construcción con acabados de primera calidad',
        features: ['Ascensor', 'Aire acondicionado', 'Terraza'],
        images: ['https://via.placeholder.com/400x300/2ecc71/ffffff?text=Apartamento'],
        publishedDate: new Date('2024-01-20'),
        updatedDate: new Date(),
        stats: { views: 189, favorites: 15, contacts: 11 },
        isAgency: true,
        scrapedAt: new Date(),
      },
      {
        id: 'mock-003',
        url: 'https://example.com/property/003',
        portal: 'mock',
        title: 'Acogedor estudio en Malasaña',
        price: 750,
        currency: 'EUR',
        address: 'Calle del Pez, 8',
        district: 'Centro',
        neighborhood: 'Malasaña',
        rooms: 1,
        bathrooms: 1,
        size: 40,
        floor: '2º',
        hasElevator: false,
        condition: 'Reformado',
        energyRating: 'E',
        description: 'Estudio totalmente reformado en el corazón de Malasaña',
        features: ['Calefacción', 'Exterior', 'Luminoso'],
        images: ['https://via.placeholder.com/400x300/e74c3c/ffffff?text=Estudio'],
        publishedDate: new Date('2024-01-10'),
        updatedDate: new Date(),
        stats: { views: 312, favorites: 23, contacts: 18 },
        isAgency: false,
        scrapedAt: new Date(),
      },
    ];

    let filtered = mockListings;
    if (filters.priceMin) {
      filtered = filtered.filter(l => l.price >= filters.priceMin!);
    }
    if (filters.priceMax) {
      filtered = filtered.filter(l => l.price <= filters.priceMax!);
    }
    if (filters.rooms && filters.rooms.length > 0) {
      filtered = filtered.filter(l => l.rooms && filters.rooms!.includes(l.rooms));
    }

    console.log(`[MockScraper] Returning ${filtered.length} mock listings`);
    return filtered;
  }

  async scrapeListingDetails(
    engine: ScraperEngine,
    url: string
  ): Promise<PropertyDetails> {
    console.log('[MockScraper] Generating sample details...');
    await this.sleep(300);

    return {
      id: 'mock-detail',
      url,
      portal: 'mock',
      title: 'Property with full details',
      price: 1200,
      currency: 'EUR',
      rooms: 3,
      bathrooms: 2,
      size: 85,
      isAgency: true,
      scrapedAt: new Date(),
      fullDescription: 'Descripción completa de la propiedad con todos los detalles',
      reference: 'REF-MOCK-001',
      builtYear: 2010,
      orientation: 'Sur',
      heatingType: 'Individual',
      hasAirConditioning: true,
      hasParking: false,
      hasSwimmingPool: false,
      hasTerrace: true,
      hasGarden: false,
      hasStorageRoom: true,
    };
  }

  async extractContactInfo(
    engine: ScraperEngine,
    url: string
  ): Promise<ContactInfo> {
    console.log('[MockScraper] Generating sample contact info...');
    await this.sleep(200);

    return {
      name: 'Juan García',
      phone: '+34 600 123 456',
      email: 'contacto@example.com',
      companyName: 'Inmobiliaria Ejemplo',
      isAgency: true,
      agencyUrl: 'https://example.com/agency',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
