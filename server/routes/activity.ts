import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

const router = Router();

// GET /api/activity - Fetch activity logs with search & filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { action, visitId, passNumber, search, date } = req.query;

    const logs = await db.activityLogs.find(log => {
      if (action && action !== 'ALL' && log.action !== action) {
        return false;
      }
      if (visitId && log.visitId !== visitId) {
        return false;
      }
      if (passNumber && !(log.passNumber || '').toLowerCase().includes(String(passNumber).toLowerCase())) {
        return false;
      }
      const logTime = log.timestamp || log.createdAt || '';
      if (date && !logTime.startsWith(String(date))) {
        return false;
      }
      if (search) {
        const query = String(search).toLowerCase();
        const matchesPass = (log.passNumber || '').toLowerCase().includes(query);
        const matchesVisitor = (log.visitorName || '').toLowerCase().includes(query);
        const matchesActor = log.performedBy.name.toLowerCase().includes(query);
        const matchesDetails = log.details.toLowerCase().includes(query);
        if (!matchesPass && !matchesVisitor && !matchesActor && !matchesDetails) {
          return false;
        }
      }
      return true;
    });

    // Sort latest first
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    res.json({ logs, total: logs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch activity logs' });
  }
});

export default router;
