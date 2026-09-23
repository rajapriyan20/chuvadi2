import { Account, Transaction, Vehicle, VehicleLog, TodoNote, Entity, ExerciseLog } from '../types';

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
