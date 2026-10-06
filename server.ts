import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './server/routes/auth.ts';
import visitorRoutes from './server/routes/visitors.ts';
import employeeRoutes from './server/routes/employees.ts';
import userRoutes from './server/routes/users.ts';
import activityRoutes from './server/routes/activity.ts';
import { initMongoDatabase, dbConnectionState, db } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize MongoDB / Mongoose connection
  await initMongoDatabase();

  // Request logger in dev
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/visitors', visitorRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/activity', activityRoutes);

  // Health check & MongoDB status
  app.get('/api/health', async (_req, res) => {
    const userCount = await db.users.countDocuments();
    const visitorCount = await db.visitors.countDocuments();
    const visitCount = await db.visits.countDocuments();

    res.json({
      status: 'ok',
      system: 'PassGuard MERN Visitor Pass Management System',
      database: {
        ...dbConnectionState,
        counts: {
          users: userCount,
          visitors: visitorCount,
          visits: visitCount
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  // Database Connection Diagnostics
  app.get('/api/database/status', async (_req, res) => {
    const userCount = await db.users.countDocuments();
    const employeeCount = await db.employees.countDocuments();
    const visitorCount = await db.visitors.countDocuments();
    const visitCount = await db.visits.countDocuments();
    const activityCount = await db.activityLogs.countDocuments();

    res.json({
      connected: true,
      isConnectedToRealMongo: dbConnectionState.isConnectedToRealMongo,
      lastError: (dbConnectionState as any).lastError || '',
      mode: dbConnectionState.isConnectedToRealMongo ? 'MongoDB Atlas / Remote Cluster Active' : 'Persistent Storage Engine Active (Awaiting MongoDB Atlas IP Whitelist)',
      uri: dbConnectionState.connectionUri || 'Local Mongo Engine',
      dbName: dbConnectionState.dbName,
      stats: {
        users: userCount,
        employees: employeeCount,
        visitors: visitorCount,
        visits: visitCount,
        activityLogs: activityCount
      },
      timestamp: new Date().toISOString()
    });
  });

  // Vite integration
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`🚀 PassGuard Visitor Pass Management Server listening on port ${port}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});
