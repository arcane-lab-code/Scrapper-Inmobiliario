import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SearchConfig } from '../models/search-config.model';
import { schedulerService } from '../services/scheduler.service';
import Database from 'better-sqlite3';

const router = Router();

// In-memory storage (replace with real DB in production)
const db = new Database('./data/searches.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    portal TEXT NOT NULL,
    config TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_executed DATETIME
  );
`);

/**
 * GET /api/searches
 * List all searches
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM searches ORDER BY created_at DESC');
    const rows = stmt.all() as any[];

    const searches = rows.map((row) => ({
      ...JSON.parse(row.config),
      id: row.id,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastExecuted: row.last_executed,
    }));

    res.json({
      success: true,
      searches,
      count: searches.length,
    });
  } catch (error) {
    console.error('Error fetching searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch searches',
    });
  }
});

/**
 * GET /api/searches/:id
 * Get search by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM searches WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Search not found',
      });
    }

    const search = {
      ...JSON.parse(row.config),
      id: row.id,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastExecuted: row.last_executed,
    };

    res.json({
      success: true,
      search,
    });
  } catch (error) {
    console.error('Error fetching search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search',
    });
  }
});

/**
 * POST /api/searches
 * Create new search
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const config: SearchConfig = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      enabled: req.body.enabled !== false,
    };

    // Validate required fields
    if (!config.name || !config.portal) {
      return res.status(400).json({
        success: false,
        error: 'Name and portal are required',
      });
    }

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO searches (id, name, portal, config, enabled)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      config.id,
      config.name,
      config.portal,
      JSON.stringify(config),
      config.enabled ? 1 : 0
    );

    // Schedule if enabled
    if (config.schedule.enabled) {
      schedulerService.scheduleSearch(config);
    }

    res.status(201).json({
      success: true,
      search: config,
    });
  } catch (error) {
    console.error('Error creating search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create search',
    });
  }
});

/**
 * PUT /api/searches/:id
 * Update search
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if exists
    const checkStmt = db.prepare('SELECT * FROM searches WHERE id = ?');
    const existing = checkStmt.get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Search not found',
      });
    }

    const config: SearchConfig = {
      ...req.body,
      id,
      updatedAt: new Date(),
    };

    // Update database
    const updateStmt = db.prepare(`
      UPDATE searches
      SET name = ?, portal = ?, config = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(
      config.name,
      config.portal,
      JSON.stringify(config),
      config.enabled ? 1 : 0,
      id
    );

    // Reschedule if needed
    schedulerService.unscheduleSearch(id);
    if (config.schedule.enabled) {
      schedulerService.scheduleSearch(config);
    }

    res.json({
      success: true,
      search: config,
    });
  } catch (error) {
    console.error('Error updating search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update search',
    });
  }
});

/**
 * DELETE /api/searches/:id
 * Delete search
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Unschedule
    schedulerService.unscheduleSearch(id);

    // Delete from database
    const stmt = db.prepare('DELETE FROM searches WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Search not found',
      });
    }

    res.json({
      success: true,
      message: 'Search deleted',
    });
  } catch (error) {
    console.error('Error deleting search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete search',
    });
  }
});

/**
 * POST /api/searches/:id/execute
 * Execute search manually
 */
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM searches WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Search not found',
      });
    }

    const config: SearchConfig = JSON.parse(row.config);

    // Execute in background
    schedulerService.executeSearch(config).catch((error) => {
      console.error('Error executing search:', error);
    });

    // Update last executed
    const updateStmt = db.prepare(`
      UPDATE searches SET last_executed = CURRENT_TIMESTAMP WHERE id = ?
    `);
    updateStmt.run(id);

    res.json({
      success: true,
      message: 'Search execution started',
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute search',
    });
  }
});

export default router;
