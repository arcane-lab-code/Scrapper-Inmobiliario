import { google, sheets_v4 } from 'googleapis';
import { PropertyListing } from '../scrapers/portals/portal.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service for managing Google Sheets integration
 */
export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private auth: any = null;

  /**
   * Initialize Google Sheets API with credentials
   */
  async initialize(credentialsPath: string): Promise<void> {
    try {
      const credentials = JSON.parse(
        fs.readFileSync(credentialsPath, 'utf-8')
      );

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });

      console.log('[GoogleSheets] Service initialized');
    } catch (error) {
      console.error('[GoogleSheets] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create a new spreadsheet
   */
  async createSpreadsheet(title: string): Promise<string> {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    const response = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Inmuebles',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = response.data.spreadsheetId!;
    console.log(`[GoogleSheets] Created spreadsheet: ${spreadsheetId}`);

    // Add headers
    await this.addHeaders(spreadsheetId);

    return spreadsheetId;
  }

  /**
   * Add headers to the spreadsheet
   */
  private async addHeaders(spreadsheetId: string): Promise<void> {
    const headers = [
      'ID',
      'Portal',
      'URL',
      'Dirección',
      'Distrito',
      'Barrio',
      'Precio (€)',
      'Habitaciones',
      'Baños',
      'Tamaño (m²)',
      'Planta',
      'Ascensor',
      'Estado',
      'Tipo',
      'Particular/Agencia',
      'Nombre Contacto',
      'Teléfono',
      'Email',
      'Empresa',
      'Descripción',
      'Características',
      'Fecha Publicación',
      'Fecha Actualización',
      'Visitas',
      'Favoritos',
      'Contactos',
      'Fecha Scraping',
      'Referencia',
    ];

    await this.appendRows(spreadsheetId, [headers]);

    // Format headers
    await this.formatHeaders(spreadsheetId);
  }

  /**
   * Format headers (bold, background color)
   */
  private async formatHeaders(spreadsheetId: string): Promise<void> {
    if (!this.sheets) return;

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.4,
                    blue: 0.8,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1,
                    },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });
  }

  /**
   * Append listings to spreadsheet
   */
  async appendListings(
    spreadsheetId: string,
    listings: PropertyListing[]
  ): Promise<number> {
    const rows = listings.map((listing) => this.listingToRow(listing));
    const addedCount = await this.appendRows(spreadsheetId, rows);

    console.log(`[GoogleSheets] Added ${addedCount} listings to spreadsheet`);
    return addedCount;
  }

  /**
   * Convert listing to spreadsheet row
   */
  private listingToRow(listing: PropertyListing): any[] {
    const contactInfo = (listing as any).contactInfo || {};

    return [
      listing.id,
      listing.portal,
      listing.url,
      listing.address || '',
      listing.district || '',
      listing.neighborhood || '',
      listing.price || '',
      listing.rooms || '',
      listing.bathrooms || '',
      listing.size || '',
      listing.floor || '',
      listing.hasElevator ? 'Sí' : 'No',
      listing.condition || '',
      (listing as any).propertyType || '',
      listing.isAgency ? 'Agencia' : 'Particular',
      contactInfo.name || '',
      contactInfo.phone || '',
      contactInfo.email || '',
      contactInfo.companyName || '',
      listing.description || '',
      listing.features?.join(', ') || '',
      listing.publishedDate
        ? new Date(listing.publishedDate).toLocaleDateString()
        : '',
      listing.updatedDate
        ? new Date(listing.updatedDate).toLocaleDateString()
        : '',
      listing.stats?.views || '',
      listing.stats?.favorites || '',
      listing.stats?.contacts || '',
      new Date(listing.scrapedAt).toLocaleString(),
      (listing as any).reference || '',
    ];
  }

  /**
   * Append rows to spreadsheet
   */
  private async appendRows(
    spreadsheetId: string,
    rows: any[][]
  ): Promise<number> {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    if (rows.length === 0) {
      return 0;
    }

    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Inmuebles!A:AB',
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });

    return response.data.updates?.updatedRows || 0;
  }

  /**
   * Get all listing IDs from spreadsheet (for deduplication)
   */
  async getExistingListingIds(spreadsheetId: string): Promise<Set<string>> {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Inmuebles!A:A',
      });

      const values = response.data.values || [];

      // Skip header row
      const ids = values.slice(1).map((row) => row[0]).filter(Boolean);

      return new Set(ids);
    } catch (error) {
      console.error('[GoogleSheets] Failed to get existing IDs:', error);
      return new Set();
    }
  }

  /**
   * Extract spreadsheet ID from URL
   */
  static extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
}

// Export singleton
export const googleSheetsService = new GoogleSheetsService();
