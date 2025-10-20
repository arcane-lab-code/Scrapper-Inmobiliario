import Database from 'better-sqlite3';
import { PropertyListing } from '../scrapers/portals/portal.interface';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Service for detecting and preventing duplicate scraping
 */
export class DeduplicationService {
  private db: Database.Database;

  constructor(dbPath: string = './data/deduplication.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
    console.log('[Deduplication] Service initialized');
  }

  /**
   * Initialize database tables
   */
  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scraped_listings (
        id TEXT PRIMARY KEY,
        portal TEXT NOT NULL,
        url TEXT NOT NULL,
        url_hash TEXT NOT NULL,
        address TEXT,
        price REAL,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        scrape_count INTEGER DEFAULT 1,
        UNIQUE(url_hash)
      );

      CREATE INDEX IF NOT EXISTS idx_portal ON scraped_listings(portal);
      CREATE INDEX IF NOT EXISTS idx_url_hash ON scraped_listings(url_hash);
      CREATE INDEX IF NOT EXISTS idx_last_seen ON scraped_listings(last_seen);
    `);
  }

  /**
   * Generate hash for URL (for efficient lookup)
   */
  private hashUrl(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  /**
   * Check if a listing has been scraped before
   */
  isDuplicate(listing: PropertyListing): boolean {
    const urlHash = this.hashUrl(listing.url);

    const stmt = this.db.prepare(`
      SELECT id FROM scraped_listings WHERE url_hash = ?
    `);

    const result = stmt.get(urlHash);
    return !!result;
  }

  /**
   * Filter out duplicate listings from array
   */
  filterDuplicates(listings: PropertyListing[]): {
    unique: PropertyListing[];
    duplicates: PropertyListing[];
  } {
    const unique: PropertyListing[] = [];
    const duplicates: PropertyListing[] = [];

    for (const listing of listings) {
      if (this.isDuplicate(listing)) {
        duplicates.push(listing);
        this.updateLastSeen(listing);
      } else {
        unique.push(listing);
      }
    }

    console.log(
      `[Deduplication] Found ${unique.length} unique, ${duplicates.length} duplicate listings`
    );

    return { unique, duplicates };
  }

  /**
   * Mark listings as scraped
   */
  markAsScraped(listings: PropertyListing[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO scraped_listings (id, portal, url, url_hash, address, price)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(url_hash) DO UPDATE SET
        last_seen = CURRENT_TIMESTAMP,
        scrape_count = scrape_count + 1
    `);

    const insertMany = this.db.transaction((listings: PropertyListing[]) => {
      for (const listing of listings) {
        const urlHash = this.hashUrl(listing.url);
        stmt.run(
          listing.id,
          listing.portal,
          listing.url,
          urlHash,
          listing.address || null,
          listing.price || null
        );
      }
    });

    insertMany(listings);
    console.log(`[Deduplication] Marked ${listings.length} listings as scraped`);
  }

  /**
   * Update last seen timestamp for duplicate
   */
  private updateLastSeen(listing: PropertyListing): void {
    const urlHash = this.hashUrl(listing.url);

    const stmt = this.db.prepare(`
      UPDATE scraped_listings
      SET last_seen = CURRENT_TIMESTAMP,
          scrape_count = scrape_count + 1
      WHERE url_hash = ?
    `);

    stmt.run(urlHash);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalListings: number;
    byPortal: { [portal: string]: number };
  } {
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM scraped_listings
    `);

    const total = (totalStmt.get() as any).count;

    const portalStmt = this.db.prepare(`
      SELECT portal, COUNT(*) as count
      FROM scraped_listings
      GROUP BY portal
    `);

    const byPortal: { [portal: string]: number } = {};
    const results = portalStmt.all() as any[];

    for (const row of results) {
      byPortal[row.portal] = row.count;
    }

    return {
      totalListings: total,
      byPortal,
    };
  }

  /**
   * Clean old entries (older than X days)
   */
  cleanOldEntries(daysOld: number = 90): number {
    const stmt = this.db.prepare(`
      DELETE FROM scraped_listings
      WHERE last_seen < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);
    const deleted = result.changes;

    console.log(`[Deduplication] Cleaned ${deleted} old entries`);
    return deleted;
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.db.exec('DELETE FROM scraped_listings');
    console.log('[Deduplication] Cleared all data');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Export singleton
export const deduplicationService = new DeduplicationService();
