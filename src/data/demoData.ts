import { 
  Account, 
  Transaction, 
  Vehicle, 
  VehicleLog, 
  TodoNote, 
  Entity, 
  ExerciseLog,
  CalendarEvent,
  MenstrualLog,
  MenstrualCycleSettings,
  MenstrualPeriodRecord 
} from '../types';

export const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'demo-acc-1',
    name: 'HDFC Salary Account',
    type: 'BANK',
    balance: 64500,
    institution: 'HDFC Bank',
    accountNumber: '•••• 4812',
    color: '#3b82f6',
    updatedAt: Date.now()
  },
  {
    id: 'demo-acc-2',
    name: 'Physical Cash Wallet',
    type: 'CASH',
    balance: 3200,
    institution: 'Cash in Hand',
    color: '#10b981',
    updatedAt: Date.now()
  },
  {
    id: 'demo-acc-3',
    name: 'ICICI Coral Credit Card',
    type: 'CREDIT_CARD',
    balance: -8400,
    institution: 'ICICI Bank',
    accountNumber: '•••• 9021',
    color: '#f59e0b',
    updatedAt: Date.now()
  }
];

export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'demo-veh-1',
    name: 'Royal Enfield Hunter 350',
    vehicleNumber: 'TN 07 BZ 4591',
    type: 'BIKE',
    fuelType: 'PETROL',
    currentOdometer: 14820,
    insuranceExpiry: '2027-04-15',
    pucExpiry: '2026-11-20',
    insurancePolicyNumber: 'POL-RE-88214',
    color: '#f59e0b'
  },
  {
    id: 'demo-veh-2',
    name: 'Tata Nexon EV',
    vehicleNumber: 'TN 09 DX 7812',
    type: 'CAR',
    fuelType: 'ELECTRIC',
    currentOdometer: 28400,
    insuranceExpiry: '2027-02-10',
    pucExpiry: '2026-12-05',
    insurancePolicyNumber: 'POL-NEXON-4410',
    color: '#06b6d4'
  }
];

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const lastWeekStr = new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-txn-1',
    type: 'EXPENSE',
    amount: 1400,
    date: todayStr,
    timestamp: Date.now() - 3600000 * 3,
    description: 'Petrol 13.5L - Shell Fuel Station',
    category: 'Fuel',
    fromAccountId: 'demo-acc-1',
    vehicleId: 'demo-veh-1',
    isFuel: true,
    fuelLiters: 13.5,
    odometer: 14820
  },
  {
    id: 'demo-txn-2',
    type: 'EXPENSE',
    amount: 680,
    date: todayStr,
    timestamp: Date.now() - 3600000 * 8,
    description: 'Weekly Organic Groceries & Fruits',
    category: 'Groceries',
    fromAccountId: 'demo-acc-1'
  },
  {
    id: 'demo-txn-3',
    type: 'EXPENSE',
    amount: 280,
    date: yesterdayStr,
    timestamp: Date.now() - 86400000,
    description: 'South Indian Breakfast & Filter Coffee',
    category: 'Food & Dining',
    fromAccountId: 'demo-acc-2'
  },
  {
    id: 'demo-txn-4',
    type: 'INCOME',
    amount: 85000,
    date: lastWeekStr,
    timestamp: Date.now() - 86400000 * 7,
    description: 'Monthly Salary Credit',
    category: 'Salary',
    toAccountId: 'demo-acc-1'
  }
];

export const DEMO_VEHICLE_LOGS: VehicleLog[] = [
  {
    id: 'demo-log-1',
    vehicleId: 'demo-veh-1',
    type: 'FUEL',
    title: 'Fuel Fill-up (13.5L)',
    date: todayStr,
    timestamp: Date.now() - 3600000 * 3,
    odometer: 14820,
    cost: 1400,
    fuelLiters: 13.5
  },
  {
    id: 'demo-log-2',
    vehicleId: 'demo-veh-1',
    type: 'SERVICE',
    title: 'Periodic Maintenance & Chain Lube',
    date: lastWeekStr,
    timestamp: Date.now() - 86400000 * 7,
    odometer: 14000,
    cost: 2200,
    notes: 'Engine oil replacement (Motul 15W50) and air filter cleaned at RE service center.'
  }
];

