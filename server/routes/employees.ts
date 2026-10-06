import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { Employee } from '../../src/types/index.ts';
import { hashPassword } from '../utils/crypto.ts';

const router = Router();

// GET /api/employees - Get all employees with live pending request counts (for Rule 5)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const employees = await db.employees.find();
    
    // Enrich with current pending requests count from separate visits collection
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const pendingCount = await db.visits.countDocuments(
          v => v.employeeId === emp.id && v.status === 'PENDING'
        );
        return {
          ...emp,
          pendingRequestsCount: pendingCount
        };
      })
    );

    res.json({ employees: enriched });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to load employee directory. Please try again.' });
  }
});

// POST /api/employees - Create new employee
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, department, designation, officeLocation, maxPendingAllowed } = req.body;
    if (!name || !email || !department) {
      return res.status(400).json({ error: 'Name, email, and department are required fields.' });
    }

    const existing = await db.employees.findOne(e => e.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email address already exists.' });
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      department: department.trim(),
      designation: designation?.trim() || 'Staff Member',
      officeLocation: officeLocation?.trim() || 'Main Campus',
      isActive: true,
      maxPendingAllowed: Number(maxPendingAllowed) || 3
    };

    await db.employees.insertOne(newEmp);

    // Also create linked user account for them securely hashed
    await db.users.insertOne({
      id: `usr-${newEmp.id}`,
      name: newEmp.name,
      email: newEmp.email,
      password: hashPassword('password123'),
      role: 'EMPLOYEE',
      employeeId: newEmp.id,
      department: newEmp.department,
      designation: newEmp.designation,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, employee: newEmp });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create employee profile. Please verify input fields and try again.' });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, phone, department, designation, officeLocation, isActive, maxPendingAllowed } = req.body;
    const emp = await db.employees.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee profile not found.' });
    }

    const updated = await db.employees.updateOne(emp.id, {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone }),
      ...(department && { department: department.trim() }),
      ...(designation && { designation: designation.trim() }),
      ...(officeLocation && { officeLocation: officeLocation.trim() }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      ...(maxPendingAllowed !== undefined && { maxPendingAllowed: Number(maxPendingAllowed) })
    });

    res.json({ success: true, employee: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update employee profile. Please try again.' });
  }
});

// DELETE /api/employees/:id - Delete employee permanently
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const emp = await db.employees.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee profile not found.' });
    }

    await db.employees.deleteOne(emp.id);
    // Also remove associated user if created
    const linkedUser = await db.users.findOne(u => u.employeeId === emp.id);
    if (linkedUser) {
      await db.users.deleteOne(linkedUser.id);
    }

    res.json({ success: true, message: `Employee ${emp.name} removed successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete employee profile. Please try again.' });
  }
});

export default router;
