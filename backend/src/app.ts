import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import searchesRouter from './routes/searches.routes';
import { googleSheetsService } from './services/google-sheets.service';
import { schedulerService } from './services/scheduler.service';
import { deduplicationService } from './services/deduplication.service';
import { scrapingHub } from './scrapers/hub';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/searches', searchesRouter);

// Info endpoint
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    name: 'Scrapper Inmobiliario API',
    version: '1.0.0',
    availableEngines: scrapingHub.getAvailableEngines(),
    availablePortals: scrapingHub.getAvailablePortals(),
    scheduledJobs: schedulerService.getScheduledJobs(),
    stats: deduplicationService.getStats(),
  });
});

// Scheduler endpoints
app.get('/api/scheduler/jobs', (req: Request, res: Response) => {
  const jobs = schedulerService.getScheduledJobs();
  res.json({
    success: true,
    jobs,
    count: jobs.length,
  });
});

app.post('/api/scheduler/jobs/:id/pause', (req: Request, res: Response) => {
  const { id } = req.params;
  schedulerService.pauseSearch(id);
  res.json({
    success: true,
    message: 'Job paused',
  });
});

app.post('/api/scheduler/jobs/:id/resume', (req: Request, res: Response) => {
  const { id } = req.params;
  schedulerService.resumeSearch(id);
  res.json({
    success: true,
    message: 'Job resumed',
  });
});

// Stats endpoint
app.get('/api/stats', (req: Request, res: Response) => {
  const stats = deduplicationService.getStats();
  res.json({
    success: true,
    stats,
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize Google Sheets if credentials available
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './config/google-credentials.json';

    try {
      await googleSheetsService.initialize(credentialsPath);
      console.log('[App] Google Sheets service initialized');
    } catch (error) {
      console.warn('[App] Google Sheets not configured:', error);
    }

    // Load and schedule existing searches
    // This would be done from database in production
    console.log('[App] Services initialized');
  } catch (error) {
    console.error('[App] Failed to initialize services:', error);
  }
}

// Start server
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`[App] Server running on port ${PORT}`);
    console.log(`[App] Environment: ${process.env.NODE_ENV || 'development'}`);

    await initializeServices();

    console.log(`[App] API ready at http://localhost:${PORT}`);
    console.log(`[App] Health check: http://localhost:${PORT}/health`);
    console.log(`[App] Info: http://localhost:${PORT}/api/info`);
  });
}

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('[App] SIGTERM received, shutting down gracefully');
  schedulerService.stopAll();
  deduplicationService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[App] SIGINT received, shutting down gracefully');
  schedulerService.stopAll();
  deduplicationService.close();
  process.exit(0);
});

export default app;
