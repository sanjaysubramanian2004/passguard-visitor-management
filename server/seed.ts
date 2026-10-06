import mongoose from 'mongoose';
import { initialAdminUser } from './db.ts';
import { UserModel } from './models/User.ts';
import { EmployeeModel } from './models/Employee.ts';
import { VisitorModel } from './models/Visitor.ts';
import { VisitModel } from './models/Visit.ts';
import { ActivityLogModel } from './models/ActivityLog.ts';

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/passguard';
  console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to database: ${mongoose.connection.name}`);

    console.log('🧹 Clearing existing collections...');
    await UserModel.deleteMany({});
    await EmployeeModel.deleteMany({});
    await VisitorModel.deleteMany({});
    await VisitModel.deleteMany({});
    await ActivityLogModel.deleteMany({});

    console.log('🌱 Seeding Admin User (admin@company.com / Admin@123)...');
    await UserModel.create(initialAdminUser);

    console.log('✨ Database seeding completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
