import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { Visit, Visitor, PopulatedVisit, VisitStatus, UserRole } from '../../src/types/index.ts';

const router = Router();

function getActor(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  const userName = req.headers['x-user-name'] as string || 'Front Desk Reception';
  const userRole = (req.headers['x-user-role'] as UserRole) || 'RECEPTIONIST';
  const userEmail = (req.headers['x-user-email'] as string) || 'reception@passguard.com';

  return {
    id: userId || 'usr-recep-01',
    name: userName,
    role: userRole,
    email: userEmail
  };
}

// GET /api/visitors/directory - Get unique Visitor profiles with total visits count
router.get('/directory', async (_req: Request, res: Response) => {
  try {
    const visitors = await db.visitors.find();
    const enriched = await Promise.all(
      visitors.map(async (vtr) => {
        const count = await db.visits.countDocuments(v => v.visitorId === vtr.id);
        return {
          ...vtr,
          totalVisitsCount: count
        };
      })
    );
    res.json({ visitors: enriched, total: enriched.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch visitor profiles' });
  }
});

// GET /api/visitors/search-profile - Lookup visitor by email or phone for autofill
router.get('/search-profile', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();
    if (!query) return res.json({ visitors: [] });

    const matches = await db.visitors.find(v => 
      v.email.toLowerCase().includes(query) ||
      v.phone.includes(query) ||
      v.name.toLowerCase().includes(query)
    );
    res.json({ visitors: matches.slice(0, 5) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to search visitor profiles' });
  }
});

// GET /api/visitors - Get all or filtered visits (populated with Visitor & Employee)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      status, 
      employeeId, 
      department, 
      date, 
      dateFrom, 
      dateTo, 
      purpose,
      visitorId
    } = req.query;

    const populatedVisits = await db.getPopulatedVisits(v => {
      // Status filtering
      if (status) {
        if (status === 'ACTIVE') {
          // Rule 10: Cancelled visits should not appear in active visitor lists
          if (v.status === 'CANCELLED' || v.status === 'REJECTED' || v.status === 'CHECKED_OUT') {
            return false;
          }
        } else if (status !== 'ALL') {
          if (v.status !== status) return false;
        }
      }

      // Employee Filter
      if (employeeId && v.employeeId !== employeeId) {
        return false;
      }

      // VisitorId Filter
      if (visitorId && v.visitorId !== visitorId) {
        return false;
      }

      // Single Date Filter
      if (date && v.visitDate !== String(date)) {
        return false;
      }

      // Date Range Filter
      if (dateFrom && v.visitDate < String(dateFrom)) {
        return false;
      }
      if (dateTo && v.visitDate > String(dateTo)) {
        return false;
      }

      // Purpose Filter
      if (purpose && v.purpose !== purpose) {
        return false;
      }

      return true;
    });

    // Apply Department and multi-search on populated fields
    const filtered = populatedVisits.filter(pv => {
      if (department && pv.employeeDepartment.toLowerCase() !== String(department).toLowerCase()) {
        return false;
      }

      if (search) {
        const q = String(search).toLowerCase().trim();
        const matchesName = pv.visitorName.toLowerCase().includes(q);
        const matchesEmail = pv.visitorEmail.toLowerCase().includes(q);
        const matchesPhone = pv.visitorPhone.includes(q);
        const matchesPass = pv.passNumber.toLowerCase().includes(q);
        const matchesEmployee = pv.employeeName.toLowerCase().includes(q);
        const matchesCompany = (pv.visitorCompany || '').toLowerCase().includes(q);
        const matchesPurpose = pv.purpose.toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesPass && !matchesEmployee && !matchesCompany && !matchesPurpose) {
          return false;
        }
      }

      return true;
    });

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ visitors: filtered, total: filtered.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch visits' });
  }
});

