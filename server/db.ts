import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  User, 
  Employee, 
  Visitor, 
  Visit, 
  PopulatedVisit, 
  ActivityLog, 
  UserRole 
} from '../src/types/index.ts';

import { UserModel } from './models/User.ts';
import { EmployeeModel } from './models/Employee.ts';
import { VisitorModel } from './models/Visitor.ts';
import { VisitModel } from './models/Visit.ts';
import { ActivityLogModel } from './models/ActivityLog.ts';
import { hashPassword } from './utils/crypto.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

// Initial seeded Admin account (admin@company.com / Admin@123)
export const initialAdminUser: User = {
  id: 'usr-admin-01',
  name: 'Administrator',
  email: 'admin@company.com',
  password: hashPassword('Admin@123'),
  role: 'ADMIN',
  department: 'IT & Security Administration',
  designation: 'System Administrator',
  isActive: true,
  createdAt: new Date().toISOString()
};

// Real MongoDB Connection Status Tracker
export let dbConnectionState = {
  isConnectedToRealMongo: false,
  connectionUri: '',
  dbName: 'passguard',
  driver: 'Mongoose Persistence Engine',
  lastConnectedAt: new Date().toISOString(),
  lastError: ''
};

// MongoDB URI dynamically retrieved from environment variables
const DEFAULT_MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

// Collection class with double persistence (Disk + MongoDB)
class MongoCollection<T extends { id: string }> {
  public items: Map<string, T> = new Map();
  public name: string;
  private model?: mongoose.Model<any>;

  constructor(name: string, initialData: T[] = [], model?: mongoose.Model<any>) {
    this.name = name;
    this.model = model;
    initialData.forEach(item => this.items.set(item.id, { ...item }));
  }

  setModel(model: mongoose.Model<any>) {
    this.model = model;
  }

  private getQueryFilter(id: string) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return { $or: [{ id }, { _id: id }] };
    }
    return { id };
  }

  async find(predicate?: (item: T) => boolean): Promise<T[]> {
    if (dbConnectionState.isConnectedToRealMongo && this.model) {
      try {
        const docs = await this.model.find({}).lean();
        if (docs && docs.length > 0) {
          // Sync MongoDB records into memory & disk
          for (const d of docs) {
            const item = {
              ...d,
              id: d.id || (d as any)._id?.toString()
            } as T;
            this.items.set(item.id, item);
          }
          saveStoreToDisk();
        }
      } catch (e: any) {
        console.warn(`Error querying ${this.name} from MongoDB Atlas:`, e.message);
      }
    }

    const list = Array.from(this.items.values());
    if (!predicate) return list;
    return list.filter(predicate);
  }

  async findById(id: string): Promise<T | null> {
    const local = this.items.get(id);
    if (local) return { ...local };

    if (dbConnectionState.isConnectedToRealMongo && this.model) {
      try {
        const query = this.getQueryFilter(id);
        const doc = await this.model.findOne(query).lean();
        if (doc) {
          const item = { ...doc, id: (doc as any).id || (doc as any)._id?.toString() } as T;
          this.items.set(item.id, item);
          saveStoreToDisk();
          return item;
        }
      } catch (e: any) {
        console.warn(`Error finding by id in ${this.name}:`, e.message);
      }
    }

    return null;
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const all = await this.find();
    for (const item of all) {
      if (predicate(item)) {
        return { ...item };
      }
    }
    return null;
  }

  async insertOne(doc: T): Promise<T> {
    const item = { ...doc };
    this.items.set(item.id, item);
    saveStoreToDisk();

    if (dbConnectionState.isConnectedToRealMongo && this.model) {
      try {
        await this.model.create(item);
      } catch (e: any) {
        console.warn(`Error saving to MongoDB ${this.name}:`, e.message);
      }
    }

    return { ...item };
  }

  async updateOne(id: string, updates: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    saveStoreToDisk();

    if (dbConnectionState.isConnectedToRealMongo && this.model) {
      try {
        const query = this.getQueryFilter(id);
        await this.model.updateOne(query, updates);
      } catch (e: any) {
        console.warn(`Error updating MongoDB ${this.name}:`, e.message);
      }
    }

    return { ...updated };
  }

  async deleteOne(id: string): Promise<boolean> {
    this.items.delete(id);
    saveStoreToDisk();

    if (dbConnectionState.isConnectedToRealMongo && this.model) {
      try {
        const query = this.getQueryFilter(id);
        await this.model.deleteOne(query);
      } catch (e: any) {
        console.warn(`Error deleting from MongoDB ${this.name}:`, e.message);
      }
    }
    return true;
  }

  async countDocuments(predicate?: (item: T) => boolean): Promise<number> {
    const all = await this.find(predicate);
    return all.length;
  }

  async clear(): Promise<void> {
    this.items.clear();
    saveStoreToDisk();

    if (dbConnectionState.isConnectedToRealMongo && this.model) {
      try {
        await this.model.deleteMany({});
      } catch (e) {
        // ignore
      }
    }
  }
}

