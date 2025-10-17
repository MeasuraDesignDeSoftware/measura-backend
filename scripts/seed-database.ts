/**
 * Database Seed Script
 * Populates the measura-design-patterns database with test data
 *
 * Usage: npx ts-node scripts/seed-database.ts
 */

import { config } from 'dotenv';
import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

// Simple schema definitions for seeding
const UserSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  organizationId: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date,
});

const OrganizationSchema = new mongoose.Schema({
  name: String,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
});

const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  status: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date,
});

const EstimateSchema = new mongoose.Schema({
  name: String,
  description: String,
  countType: String,
  countingScope: String,
  applicationBoundary: String,
  projectId: mongoose.Schema.Types.ObjectId,
  organizationId: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.ObjectId,
  status: String,
  teamSize: Number,
  hourlyRateBRL: Number,
  averageDailyWorkingHours: Number,
  productivityFactor: Number,
  generalSystemCharacteristics: [Number],
  influenceDegree: Number,
  valueAdjustmentFactor: Number,
  unadjustedFunctionPoints: Number,
  adjustedFunctionPoints: Number,
  estimatedEffortHours: Number,
  internalLogicalFiles: [mongoose.Schema.Types.ObjectId],
  externalInterfaceFiles: [mongoose.Schema.Types.ObjectId],
  externalInputs: [mongoose.Schema.Types.ObjectId],
  externalOutputs: [mongoose.Schema.Types.ObjectId],
  externalQueries: [mongoose.Schema.Types.ObjectId],
  createdAt: Date,
  updatedAt: Date,
});

const ALISchema = new mongoose.Schema({
  name: String,
  description: String,
  estimateId: mongoose.Schema.Types.ObjectId,
  tr: Number,
  det: Number,
  complexity: String,
  functionPoints: Number,
  createdAt: Date,
});

const AIESchema = new mongoose.Schema({
  name: String,
  description: String,
  estimateId: mongoose.Schema.Types.ObjectId,
  tr: Number,
  det: Number,
  complexity: String,
  functionPoints: Number,
  createdAt: Date,
});

const EISchema = new mongoose.Schema({
  name: String,
  description: String,
  estimateId: mongoose.Schema.Types.ObjectId,
  ftr: Number,
  det: Number,
  complexity: String,
  functionPoints: Number,
  createdAt: Date,
});

const EOSchema = new mongoose.Schema({
  name: String,
  description: String,
  estimateId: mongoose.Schema.Types.ObjectId,
  ftr: Number,
  det: Number,
  complexity: String,
  functionPoints: Number,
  createdAt: Date,
});

const EQSchema = new mongoose.Schema({
  name: String,
  description: String,
  estimateId: mongoose.Schema.Types.ObjectId,
  ftr: Number,
  det: Number,
  complexity: String,
  functionPoints: Number,
  createdAt: Date,
});