// GET /api/visitors/metrics/summary - Dashboard metrics
router.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    const employeeId = req.query.employeeId as string;
    const today = new Date().toISOString().split('T')[0];

    const allVisits = await db.visits.find();
    const totalEmployees = await db.employees.countDocuments(e => e.isActive);
    const totalRegisteredVisitors = await db.visitors.countDocuments();

    const totalVisitorsToday = allVisits.filter(v => v.visitDate === today && v.status !== 'CANCELLED').length;
    const visitorsCurrentlyInside = allVisits.filter(v => v.status === 'CHECKED_IN').length;
    const pendingRequests = allVisits.filter(v => v.status === 'PENDING').length;
    const approvedVisitorsToday = allVisits.filter(v => v.visitDate === today && (v.status === 'APPROVED' || v.status === 'CHECKED_IN' || v.status === 'CHECKED_OUT')).length;
    const checkedOutToday = allVisits.filter(v => v.visitDate === today && v.status === 'CHECKED_OUT').length;
    const rejectedTotal = allVisits.filter(v => v.status === 'REJECTED').length;

    let myPendingRequests = 0;
    let myApprovedToday = 0;

    if (employeeId) {
      myPendingRequests = allVisits.filter(v => v.employeeId === employeeId && v.status === 'PENDING').length;
      myApprovedToday = allVisits.filter(v => v.employeeId === employeeId && v.visitDate === today && (v.status === 'APPROVED' || v.status === 'CHECKED_IN')).length;
    }

    res.json({
      totalVisitorsToday,
      visitorsCurrentlyInside,
      pendingRequests,
      approvedVisitorsToday,
      checkedOutToday,
      rejectedTotal,
      totalEmployees,
      totalRegisteredVisitors,
      myPendingRequests,
      myApprovedToday
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to compute metrics' });
  }
});

// GET /api/visitors/reports - Summary reports with separate Visit & Visitor analytics
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;
    const now = new Date();
    let start = '';
    let end = '';

    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (period === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      start = monday.toISOString().split('T')[0];
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      end = sunday.toISOString().split('T')[0];
    } else if (period === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = firstDay.toISOString().split('T')[0];
      end = lastDay.toISOString().split('T')[0];
    } else if (period === 'custom' && startDate && endDate) {
      start = String(startDate);
      end = String(endDate);
    } else {
      start = todayStr;
      end = todayStr;
    }

    const populatedVisits = await db.getPopulatedVisits(v => v.visitDate >= start && v.visitDate <= end);

    const byStatus: Record<VisitStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CHECKED_IN: 0,
      CHECKED_OUT: 0,
      CANCELLED: 0
    };

    const byPurpose: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const hourlyDistribution: Record<string, number> = {
      '08:00': 0,
      '10:00': 0,
      '12:00': 0,
      '14:00': 0,
      '16:00': 0,
      '18:00': 0
    };

    let totalDurationMinutes = 0;
    let completedCount = 0;
    let overstayAlertsCount = 0;
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    populatedVisits.forEach(v => {
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      if (v.purpose) {
        byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1;
      }
      if (v.employeeDepartment) {
        byDepartment[v.employeeDepartment] = (byDepartment[v.employeeDepartment] || 0) + 1;
      }

      // Map time to nearest hourly bucket
      const timeStr = v.checkInTime ? new Date(v.checkInTime).toTimeString().substring(0, 5) : v.expectedArrivalTime;
      if (timeStr) {
        const hour = parseInt(timeStr.split(':')[0], 10);
        if (hour < 9) hourlyDistribution['08:00']++;
        else if (hour < 11) hourlyDistribution['10:00']++;
        else if (hour < 13) hourlyDistribution['12:00']++;
        else if (hour < 15) hourlyDistribution['14:00']++;
        else if (hour < 17) hourlyDistribution['16:00']++;
        else hourlyDistribution['18:00']++;
      }

      // Check overstay
      if (v.status === 'CHECKED_IN' && v.visitDate === todayStr && v.expectedDepartureTime && v.expectedDepartureTime < currentHourMin) {
        overstayAlertsCount++;
      }

      if (v.checkInTime && v.checkOutTime) {
        const inTime = new Date(v.checkInTime).getTime();
        const outTime = new Date(v.checkOutTime).getTime();
        if (outTime > inTime) {
          totalDurationMinutes += Math.round((outTime - inTime) / (1000 * 60));
          completedCount++;
        }
      }
    });

    const completedVisits = byStatus.CHECKED_OUT;
    const totalApprovedOrPast = byStatus.APPROVED + byStatus.CHECKED_IN + byStatus.CHECKED_OUT;
    const approvedRate = populatedVisits.length > 0 
      ? Math.round((totalApprovedOrPast / (populatedVisits.length - byStatus.CANCELLED || 1)) * 100) 
      : 0;

    const averageVisitDurationMinutes = completedCount > 0 ? Math.round(totalDurationMinutes / completedCount) : 0;
    const flaggedDenials = byStatus.REJECTED;

    res.json({
      period,
      dateRange: { start, end },
      totalVisits: populatedVisits.length,
      completedVisits,
      approvedRate,
      averageVisitDurationMinutes,
      flaggedDenials,
      overstayAlertsCount,
      hourlyDistribution,
      byStatus,
      byPurpose,
      byDepartment
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate report' });
  }
});

