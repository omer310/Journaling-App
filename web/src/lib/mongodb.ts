import { MongoClient, type Collection, type Db } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

export interface SessionDocument {
  id: string;
  user_id: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  active: boolean;
  created_at: string;
  last_activity: string;
  ended_at?: string;
  logout_reason?: string;
}

export interface JournalEntryDocument {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  user_id: string;
  encryption_user_id?: string;
  source: 'web' | 'mobile';
  last_modified: string;
  mood?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityEventDocument {
  id: string;
  user_id?: string | null;
  email?: string | null;
  event_type: string;
  details?: Record<string, unknown>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  resolved: boolean;
  created_at: string;
}

export interface SecurityAlertDocument {
  id: string;
  event_id: string;
  user_id?: string | null;
  email?: string | null;
  alert_type: string;
  details?: Record<string, unknown>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  resolved: boolean;
}

let indexesPromise: Promise<void> | undefined;

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }
  return uri;
}

export async function getMongoClient() {
  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = new MongoClient(getMongoUri(), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    }).connect();
  }
  return global.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || 'soul_pages');
}

export async function getCollections() {
  const db = await getDb();
  const collections = {
    journalEntries: db.collection<JournalEntryDocument>('journal_entries'),
    userSessions: db.collection<SessionDocument>('user_sessions'),
    securityEvents: db.collection<SecurityEventDocument>('security_events'),
    securityAlerts: db.collection<SecurityAlertDocument>('security_alerts'),
  };

  await ensureIndexes(collections);
  return collections;
}

async function ensureIndexes(collections: {
  journalEntries: Collection<JournalEntryDocument>;
  userSessions: Collection<SessionDocument>;
  securityEvents: Collection<SecurityEventDocument>;
  securityAlerts: Collection<SecurityAlertDocument>;
}) {
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      collections.userSessions.createIndex({ session_id: 1 }),
      collections.userSessions.createIndex({ user_id: 1, active: 1 }),
      collections.journalEntries.createIndex({ id: 1 }, { unique: true }),
      collections.journalEntries.createIndex({ user_id: 1, last_modified: -1 }),
      collections.journalEntries.createIndex({ user_id: 1, date: -1 }),
      collections.journalEntries.createIndex({ user_id: 1, tags: 1 }),
      collections.securityEvents.createIndex({ user_id: 1 }),
      collections.securityEvents.createIndex({ event_type: 1 }),
      collections.securityEvents.createIndex({ severity: 1 }),
      collections.securityEvents.createIndex({ timestamp: -1 }),
      collections.securityAlerts.createIndex({ user_id: 1 }),
      collections.securityAlerts.createIndex({ severity: 1 }),
    ]).then(() => undefined);
  }

  return indexesPromise;
}
