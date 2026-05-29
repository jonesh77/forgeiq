import { Db, MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.DB_URI;
const dbName = process.env.DB_NAME || 'forgeiq';

if (!uri) {
  throw new Error(
    'Missing environment variable DB_URI. Create a .env.local file in the frontend directory based on .env.example',
  );
}

type Cached = { client: MongoClient; db: Db };
let cached: Cached | null = null;
let promise: Promise<MongoClient> | null = null;

// Cool-down: after a failed connection attempt, refuse to retry for
// COOLDOWN_MS so we don't hammer Atlas with TLS-alert retries on every
// page render while the cluster is paused / IP not whitelisted.
const COOLDOWN_MS = 30_000;
let failedAt = 0;
let lastError: string | null = null;

export async function connectToDatabase(): Promise<Cached> {
  if (cached) return cached;

  // Inside cool-down? Fail fast with the previous error.
  if (failedAt && Date.now() - failedAt < COOLDOWN_MS) {
    throw new Error(
      `MongoDB unavailable (last error: ${lastError}). Retry in ${Math.ceil((COOLDOWN_MS - (Date.now() - failedAt)) / 1000)}s.`,
    );
  }

  if (!promise) {
    console.log('[db] Connecting to MongoDB...');
    promise = MongoClient.connect(uri!, {
      // strict:false tolerates older Atlas TLS handshakes that fail with strict:true
      serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
    }).catch((err) => {
      promise = null;
      failedAt = Date.now();
      lastError = err?.message || 'unknown';
      console.error('[db] MongoDB connection failed:', lastError);
      throw new Error(
        'MongoDB connection failed. The cluster may be paused or your IP is not whitelisted.',
      );
    });
  }

  const client = await promise;
  const db = client.db(dbName);
  cached = { client, db };
  failedAt = 0;
  lastError = null;
  console.log('[db] MongoDB connection established.');
  return cached;
}

export async function giveClient(): Promise<MongoClient> {
  const { client } = await connectToDatabase();
  return client;
}

export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

/** Returns true if MongoDB looks reachable right now (no recent failure). */
export function isDbHealthy(): boolean {
  if (cached) return true;
  if (failedAt && Date.now() - failedAt < COOLDOWN_MS) return false;
  return true;
}