// Models
const User = mongoose.model('User', UserSchema, 'users');
const Organization = mongoose.model('Organization', OrganizationSchema, 'organizations');
const Project = mongoose.model('Project', ProjectSchema, 'projects');
const Estimate = mongoose.model('Estimate', EstimateSchema, 'estimates');
const ALI = mongoose.model('ALI', ALISchema, 'alis');
const AIE = mongoose.model('AIE', AIESchema, 'aies');
const EI = mongoose.model('EI', EISchema, 'eis');
const EO = mongoose.model('EO', EOSchema, 'eos');
const EQ = mongoose.model('EQ', EQSchema, 'eqs');

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Project.deleteMany({});
  await Estimate.deleteMany({});
  await ALI.deleteMany({});
  await AIE.deleteMany({});
  await EI.deleteMany({});
  await EO.deleteMany({});
  await EQ.deleteMany({});
  console.log('✅ Database cleared');
}

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB:', mongoUri.split('@')[1]?.split('?')[0]);

    await clearDatabase();

    // 1. Create User
    console.log('\n👤 Creating user...');
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const user = await User.create({
      email: 'test@measura.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ User created:', user.email, '(password: Test@123)');

    // 2. Create Organization
    console.log('\n🏢 Creating organization...');
    const organization = await Organization.create({
      name: 'Design Patterns Test Org',
      description: 'Organization for testing GoF design patterns implementation',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Organization created:', organization.name);

    // Update user with organizationId
    await User.findByIdAndUpdate(user._id, { organizationId: organization._id });

    // 3. Create Projects
    console.log('\n📁 Creating projects...');
    const project1 = await Project.create({
      name: 'E-Commerce Platform',
      description: 'Online shopping platform with payment integration',
      organizationId: organization._id,
      status: 'ACTIVE',
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const project2 = await Project.create({
      name: 'Inventory Management System',
      description: 'Real-time inventory tracking and warehouse management',
      organizationId: organization._id,
      status: 'ACTIVE',
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Projects created:', project1.name, '|', project2.name);

    // 4. Create Estimates with FPA Components
    console.log('\n📊 Creating estimates with FPA components...');

    // Estimate 1: Development Project - Full FPA
    const estimate1 = await createEstimateWithComponents(
      {
        name: 'E-Commerce MVP Development',
        description: 'Initial development of e-commerce platform',
        countType: 'DEVELOPMENT_PROJECT',
        countingScope: 'Product Catalog + Shopping Cart + Checkout',
        applicationBoundary: 'E-commerce web application',
        projectId: project1._id,
        organizationId: organization._id,
        createdBy: user._id,
        status: 'DRAFT',
        teamSize: 5,
        hourlyRateBRL: 150,
        averageDailyWorkingHours: 8,
        productivityFactor: 12,
        generalSystemCharacteristics: [3, 4, 3, 5, 4, 3, 4, 3, 4, 5, 3, 4, 3, 2], // 14 GSC values
      },
      {
        alis: [
          { name: 'Products', description: 'Product catalog master file', tr: 2, det: 20 },
          { name: 'Customers', description: 'Customer master file', tr: 3, det: 25 },
          { name: 'Orders', description: 'Order tracking file', tr: 4, det: 35 },
        ],
        aies: [
          { name: 'Payment Gateway', description: 'External payment processing data', tr: 2, det: 15 },
        ],
        eis: [
          { name: 'Create Product', description: 'Add new product to catalog', ftr: 2, det: 12 },
          { name: 'Place Order', description: 'Submit customer order', ftr: 3, det: 20 },
          { name: 'Update Inventory', description: 'Modify stock levels', ftr: 1, det: 8 },
        ],
        eos: [
          { name: 'Invoice Report', description: 'Generate customer invoice', ftr: 2, det: 18 },
          { name: 'Sales Dashboard', description: 'Real-time sales analytics', ftr: 3, det: 25 },
        ],
        eqs: [
          { name: 'Search Products', description: 'Product search query', ftr: 2, det: 10 },
          { name: 'View Order Status', description: 'Track order details', ftr: 1, det: 8 },
        ],
      }
    );
    console.log('✅ Estimate 1 created:', estimate1.name, `(${estimate1.adjustedFunctionPoints} PFA)`);

    // Estimate 2: Enhancement Project
    const estimate2 = await createEstimateWithComponents(
      {
        name: 'Add Recommendation Engine',
        description: 'ML-based product recommendation feature',
        countType: 'ENHANCEMENT_PROJECT',
        countingScope: 'Recommendation algorithm + User preference tracking',
        applicationBoundary: 'E-commerce platform enhancement',
        projectId: project1._id,
        organizationId: organization._id,
        createdBy: user._id,
        status: 'IN_PROGRESS',
        teamSize: 3,
        hourlyRateBRL: 180,
        averageDailyWorkingHours: 8,
        productivityFactor: 10,
        generalSystemCharacteristics: [4, 5, 4, 5, 5, 4, 5, 4, 4, 5, 4, 5, 4, 3],
      },
      {
        alis: [
          { name: 'User Preferences', description: 'User behavior and preferences', tr: 3, det: 28 },
        ],
        aies: [],
        eis: [
          { name: 'Track User Activity', description: 'Log user interactions', ftr: 2, det: 15 },
        ],
        eos: [
          { name: 'Recommendation List', description: 'Personalized product suggestions', ftr: 3, det: 22 },
        ],
        eqs: [
          { name: 'Get Recommendations', description: 'Fetch user recommendations', ftr: 2, det: 12 },
        ],
      }
    );
    console.log('✅ Estimate 2 created:', estimate2.name, `(${estimate2.adjustedFunctionPoints} PFA)`);

    // Estimate 3: Inventory System - Development
    const estimate3 = await createEstimateWithComponents(
      {
        name: 'Inventory Management Core',
        description: 'Warehouse and stock tracking system',
        countType: 'DEVELOPMENT_PROJECT',
        countingScope: 'Inventory tracking + Warehouse management',
        applicationBoundary: 'Standalone inventory management system',
        projectId: project2._id,
        organizationId: organization._id,
        createdBy: user._id,
        status: 'FINALIZED',
        teamSize: 4,
        hourlyRateBRL: 140,
        averageDailyWorkingHours: 8,
        productivityFactor: 15,
        generalSystemCharacteristics: [3, 3, 3, 4, 3, 3, 3, 3, 4, 4, 3, 3, 3, 2],
      },
      {
        alis: [
          { name: 'Inventory Items', description: 'Item master data', tr: 2, det: 18 },
          { name: 'Warehouses', description: 'Warehouse locations', tr: 2, det: 12 },
          { name: 'Stock Movements', description: 'Inventory transactions', tr: 4, det: 30 },
        ],
        aies: [],
        eis: [
          { name: 'Register Item', description: 'Add new inventory item', ftr: 2, det: 15 },
          { name: 'Record Movement', description: 'Log stock transfer', ftr: 3, det: 18 },
        ],
        eos: [
          { name: 'Stock Report', description: 'Current inventory levels', ftr: 2, det: 20 },
        ],
        eqs: [
          { name: 'Check Availability', description: 'Query item stock', ftr: 1, det: 6 },
          { name: 'Search Items', description: 'Find inventory items', ftr: 2, det: 10 },
        ],
      }
    );
    console.log('✅ Estimate 3 created:', estimate3.name, `(${estimate3.adjustedFunctionPoints} PFA)`);

    // Estimate 4: Simple estimate without GSC (FA = 1.0)
    const estimate4 = await createEstimateWithComponents(
      {
        name: 'User Authentication Module',
        description: 'Basic login and user management',
        countType: 'APPLICATION_COUNTING',
        countingScope: 'Authentication and authorization',
        applicationBoundary: 'Auth microservice',
        projectId: project1._id,
        organizationId: organization._id,
        createdBy: user._id,
        status: 'DRAFT',
        teamSize: 2,
        hourlyRateBRL: 120,
        averageDailyWorkingHours: 6,
        productivityFactor: 10,
        generalSystemCharacteristics: [], // No GSC = FA = 1.0
      },
      {
        alis: [
          { name: 'Users', description: 'User accounts', tr: 2, det: 15 },
        ],
        aies: [],
        eis: [
          { name: 'Register User', description: 'User registration', ftr: 1, det: 10 },
          { name: 'Login', description: 'User authentication', ftr: 1, det: 8 },
        ],
        eos: [],
        eqs: [
          { name: 'Get User Profile', description: 'Retrieve user data', ftr: 1, det: 12 },
        ],
      }
    );
    console.log('✅ Estimate 4 created:', estimate4.name, `(${estimate4.adjustedFunctionPoints} PFA)`);

    // Estimate 5: Complex system with high GSC
    const estimate5 = await createEstimateWithComponents(
      {
        name: 'Real-time Analytics Dashboard',
        description: 'Complex data processing and visualization',
        countType: 'DEVELOPMENT_PROJECT',
        countingScope: 'Real-time data pipeline + Interactive dashboards',
        applicationBoundary: 'Analytics platform',
        projectId: project1._id,
        organizationId: organization._id,
        createdBy: user._id,
        status: 'IN_PROGRESS',
        teamSize: 8,
        hourlyRateBRL: 200,
        averageDailyWorkingHours: 8,
        productivityFactor: 18,
        generalSystemCharacteristics: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // Max complexity
      },
      {
        alis: [
          { name: 'Analytics Data', description: 'Aggregated metrics', tr: 5, det: 50 },
          { name: 'User Sessions', description: 'Session tracking', tr: 4, det: 40 },
        ],
        aies: [
          { name: 'External BI Tools', description: 'Third-party BI integration', tr: 3, det: 30 },
        ],
        eis: [
          { name: 'Configure Dashboard', description: 'Customize analytics view', ftr: 4, det: 35 },
          { name: 'Set Alerts', description: 'Define metric thresholds', ftr: 3, det: 20 },
        ],
        eos: [
          { name: 'Real-time Chart', description: 'Live data visualization', ftr: 4, det: 40 },
          { name: 'Export Report', description: 'Generate PDF/Excel report', ftr: 3, det: 25 },
        ],
        eqs: [
          { name: 'Filter Metrics', description: 'Query filtered data', ftr: 3, det: 18 },
          { name: 'Drill Down', description: 'Detailed metric analysis', ftr: 4, det: 30 },
        ],
      }
    );
    console.log('✅ Estimate 5 created:', estimate5.name, `(${estimate5.adjustedFunctionPoints} PFA)`);

    // Summary
    console.log('\n📈 Seed Summary:');
    console.log('  👤 Users:', 1);
    console.log('  🏢 Organizations:', 1);
    console.log('  📁 Projects:', 2);
    console.log('  📊 Estimates:', 5);
    const totalComponents = await Promise.all([
      ALI.countDocuments(),
      AIE.countDocuments(),
      EI.countDocuments(),
      EO.countDocuments(),
      EQ.countDocuments(),
    ]);
    console.log('  🔧 FPA Components:', {
      ALI: totalComponents[0],
      AIE: totalComponents[1],
      EI: totalComponents[2],
      EO: totalComponents[3],
      EQ: totalComponents[4],
      Total: totalComponents.reduce((a, b) => a + b, 0),
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('  Email: test@measura.com');
    console.log('  Password: Test@123');
    console.log('  Role: ADMIN');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function createEstimateWithComponents(
  estimateData: any,
  components: {
    alis: Array<{ name: string; description: string; tr: number; det: number }>;
    aies: Array<{ name: string; description: string; tr: number; det: number }>;
    eis: Array<{ name: string; description: string; ftr: number; det: number }>;
    eos: Array<{ name: string; description: string; ftr: number; det: number }>;
    eqs: Array<{ name: string; description: string; ftr: number; det: number }>;
  }
) {
  // Create FPA components
  const alis = await Promise.all(
    components.alis.map(ali => ALI.create({
      ...ali,
      estimateId: new Types.ObjectId(), // Temporary, will update
      complexity: calculateComplexity('DATA', ali.tr, ali.det),
      functionPoints: calculateFunctionPoints('DATA', ali.tr, ali.det),
      createdAt: new Date(),
    }))
  );

  const aies = await Promise.all(
    components.aies.map(aie => AIE.create({
      ...aie,
      estimateId: new Types.ObjectId(),
      complexity: calculateComplexity('DATA', aie.tr, aie.det),
      functionPoints: calculateFunctionPoints('DATA', aie.tr, aie.det),
      createdAt: new Date(),
    }))
  );

  const eis = await Promise.all(
    components.eis.map(ei => EI.create({
      ...ei,
      estimateId: new Types.ObjectId(),
      complexity: calculateComplexity('EI', ei.ftr, ei.det),
      functionPoints: calculateFunctionPoints('EI', ei.ftr, ei.det),
      createdAt: new Date(),
    }))
  );

  const eos = await Promise.all(
    components.eos.map(eo => EO.create({
      ...eo,
      estimateId: new Types.ObjectId(),
      complexity: calculateComplexity('EO', eo.ftr, eo.det),
      functionPoints: calculateFunctionPoints('EO', eo.ftr, eo.det),
      createdAt: new Date(),
    }))
  );

  const eqs = await Promise.all(
    components.eqs.map(eq => EQ.create({
      ...eq,
      estimateId: new Types.ObjectId(),
      complexity: calculateComplexity('EQ', eq.ftr, eq.det),
      functionPoints: calculateFunctionPoints('EQ', eq.ftr, eq.det),
      createdAt: new Date(),
    }))
  );

  // Calculate totals
  const allComponents = [...alis, ...aies, ...eis, ...eos, ...eqs];
  const pfna = allComponents.reduce((sum, c) => sum + (c.functionPoints || 0), 0);

  // Calculate GSC metrics
  const gsc = estimateData.generalSystemCharacteristics || [];
  const ni = gsc.reduce((sum: number, val: number) => sum + val, 0);
  const fa = gsc.length === 14 ? 0.65 + (ni * 0.01) : 1.0;
  const pfa = pfna * fa;
  const effortHours = pfa * estimateData.productivityFactor;

  // Create estimate
  const estimate = await Estimate.create({
    ...estimateData,
    influenceDegree: ni,
    valueAdjustmentFactor: fa,
    unadjustedFunctionPoints: pfna,
    adjustedFunctionPoints: pfa,
    estimatedEffortHours: effortHours,
    internalLogicalFiles: alis.map(a => a._id),
    externalInterfaceFiles: aies.map(a => a._id),
    externalInputs: eis.map(e => e._id),
    externalOutputs: eos.map(e => e._id),
    externalQueries: eqs.map(e => e._id),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update component estimateIds
  await Promise.all([
    ...alis.map(a => ALI.findByIdAndUpdate(a._id, { estimateId: estimate._id })),
    ...aies.map(a => AIE.findByIdAndUpdate(a._id, { estimateId: estimate._id })),
    ...eis.map(e => EI.findByIdAndUpdate(e._id, { estimateId: estimate._id })),
    ...eos.map(e => EO.findByIdAndUpdate(e._id, { estimateId: estimate._id })),
    ...eqs.map(e => EQ.findByIdAndUpdate(e._id, { estimateId: estimate._id })),
  ]);

  return estimate;
}

function calculateComplexity(type: string, param1: number, param2: number): string {
  if (type === 'DATA') {
    // ALI/AIE complexity matrix
    if (param2 <= 19) {
      return param1 === 1 ? 'LOW' : 'LOW';
    } else if (param2 <= 50) {
      return param1 <= 1 ? 'LOW' : (param1 <= 5 ? 'AVERAGE' : 'HIGH');
    } else {
      return param1 <= 1 ? 'AVERAGE' : 'HIGH';
    }
  } else {
    // EI/EO/EQ complexity matrix
    if (param2 <= 4) {
      return param1 <= 1 ? 'LOW' : (param1 <= 2 ? 'LOW' : 'AVERAGE');
    } else if (param2 <= 15) {
      return param1 <= 1 ? 'LOW' : (param1 <= 2 ? 'AVERAGE' : 'HIGH');
    } else {
      return param1 <= 1 ? 'AVERAGE' : 'HIGH';
    }
  }
}

function calculateFunctionPoints(type: string, param1: number, param2: number): number {
  const complexity = calculateComplexity(type, param1, param2);

  if (type === 'DATA') {
    // ALI/AIE
    return complexity === 'LOW' ? 7 : (complexity === 'AVERAGE' ? 10 : 15);
  } else if (type === 'EI') {
    return complexity === 'LOW' ? 3 : (complexity === 'AVERAGE' ? 4 : 6);
  } else if (type === 'EO') {
    return complexity === 'LOW' ? 4 : (complexity === 'AVERAGE' ? 5 : 7);
  } else { // EQ
    return complexity === 'LOW' ? 3 : (complexity === 'AVERAGE' ? 4 : 6);
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
