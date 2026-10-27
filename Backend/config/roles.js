// AccessDesk | role profiles (classroom demo keys only).
// All permission decisions live here, on the server. The browser never sees them.

export const DATABASE = 'mydb8';
export const TABLE = 'customers4';

// Column whitelist per field name. SQL text is built ONLY from these constants,
// never from user input.
export const FIELD_COLUMNS = {
  name: 'name',
  address: 'address'
};

// One approved request costs one credit. Set to false if you do not want
// the Admin usage check to spend a credit.
export const USAGE_COSTS_CREDIT = true;

// key -> profile
export const PROFILES = {
  'guest-key-111': {
    role: 'guest',
    allowedDatabases: [DATABASE],
    allowedTables: [TABLE],
    maxRows: 2,
    totalCredits: 4,
    actions: ['load'],
    fields: ['name']
  },
  'student-key-123': {
    role: 'student',
    allowedDatabases: [DATABASE],
    allowedTables: [TABLE],
    maxRows: 3,
    totalCredits: 8,
    actions: ['load', 'search'],
    fields: ['name', 'address']
  },
  'teacher-key-456': {
    role: 'teacher',
    allowedDatabases: [DATABASE],
    allowedTables: [TABLE],
    maxRows: 10,
    totalCredits: 30,
    actions: ['load', 'search'],
    fields: ['name', 'address']
  },
  'admin-key-789': {
    role: 'admin',
    allowedDatabases: [DATABASE],
    allowedTables: [TABLE],
    maxRows: 20,
    totalCredits: 50,
    actions: ['load', 'search', 'usage'],
    fields: ['name', 'address']
  }
};

// Credits are kept in memory (allowed by the brief). Restarting Node resets them.
// Kept apart from PROFILES so the profile objects stay read-only config.
export const creditsLeft = Object.fromEntries(
  Object.values(PROFILES).map((p) => [p.role, p.totalCredits])
);