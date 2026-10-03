/**
 * Unified Ticket Store
 * Operates seamlessly with MongoDB (Mongoose) when available,
 * or falls back transparently to In-Memory store for 100% demo reliability.
 */

const Complaint = require('../models/Complaint');
const SLAConfig = require('../models/SLAConfig');
const Department = require('../models/Department');

let isMongoConnected = false;
let inMemoryStore = [];
let ticketCounter = 1000;

function setMongoConnected(status) {
  isMongoConnected = status;
  console.log(
    `ℹ️ Data Store Mode: ${
      isMongoConnected
        ? 'MongoDB (Mongoose Connected)'
        : 'In-Memory Engine (Fallback Mode Active)'
    }`
  );
}

function getIsMongoConnected() {
  return isMongoConnected;
}

async function getNextTicketId() {
  if (isMongoConnected) {
    try {
      const count = await Complaint.countDocuments();
      return `CIV-${1001 + count}`;
    } catch (e) {
      ticketCounter++;
      return `CIV-${ticketCounter}`;
    }
  } else {
    ticketCounter++;
    return `CIV-${ticketCounter}`;
  }
}

async function createComplaint(data) {
  if (!data.ticketId) {
    data.ticketId = await getNextTicketId();
  }

  if (isMongoConnected) {
    const doc = new Complaint(data);
    const saved = await doc.save();
    return saved.toObject();
  } else {
    const doc = {
      _id:
        'mem_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substr(2, 4),
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date()
    };

    inMemoryStore.push(doc);
    return doc;
  }
}