export const DEMO_TODOS: TodoNote[] = [
  {
    id: 'demo-todo-1',
    title: 'Hunter 350 Checklist & Trip Prep',
    items: [
      { id: 'item-1', text: 'Check tyre pressure (32 psi front / 36 rear)', completed: true },
      { id: 'item-2', text: 'Clean and lube drive chain before highway run', completed: false },
      { id: 'item-3', text: 'Renew PUC emission test before next month', completed: false }
    ],
    color: 'amber',
    pinned: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'demo-todo-2',
    title: 'Monthly Financial Checklist',
    items: [
      { id: 'item-4', text: 'Pay credit card statement bill', completed: true },
      { id: 'item-5', text: 'Review mutual fund SIP auto-debits', completed: true },
      { id: 'item-6', text: 'Export CSV passbook ledger backup', completed: false }
    ],
    color: 'emerald',
    pinned: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now()
  }
];

export const DEMO_ENTITIES: Entity[] = [
  {
    id: 'demo-ent-1',
    name: 'Karthik S.',
    type: 'RECEIVABLE',
    amount: 2500,
    phone: '+91 98400 12345',
    notes: 'Dinner split from weekend get-together'
  }
];

export const DEMO_EXERCISE_LOGS: ExerciseLog[] = [
  {
    id: 'demo-ex-1',
    description: 'Morning brisk walk & jogging in park (45 mins, 260 kcal)',
    date: todayStr,
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4
  },
  {
    id: 'demo-ex-2',
    description: 'Push workout: Dumbbell bench press, shoulder press, triceps pushdown',
    date: yesterdayStr,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  }
];

export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'demo-cal-1',
    title: 'HDFC Credit Card Bill Due',
    date: todayStr,
    time: '10:00',
    type: 'FINANCE',
    category: 'Bill',
    color: 'amber',
    notes: 'Statement bill payment auto-clearing'
  },
  {
    id: 'demo-cal-2',
    title: 'Nexon EV Tyre Rotation & Alignment',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '11:30',
    type: 'VEHICLE',
    category: 'Service',
    color: 'sky',
    notes: 'Tata authorized service station booking'
  },
  {
    id: 'demo-cal-3',
    title: 'Gym Strength Training & Mobility',
    date: todayStr,
    time: '18:00',
    type: 'EXERCISE',
    category: 'Workout',
    color: 'emerald',
    notes: 'Squats, lunges, mobility drills'
  }
];

export const DEMO_MENSTRUAL_SETTINGS: MenstrualCycleSettings = {
  averageCycleLength: 28,
  averagePeriodDuration: 5,
  lutealPhaseLength: 14,
  lastPeriodStartDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
  privacyMode: false
};

export const DEMO_MENSTRUAL_PERIODS: MenstrualPeriodRecord[] = [
  {
    id: 'period-rec-1',
    startDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
    cycleLength: 28,
    durationDays: 5,
    notes: 'Normal flow, mild cramps on day 1'
  },
  {
    id: 'period-rec-2',
    startDate: new Date(Date.now() - 86400000 * 40).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000 * 36).toISOString().split('T')[0],
    cycleLength: 29,
    durationDays: 5,
    notes: 'On time, healthy cycle'
  }
];

export const DEMO_MENSTRUAL_LOGS: MenstrualLog[] = [
  {
    id: 'mlog-1',
    date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    isPeriodDay: true,
    flow: 'MEDIUM',
    cramps: 'MODERATE',
    crampLocations: ['Lower abdomen', 'Lower back'],
    moods: ['TIRED', 'SENSITIVE'],
    symptoms: ['Bloating', 'Fatigue'],
    waterIntakeGlasses: 8,
    sleepHours: 7.5,
    notes: 'Drank herbal tea and rested'
  },
  {
    id: 'mlog-2',
    date: new Date(Date.now() - 86400000 * 11).toISOString().split('T')[0],
    isPeriodDay: true,
    flow: 'HEAVY',
    cramps: 'MILD',
    moods: ['CALM'],
    symptoms: ['Bloating'],
    waterIntakeGlasses: 9,
    sleepHours: 8
  },
  {
    id: 'mlog-3',
    date: todayStr,
    isPeriodDay: false,
    flow: 'NONE',
    cramps: 'NONE',
    moods: ['HAPPY', 'ENERGETIC'],
    symptoms: [],
    mucus: 'WATERY',
    waterIntakeGlasses: 10,
    sleepHours: 8,
    notes: 'Feeling great, high energy in follicular phase'
  }
];