// Database instance
export const db = {
  users: new MongoCollection<User>('users', [initialAdminUser], UserModel),
  employees: new MongoCollection<Employee>('employees', [], EmployeeModel),
  visitors: new MongoCollection<Visitor>('visitors', [], VisitorModel),
  visits: new MongoCollection<Visit>('visits', [], VisitModel),
  activityLogs: new MongoCollection<ActivityLog>('activity_logs', [], ActivityLogModel),

  models: {
    User: UserModel,
    Employee: EmployeeModel,
    Visitor: VisitorModel,
    Visit: VisitModel,
    ActivityLog: ActivityLogModel
  },

  async populateVisit(visit: Visit): Promise<PopulatedVisit> {
    const visitor = await this.visitors.findById(visit.visitorId) || {
      id: visit.visitorId,
      name: 'Unknown Visitor',
      phone: '',
      email: '',
      company: '',
      createdAt: visit.createdAt
    };

    const employee = await this.employees.findById(visit.employeeId) || {
      id: visit.employeeId,
      name: 'Unassigned Host',
      email: '',
      department: 'General',
      designation: 'Staff',
      isActive: true,
      maxPendingAllowed: 3
    };

    return {
      ...visit,
      visitor,
      employee,
      visitorName: visitor.name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone,
      visitorCompany: visitor.company,
      visitorIdType: visitor.idType,
      visitorIdNumber: visitor.idNumber,
      employeeName: employee.name,
      employeeDepartment: employee.department,
      employeeEmail: employee.email,
      notes: visit.remarks
    };
  },

  async getPopulatedVisits(predicate?: (v: Visit) => boolean): Promise<PopulatedVisit[]> {
    const visits = await this.visits.find(predicate);
    return Promise.all(visits.map(v => this.populateVisit(v)));
  },

  async generatePassNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.visits.countDocuments();
    const nextSeq = 100 + count + 1;
    return `VP-${year}-${String(nextSeq).padStart(4, '0')}`;
  },

  async logActivity(params: {
    visitId: string;
    action: ActivityLog['action'];
    performedBy: { id: string; name: string; role: UserRole; email?: string };
    details: string;
    remarks?: string;
    passNumber?: string;
    visitorName?: string;
  }): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      visitId: params.visitId,
      action: params.action,
      performedBy: params.performedBy,
      details: params.details,
      remarks: params.remarks,
      passNumber: params.passNumber,
      visitorName: params.visitorName,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    await this.activityLogs.insertOne(log);
    return log;
  }
};

// Synchronous JSON file backup manager for guaranteed data persistence across refreshes & restarts
function saveStoreToDisk() {
  try {
    const data = {
      users: Array.from(db.users.items.values()),
      employees: Array.from(db.employees.items.values()),
      visitors: Array.from(db.visitors.items.values()),
      visits: Array.from(db.visits.items.values()),
      activityLogs: Array.from(db.activityLogs.items.values()),
      savedAt: new Date().toISOString()
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed writing db_store.json to disk', e);
  }
}

function loadStoreFromDisk() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      
      if (Array.isArray(data.users) && data.users.length > 0) {
        db.users.items.clear();
        data.users.forEach((u: User) => db.users.items.set(u.id, u));
      }
      if (Array.isArray(data.employees)) {
        db.employees.items.clear();
        data.employees.forEach((e: Employee) => db.employees.items.set(e.id, e));
      }
      if (Array.isArray(data.visitors)) {
        db.visitors.items.clear();
        data.visitors.forEach((v: Visitor) => db.visitors.items.set(v.id, v));
      }
      if (Array.isArray(data.visits)) {
        db.visits.items.clear();
        data.visits.forEach((v: Visit) => db.visits.items.set(v.id, v));
      }
      if (Array.isArray(data.activityLogs)) {
        db.activityLogs.items.clear();
        data.activityLogs.forEach((a: ActivityLog) => db.activityLogs.items.set(a.id, a));
      }

      // Guarantee initial admin always exists
      if (!db.users.items.has(initialAdminUser.id)) {
        db.users.items.set(initialAdminUser.id, initialAdminUser);
      }

      console.log(`💾 Loaded persistent database from disk (${data.users?.length || 0} users, ${data.visits?.length || 0} visits)`);
    }
  } catch (e) {
    console.warn('Failed loading db_store.json from disk', e);
  }
}

// Load disk store immediately on module import
loadStoreFromDisk();

// Initialize and sync with MongoDB Atlas
export async function initMongoDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGO_URI;
  if (mongoUri) {
    try {
      console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });

      dbConnectionState.isConnectedToRealMongo = true;
      dbConnectionState.connectionUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
      dbConnectionState.dbName = mongoose.connection.name || 'passguard';
      dbConnectionState.lastConnectedAt = new Date().toISOString();
      dbConnectionState.lastError = '';
      console.log(`✅ Connected to MongoDB Atlas Database: ${dbConnectionState.dbName}`);

      // Seed initial Admin in MongoDB Atlas if missing
      const existingAdmin = await UserModel.findOne({ email: 'admin@company.com' });
      if (!existingAdmin) {
        await UserModel.create(initialAdminUser);
        console.log('✅ Admin seeded in MongoDB Atlas');
      } else {
        await UserModel.updateOne({ email: 'admin@company.com' }, { password: hashPassword('Admin@123'), role: 'ADMIN', isActive: true });
      }

      // Sync MongoDB collections to in-memory + disk
      const collectionsToSync = [
        { model: UserModel, target: db.users },
        { model: EmployeeModel, target: db.employees },
        { model: VisitorModel, target: db.visitors },
        { model: VisitModel, target: db.visits },
        { model: ActivityLogModel, target: db.activityLogs }
      ];

      for (const { model, target } of collectionsToSync) {
        const docs = await model.find({}).lean();
        for (const doc of docs) {
          const item = { ...doc, id: doc.id || (doc as any)._id?.toString() } as any;
          target.items.set(item.id, item);
        }
      }

      saveStoreToDisk();
    } catch (err: any) {
      console.warn(`⚠️ MongoDB Atlas: ${err.message}. Running on persistent local storage.`);
      dbConnectionState.isConnectedToRealMongo = false;
      dbConnectionState.connectionUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
      dbConnectionState.lastError = err.message || 'IP Whitelist required on MongoDB Atlas cluster';
    }
  }
}
