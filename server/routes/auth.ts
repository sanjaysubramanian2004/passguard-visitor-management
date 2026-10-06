import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';
import { User, UserRole } from '../../src/types/index.ts';
import { verifyPassword } from '../utils/crypto.ts';

const router = Router();

// In a real app we'd verify JWT token; here we support session/header/body user simulation with full persistence
export function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers['x-user-id'] as string;
  const authRole = req.headers['x-user-role'] as UserRole;
  
  if (authHeader) {
    const found = Array.from((db.users as any).items.values()).find((u: any) => u.id === authHeader);
    if (found) return found as User;
  }
  
  // Default to Receptionist or Admin if not provided
  return null;
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: `Access forbidden: Role '${user.role}' does not have permission for this operation. Required: ${allowedRoles.join(' or ')}` 
      });
    }
    (req as any).user = user;
    next();
  };
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    let user: User | null = null;
    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      user = await db.users.findOne(u => u.email.toLowerCase() === trimmedEmail);
    } else if (role) {
      user = await db.users.findOne(u => u.role === role && u.isActive);
    }

    if (!user) {
      return res.status(401).json({ error: 'No user account found with this email address.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This user account is currently disabled. Please contact your administrator.' });
    }

    // Verify password if provided securely
    if (password && user.password) {
      if (!verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
      }
    }

    res.json({
      success: true,
      user,
      token: `pg_token_${user.id}_${Date.now()}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    // Default fallback to first active user
    const defaultUser = await db.users.findOne(u => u.role === 'ADMIN');
    return res.json({ user: defaultUser });
  }

  const user = await db.users.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// GET /api/auth/users-list (for quick switcher)
router.get('/switchable-users', async (_req: Request, res: Response) => {
  const users = await db.users.find(u => u.isActive);
  res.json({ users });
});

export default router;