async function getAllComplaints() {
  if (isMongoConnected) {
    const docs = await Complaint.find().sort({ createdAt: -1 });
    return docs.map((d) => d.toObject());
  } else {
    return [...inMemoryStore].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}

async function getComplaintsByUserId(userId) {
  if (isMongoConnected) {
    const docs = await Complaint.find({ userId }).sort({ createdAt: -1 });
    return docs.map((d) => d.toObject());
  } else {
    return inMemoryStore
      .filter((c) => c.userId && c.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}


async function getComplaintByTicketId(ticketId) {
  if (isMongoConnected) {
    const doc = await Complaint.findOne({ ticketId });
    return doc ? doc.toObject() : null;
  } else {
    return (
      inMemoryStore.find(
        (c) => c.ticketId.toUpperCase() === ticketId.toUpperCase()
      ) || null
    );
  }
}

async function updateComplaint(ticketId, updateData) {
  if (isMongoConnected) {
    const updated = await Complaint.findOneAndUpdate(
      { ticketId },
      { $set: updateData },
      { new: true }
    );

    return updated ? updated.toObject() : null;
  } else {
    const index = inMemoryStore.findIndex(
      (c) => c.ticketId.toUpperCase() === ticketId.toUpperCase()
    );

    if (index !== -1) {
      inMemoryStore[index] = {
        ...inMemoryStore[index],
        ...updateData,
        updatedAt: new Date()
      };

      return inMemoryStore[index];
    }

    return null;
  }
}

async function getStats() {
  const complaints = await getAllComplaints();
  const now = new Date();

  const total = complaints.length;
  const open = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgress = complaints.filter(
    (c) => c.status === 'IN_PROGRESS'
  ).length;
  const resolved = complaints.filter(
    (c) => c.status === 'RESOLVED'
  ).length;
  const escalated = complaints.filter(
    (c) => c.escalated || c.status === 'ESCALATED'
  ).length;
  const slaBreached = complaints.filter(
    (c) =>
      c.status !== 'RESOLVED' &&
      new Date(c.dueAt) < now
  ).length;
  const critical = complaints.filter(
    (c) => c.priority === 'CRITICAL'
  ).length;

  const departmentCounts = {};
  const categoryCounts = {};

  const priorityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  const statusCounts = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    ESCALATED: 0
  };

  complaints.forEach((c) => {
    departmentCounts[c.department] =
      (departmentCounts[c.department] || 0) + 1;

    categoryCounts[c.category] =
      (categoryCounts[c.category] || 0) + 1;

    if (priorityCounts[c.priority] !== undefined) {
      priorityCounts[c.priority]++;
    }

    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });

  return {
    total,
    open,
    inProgress,
    resolved,
    escalated,
    slaBreached,
    critical,
    departmentCounts,
    categoryCounts,
    priorityCounts,
    statusCounts
  };
}

/* Demo complaint data */

const seedTemplates = [
  // SANITATION - 8
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'HIGH',
    description:
      'Garbage has not been collected for three days.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'MEDIUM',
    description:
      'Garbage bins are overflowing near the residential area.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'HIGH',
    description:
      'Waste collection vehicle has not visited our street this week.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'MEDIUM',
    description:
      'Household waste is accumulating near the main entrance.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'LOW',
    description:
      'Garbage bin needs regular cleaning and maintenance.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'HIGH',
    description:
      'Uncollected waste is causing a bad smell in the neighborhood.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'MEDIUM',
    description:
      'Several garbage bags have been left beside the public road.'
  },
  {
    department: 'Sanitation',
    category: 'Garbage Collection',
    priority: 'LOW',
    description:
      'Community garbage collection schedule is not being followed.'
  },

  // WATER SUPPLY - 5
  {
    department: 'Water Supply',
    category: 'Water Supply',
    priority: 'CRITICAL',
    description:
      'There is no water supply in our area since yesterday.'
  },
  {
    department: 'Water Supply',
    category: 'Water Supply',
    priority: 'HIGH',
    description:
      'Water pressure has become extremely low in our locality.'
  },
  {
    department: 'Water Supply',
    category: 'Water Supply',
    priority: 'CRITICAL',
    description:
      'The entire residential area has been without water since morning.'
  },
  {
    department: 'Water Supply',
    category: 'Water Supply',
    priority: 'HIGH',
    description:
      'Water pipeline appears to be damaged near the main road.'
  },
  {
    department: 'Water Supply',
    category: 'Water Supply',
    priority: 'MEDIUM',
    description:
      'Water supply timings have become irregular in our area.'
  },

  // ROADS - 4
  {
    department: 'Roads & Infrastructure',
    category: 'Road Damage',
    priority: 'HIGH',
    description:
      'There is a dangerous pothole near the school.'
  },
  {
    department: 'Roads & Infrastructure',
    category: 'Road Damage',
    priority: 'MEDIUM',
    description:
      'Several potholes are making the road difficult to use.'
  },
  {
    department: 'Roads & Infrastructure',
    category: 'Road Damage',
    priority: 'HIGH',
    description:
      'Road surface is damaged after recent heavy rainfall.'
  },
  {
    department: 'Roads & Infrastructure',
    category: 'Road Damage',
    priority: 'LOW',
    description:
      'Footpath tiles are broken near the market area.'
  },

  // STREET LIGHTING - 3
  {
    department: 'Street Lighting',
    category: 'Streetlight Issue',
    priority: 'HIGH',
    description:
      'The streetlight near our society has not been working for a week.'
  },
  {
    department: 'Street Lighting',
    category: 'Streetlight Issue',
    priority: 'MEDIUM',
    description:
      'Multiple streetlights are not working on the main road.'
  },
  {
    department: 'Street Lighting',
    category: 'Streetlight Issue',
    priority: 'LOW',
    description:
      'A streetlight is flickering continuously near the bus stop.'
  },

  // DRAINAGE - 5
  {
    department: 'Drainage',
    category: 'Drainage Issue',
    priority: 'CRITICAL',
    description:
      'The drainage near our road is blocked and overflowing.'
  },
  {
    department: 'Drainage',
    category: 'Drainage Issue',
    priority: 'HIGH',
    description:
      'Drainage water is overflowing onto the public road.'
  },
  {
    department: 'Drainage',
    category: 'Drainage Issue',
    priority: 'HIGH',
    description:
      'Blocked drainage is causing stagnant water near houses.'
  },
  {
    department: 'Drainage',
    category: 'Drainage Issue',
    priority: 'MEDIUM',
    description:
      'Drain cover is damaged and needs immediate replacement.'
  },
  {
    department: 'Drainage',
    category: 'Drainage Issue',
    priority: 'LOW',
    description:
      'Drain cleaning is required near the community park.'
  }
];

const citizenNames = [
  'Aarav Sharma',
  'Priya Patel',
  'Rohan Gupta',
  'Ananya Verma',
  'Vikram Singh',
  'Neha Joshi',
  'Rahul Mehta',
  'Sneha Kulkarni',
  'Aditya Shah',
  'Kavya Deshmukh'
];

const SEED_COMPLAINTS = seedTemplates.map((item, index) => {
  const slaHours =
    item.priority === 'CRITICAL'
      ? 6
      : item.priority === 'HIGH'
        ? 24
        : 48;

  const isResolved = index === 7 || index === 18;
  const isEscalated = index === 1 || index === 23;
  const isInProgress =
    !isResolved &&
    !isEscalated &&
    (index === 2 || index === 10 || index === 15 || index === 20);

  const status = isResolved
    ? 'RESOLVED'
    : isEscalated
      ? 'ESCALATED'
      : isInProgress
        ? 'IN_PROGRESS'
        : 'OPEN';

  return {
    ticketId: `CIV-${1001 + index}`,

    citizenName:
      citizenNames[index % citizenNames.length],

    citizenPhone: `+91 98${String(
      10000000 + index * 1379
    ).slice(0, 8)}`,

    citizenEmail:
      `citizen${index + 1}@example.com`,

    description: item.description,

    category: item.category,

    department: item.department,

    priority: item.priority,

    status,

    slaHours,

    createdAt: new Date(
      Date.now() - (index + 1) * 60 * 60 * 1000
    ),

    dueAt: new Date(
      Date.now() +
        (slaHours - (index === 1 || index === 23 ? 8 : 0)) *
          60 *
          60 *
          1000
    ),

    resolvedAt: isResolved ? new Date() : null,

    escalated: isEscalated,

    escalationLevel: isEscalated ? 1 : 0,

    escalationReason: isEscalated
      ? 'SLA breached - Escalated to Level 1 (Department Officer)'
      : '',

    reminderSent: isEscalated,

    aiConfidence: Number(
      (0.91 + (index % 8) * 0.01).toFixed(2)
    ),

    aiReasoning:
      `Complaint classified as ${item.category} and routed to ${item.department}.`
  };
});

async function seedComplaints() {
  if (isMongoConnected) {
    await Complaint.deleteMany({});
    await Complaint.insertMany(SEED_COMPLAINTS);
  } else {
    inMemoryStore = JSON.parse(
      JSON.stringify(SEED_COMPLAINTS)
    );

    ticketCounter = 1000 + SEED_COMPLAINTS.length;
  }

  return {
    message: 'Demo complaints seeded successfully',
    count: SEED_COMPLAINTS.length
  };
}

/* Auto seed in-memory store initially */

if (inMemoryStore.length === 0) {
  inMemoryStore = JSON.parse(
    JSON.stringify(SEED_COMPLAINTS)
  );

  ticketCounter = 1000 + SEED_COMPLAINTS.length;
}

module.exports = {
  setMongoConnected,
  getIsMongoConnected,
  createComplaint,
  getAllComplaints,
  getComplaintsByUserId,
  getComplaintByTicketId,
  updateComplaint,
  getStats,
  seedComplaints
};