// GET /api/visitors/:id - Get single populated visit
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const visit = await db.visits.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ error: 'Visit record not found' });
    }
    const populated = await db.populateVisit(visit);
    res.json({ visitor: populated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve visit' });
  }
});

// POST /api/visitors - Register Visitor + Create Separate Visit Document
// Strictly enforces Business Rules 1, 2, 3, 4, 5 using distinct Visitor and Visit collections
router.post('/', async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const {
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany,
      visitorIdType,
      visitorIdNumber,
      employeeId,
      purpose,
      customPurpose,
      visitDate,
      expectedArrivalTime,
      expectedDepartureTime,
      notes
    } = req.body;

    // Field Validations
    if (!visitorName || !visitorEmail || !visitorPhone || !employeeId || !purpose || !visitDate || !expectedArrivalTime) {
      return res.status(400).json({ 
        error: 'Missing required fields. Name, email, phone, employee, purpose, visit date, and arrival time are required.' 
      });
    }

    const employee = await db.employees.findById(employeeId);
    if (!employee || !employee.isActive) {
      return res.status(400).json({ error: 'Selected employee does not exist or is currently inactive.' });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`;

    // Validation: Visit date cannot be earlier than current date
    if (visitDate < todayStr) {
      return res.status(400).json({ 
        error: `Visit date cannot be earlier than today's date.` 
      });
    }

    // Validation: For today's registrations, arrival time cannot be earlier than current time
    if (visitDate === todayStr) {
      const [expH, expM] = expectedArrivalTime.split(':').map(Number);
      const [curH, curM] = currentTimeStr.split(':').map(Number);
      const expMinutes = expH * 60 + expM;
      const curMinutes = curH * 60 + curM;

      if (expMinutes < curMinutes - 5) {
        return res.status(400).json({ 
          error: `Expected arrival time cannot be earlier than the current time for visits scheduled today.` 
        });
      }
    }

    // Validation: Expected departure time must be strictly later than expected arrival time
    if (expectedArrivalTime && expectedDepartureTime) {
      const [arrH, arrM] = expectedArrivalTime.split(':').map(Number);
      const [depH, depM] = expectedDepartureTime.split(':').map(Number);
      const arrMinutes = arrH * 60 + arrM;
      const depMinutes = depH * 60 + depM;

      if (depMinutes <= arrMinutes) {
        return res.status(400).json({
          error: `Expected departure time (${expectedDepartureTime}) must be strictly later than expected arrival time (${expectedArrivalTime}).`
        });
      }
    }

    const cleanEmail = visitorEmail.trim().toLowerCase();
    const cleanPhone = visitorPhone.trim();

    // 1. Separate Collection Handling: Find or Create Visitor
    let visitor = await db.visitors.findOne(v => 
      v.email.toLowerCase() === cleanEmail || v.phone === cleanPhone
    );

    if (!visitor) {
      visitor = {
        id: `vtr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: visitorName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        company: visitorCompany?.trim() || '',
        idType: visitorIdType || 'National ID',
        idNumber: visitorIdNumber || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString()
      };
      await db.visitors.insertOne(visitor);
    } else {
      // Update company/id details if changed
      await db.visitors.updateOne(visitor.id, {
        name: visitorName.trim(),
        ...(visitorCompany && { company: visitorCompany.trim() }),
        ...(visitorIdType && { idType: visitorIdType }),
        ...(visitorIdNumber && { idNumber: visitorIdNumber })
      });
    }

    // Validation: A visitor cannot have more than one active visit at the same time
    const activeVisit = await db.visits.findOne(v => 
      v.visitorId === visitor!.id &&
      ['PENDING', 'APPROVED', 'CHECKED_IN'].includes(v.status)
    );

    if (activeVisit) {
      return res.status(400).json({ 
        error: `This visitor already has an active visit in progress (Pass #${activeVisit.passNumber}). A visitor cannot have multiple active visits simultaneously.` 
      });
    }

    // Validation: Duplicate visitor registrations on same date
    const duplicateSameDate = await db.visits.findOne(v => 
      v.visitorId === visitor!.id &&
      v.visitDate === visitDate &&
      v.status !== 'CANCELLED' &&
      v.status !== 'REJECTED'
    );

    if (duplicateSameDate) {
      return res.status(400).json({ 
        error: `A visit is already registered for this visitor on this date (Pass #${duplicateSameDate.passNumber}). Duplicate registrations for the same date are not allowed.` 
      });
    }

    // Validation: Employee pending capacity check
    const pendingForEmployee = await db.visits.countDocuments(v => 
      v.employeeId === employeeId && 
      v.status === 'PENDING'
    );

    if (pendingForEmployee >= (employee.maxPendingAllowed || 3)) {
      return res.status(400).json({ 
        error: `${employee.name} already has ${pendingForEmployee} pending visitor requests awaiting approval (maximum allowed is 3). Please resolve pending requests or select another host.` 
      });
    }

    // Generate unique pass number
    const passNumber = await db.generatePassNumber();
    const newVisitId = `vis-${Date.now()}`;

    // 2. Create Separate Visit Document
    const newVisit: Visit = {
      id: newVisitId,
      passNumber,
      visitorId: visitor.id,
      employeeId: employee.id,
      visitDate,
      expectedArrivalTime,
      expectedDepartureTime,
      purpose,
      customPurpose: customPurpose?.trim(),
      status: 'PENDING',
      remarks: notes?.trim() || '',
      registeredBy: {
        id: actor.id,
        name: actor.name,
        role: actor.role
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.visits.insertOne(newVisit);

    // 3. Create Separate ActivityLog Document
    await db.logActivity({
      visitId: newVisit.id,
      action: 'CREATED',
      performedBy: actor,
      details: `Visitor registration submitted for ${visitor.name} (${visitor.company || 'Direct'}) visiting ${employee.name} (${employee.department}) on ${visitDate} at ${expectedArrivalTime}.`,
      remarks: notes,
      passNumber: newVisit.passNumber,
      visitorName: visitor.name
    });

    const populated = await db.populateVisit(newVisit);

    res.status(201).json({
      success: true,
      message: `Visitor pass request ${passNumber} created successfully for ${visitor.name}. Awaiting approval from ${employee.name}.`,
      visitor: populated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to register visitor' });
  }
});

// PUT /api/visitors/:id/status - Update Status (Rules 6, 7, 8, 9, 10)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const { action, remarks, customTimestamp } = req.body;
    const visit = await db.visits.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ error: 'Visit record not found' });
    }

    const populated = await db.populateVisit(visit);
    const nowIso = customTimestamp || new Date().toISOString();

    if (action === 'APPROVE') {
      if (visit.status !== 'PENDING') {
        return res.status(400).json({ error: `Cannot approve visit in '${visit.status}' state. Only PENDING visits can be approved.` });
      }

      const updated = await db.visits.updateOne(visit.id, {
        status: 'APPROVED',
        approvalRemarks: remarks || 'Approved by host',
        approvedBy: {
          id: actor.id,
          name: actor.name,
          role: actor.role,
          timestamp: nowIso
        },
        updatedAt: nowIso
      });

      await db.logActivity({
        visitId: visit.id,
        action: 'APPROVED',
        performedBy: actor,
        details: `Visit approved by ${actor.name}. Pass ready for front desk check-in.`,
        remarks: remarks || 'Approved',
        passNumber: visit.passNumber,
        visitorName: populated.visitorName
      });

      const updatedPopulated = await db.populateVisit(updated!);
      return res.json({ success: true, message: 'Visitor request approved successfully', visitor: updatedPopulated });
    }

    if (action === 'REJECT') {
      if (visit.status !== 'PENDING') {
        return res.status(400).json({ error: `Cannot reject visit in '${visit.status}' state. Only PENDING visits can be rejected.` });
      }
      if (!remarks || remarks.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide remarks or a reason for rejecting this visitor request.' });
      }

      const updated = await db.visits.updateOne(visit.id, {
        status: 'REJECTED',
        rejectionReason: remarks.trim(),
        rejectedBy: {
          id: actor.id,
          name: actor.name,
          role: actor.role,
          timestamp: nowIso
        },
        updatedAt: nowIso
      });

      await db.logActivity({
        visitId: visit.id,
        action: 'REJECTED',
        performedBy: actor,
        details: `Visit request rejected by ${actor.name}. Reason: ${remarks.trim()}`,
        remarks: remarks.trim(),
        passNumber: visit.passNumber,
        visitorName: populated.visitorName
      });

      const updatedPopulated = await db.populateVisit(updated!);
      return res.json({ success: true, message: 'Visitor request rejected', visitor: updatedPopulated });
    }

    if (action === 'CHECK_IN') {
      // Validation: Rejected visitor requests cannot be checked in
      if (visit.status === 'REJECTED') {
        return res.status(400).json({
          error: `Rejected visitor requests cannot be checked in (${visit.rejectionReason || 'Declined by host'}).`
        });
      }

      // Validation: Already checked in visitor
      if (visit.status === 'CHECKED_IN') {
        return res.status(400).json({
          error: `${populated.visitorName} is already checked in. The visitor must be checked out before checking in again.`
        });
      }

      // Validation: Must be approved before check in
      if (visit.status !== 'APPROVED') {
        return res.status(400).json({
          error: `Visitors can only be checked in after approval by their host. Current status is '${visit.status}'.`
        });
      }

      const updated = await db.visits.updateOne(visit.id, {
        status: 'CHECKED_IN',
        checkInTime: nowIso,
        checkedInBy: {
          id: actor.id,
          name: actor.name
        },
        updatedAt: nowIso
      });

      await db.logActivity({
        visitId: visit.id,
        action: 'CHECKED_IN',
        performedBy: actor,
        details: `Visitor verified identity (${populated.visitorIdType} - ${populated.visitorIdNumber}) and checked in at Front Reception. QR Badge issued.`,
        remarks,
        passNumber: visit.passNumber,
        visitorName: populated.visitorName
      });

      const updatedPopulated = await db.populateVisit(updated!);
      return res.json({ success: true, message: `Visitor ${populated.visitorName} successfully checked in.`, visitor: updatedPopulated });
    }

    if (action === 'CHECK_OUT') {
      if (visit.status !== 'CHECKED_IN') {
        return res.status(400).json({ error: `Cannot check out visitor who is not currently checked in. Current status: '${visit.status}'` });
      }

      // Validation: Check-out time must be later than check-in time
      const checkInDate = new Date(visit.checkInTime || nowIso).getTime();
      const checkOutDate = new Date(nowIso).getTime();

      if (checkOutDate <= checkInDate) {
        return res.status(400).json({
          error: `Check-out time must always be strictly later than check-in time.`
        });
      }

      const updated = await db.visits.updateOne(visit.id, {
        status: 'CHECKED_OUT',
        checkOutTime: nowIso,
        checkedOutBy: {
          id: actor.id,
          name: actor.name
        },
        updatedAt: nowIso
      });

      await db.logActivity({
        visitId: visit.id,
        action: 'CHECKED_OUT',
        performedBy: actor,
        details: `Visitor badge returned. Checked out of premises. Total on-site time: ${Math.round((checkOutDate - checkInDate)/(1000*60))} minutes.`,
        remarks,
        passNumber: visit.passNumber,
        visitorName: populated.visitorName
      });

      const updatedPopulated = await db.populateVisit(updated!);
      return res.json({ success: true, message: `Visitor ${populated.visitorName} successfully checked out.`, visitor: updatedPopulated });
    }

    if (action === 'CANCEL') {
      // RULE 10: Cancelled visits should not appear in active visitor lists.
      if (visit.status === 'CHECKED_IN') {
        return res.status(400).json({ error: 'Cannot cancel a visit that is currently checked in. Please check out the visitor instead.' });
      }
      if (visit.status === 'CHECKED_OUT') {
        return res.status(400).json({ error: 'Cannot cancel a visit that has already completed and checked out.' });
      }

      const updated = await db.visits.updateOne(visit.id, {
        status: 'CANCELLED',
        remarks: remarks ? `${visit.remarks || ''} [Cancellation reason: ${remarks}]` : visit.remarks,
        updatedAt: nowIso
      });

      await db.logActivity({
        visitId: visit.id,
        action: 'CANCELLED',
        performedBy: actor,
        details: `Visit pass cancelled by ${actor.name}.`,
        remarks,
        passNumber: visit.passNumber,
        visitorName: populated.visitorName
      });

      const updatedPopulated = await db.populateVisit(updated!);
      return res.json({ success: true, message: 'Visit cancelled successfully', visitor: updatedPopulated });
    }

    return res.status(400).json({ error: `Unsupported status action: '${action}'` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update visitor status' });
  }
});

// DELETE /api/visitors/:id - Delete single visit pass record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const visit = await db.visits.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ error: 'Visit pass record not found' });
    }

    const populated = await db.populateVisit(visit);

    await db.visits.deleteOne(visit.id);

    await db.logActivity({
      visitId: visit.id,
      action: 'CANCELLED',
      performedBy: actor,
      details: `Visit pass ${visit.passNumber} permanently deleted by ${actor.name}.`,
      passNumber: visit.passNumber,
      visitorName: populated.visitorName
    });

    res.json({ success: true, message: `Pass ${visit.passNumber} deleted permanently from database.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete visit pass' });
  }
});

// DELETE /api/visitors/purge - Purge all visits, visitors, and activity logs
router.delete('/purge/all', async (req: Request, res: Response) => {
  try {
    await db.visits.clear();
    await db.visitors.clear();
    await db.activityLogs.clear();
    res.json({ success: true, message: 'All visitor records and logs successfully cleared from database.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear records' });
  }
});

export default router;
