import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { User, UserRole } from '../../src/types/index.ts';
import { hashPassword } from '../utils/crypto.ts';

const router = Router();

// GET /api/users - List users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await db.users.find();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to retrieve users list. Please try again.' });
  }
});

// POST /api/users - Create user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department, designation } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required fields.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await db.users.findOne(u => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: 'A user account with this email address already exists.' });
    }

    const userId = `usr-${Date.now()}`;
    let employeeId: string | undefined = undefined;

    // If creating an EMPLOYEE, also create an Employee document in MongoDB so they appear in visitor booking
    if (role === 'EMPLOYEE') {
      employeeId = `emp-${Date.now()}`;
      const newEmp = {
        id: employeeId,
        name: name.trim(),
        email: trimmedEmail,
        department: department?.trim() || 'Engineering',
        designation: designation?.trim() || 'Host Employee',
        officeLocation: 'HQ Main Campus',
        isActive: true,
        pendingRequestsCount: 0,
        maxPendingAllowed: 3
      };
      await db.employees.insertOne(newEmp);
    }

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: trimmedEmail,
      password: hashPassword(password?.trim() || 'User@123'),
      role: role as UserRole,
      department: department?.trim() || (role === 'RECEPTIONIST' ? 'Front Desk Operations' : role === 'ADMIN' ? 'IT Administration' : 'Engineering'),
      designation: designation?.trim() || (role === 'ADMIN' ? 'System Administrator' : role === 'RECEPTIONIST' ? 'Receptionist' : 'Host Employee'),
      employeeId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await db.users.insertOne(newUser);
    res.status(201).json({ success: true, user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user. Please verify input fields and try again.' });
  }
});

// PUT /api/users/:id - Update user status/role
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, role, department, designation, isActive } = req.body;
    const user = await db.users.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const updated = await db.users.updateOne(user.id, {
      ...(name && { name: name.trim() }),
      ...(role && { role: role as UserRole }),
      ...(department !== undefined && { department }),
      ...(designation !== undefined && { designation }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) })
    });

    res.json({ success: true, user: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user profile. Please try again.' });
  }
});

// DELETE /api/users/:id - Delete user permanently
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = await db.users.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    await db.users.deleteOne(user.id);
    res.json({ success: true, message: `User ${user.name} removed successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user. Please try again.' });
  }
});

// POST /api/users/purge-dummy - Purge any leftover dummy seed accounts
router.post('/purge-dummy', async (_req: Request, res: Response) => {
  try {
    const dummyEmails = ['admin@passguard.com', 'reception@passguard.com', 'john.doe@passguard.com', 'emily.chen@passguard.com'];
    for (const email of dummyEmails) {
      const u = await db.users.findOne(user => user.email.toLowerCase() === email);
      if (u) await db.users.deleteOne(u.id);
      const e = await db.employees.findOne(emp => emp.email.toLowerCase() === email);
      if (e) await db.employees.deleteOne(e.id);
    }
    res.json({ success: true, message: 'Dummy records purged' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to purge dummy records' });
  }
});

export default router;
