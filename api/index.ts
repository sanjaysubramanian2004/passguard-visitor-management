import express from 'express';
import authRoutes from '../server/routes/auth.ts';
import visitorRoutes from '../server/routes/visitors.ts';
import employeeRoutes from '../server/routes/employees.ts';
import userRoutes from '../server/routes/users.ts';
import activityRoutes from '../server/routes/activity.ts';
import { initMongoDatabase, dbConnectionState, db } from '../server/db.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isDbInit = false;
async function ensureDb() {
  if (!isDbInit) {
    try {
      await initMongoDatabase();
    } catch (e) {
      console.warn('Vercel serverless MongoDB init notice:', e);
    }
    isDbInit = true;
  }
}

app.use(async (_req, _res, next) => {
  await ensureDb();
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

// Database diagnostics
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
    mode: dbConnectionState.isConnectedToRealMongo ? 'MongoDB Atlas / Remote Cluster Active' : 'Persistent Storage Engine Active',
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

export default app;
