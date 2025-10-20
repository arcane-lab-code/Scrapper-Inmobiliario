import { ScraperEngine } from '../engines/scraper.interface';

/**
 * Interface for real estate portals
 */
export interface PortalScraper {
  name: string;
  baseUrl: string;

  /**
   * Build search URL based on filters
   */
  buildSearchUrl(filters: SearchFilters): string;

  /**
   * Scrape listings from search results
   */
  scrapeListings(
    engine: ScraperEngine,
    filters: SearchFilters
  ): Promise<PropertyListing[]>;

  /**
   * Scrape detailed information from a single listing
   */
  scrapeListingDetails(
    engine: ScraperEngine,
    url: string
  ): Promise<PropertyDetails>;

  /**
   * Extract contact information
   */
  extractContactInfo(
    engine: ScraperEngine,
    url: string
  ): Promise<ContactInfo>;
}

export interface SearchFilters {
  searchType: 'rent' | 'sale';
  location: string;
  zone?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number[];
  bathrooms?: number;
  propertyType?: 'piso' | 'casa' | 'chalet' | 'atico' | 'duplex' | 'estudio';
  features?: string[];
  onlyWithPhotos?: boolean;
  onlyNewDevelopment?: boolean;
  excludeSharedOwnership?: boolean;
}

export interface PropertyListing {
  id: string;
  url: string;
  portal: string;
  title: string;
  price: number;
  currency: string;
  address?: string;
  district?: string;
  neighborhood?: string;
  rooms?: number;
  bathrooms?: number;
  size?: number; // m2
  floor?: string;
  hasElevator?: boolean;
  condition?: string;
  energyRating?: string;
  description?: string;
  features?: string[];
  images?: string[];
  publishedDate?: Date;
  updatedDate?: Date;
  stats?: {
    views?: number;
    favorites?: number;
    contacts?: number;
  };
  isAgency: boolean;
  scrapedAt: Date;
}

export interface PropertyDetails extends PropertyListing {
  fullDescription?: string;
  virtualTourUrl?: string;
  reference?: string;
  builtYear?: number;
  cadastralReference?: string;
  orientation?: string;
  heatingType?: string;
  hasAirConditioning?: boolean;
  hasParking?: boolean;
  hasSwimmingPool?: boolean;
  hasTerrace?: boolean;
  hasGarden?: boolean;
  hasStorageRoom?: boolean;
  accessibility?: string[];
  nearbyServices?: string[];
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  isAgency: boolean;
  agencyUrl?: string;
}

export interface ScrapingResult {
  success: boolean;
  listings: PropertyListing[];
  errors?: string[];
  totalFound?: number;
  scrapedCount: number;
  duplicatesSkipped?: number;
  timestamp: Date;
}
