import mongoose, { ConnectOptions } from 'mongoose';
import { MongoClient, MongoClientOptions } from 'mongodb';

// MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Connection pool configuration
const connectionOptions: ConnectOptions = {
  // Connection Pool Settings
  minPoolSize: 10, // Minimum number of connections in the pool
  maxPoolSize: 100, // Maximum number of connections in the pool
  maxIdleTimeMS: 30000, // Max time a connection can be idle before being closed (30s)
  waitQueueTimeoutMS: 5000, // Max time to wait for a connection from the pool (5s)

  // Socket Settings
  socketTimeoutMS: 45000, // How long to wait for responses from the server (45s)
  connectTimeoutMS: 10000, // How long to wait for initial connection (10s)
  serverSelectionTimeoutMS: 5000, // How long to wait for server selection (5s)

  // Heartbeat and Monitoring
  heartbeatFrequencyMS: 10000, // How often to check server status (10s)

  // Compression
  compressors: ['snappy', 'zlib'] as any,
  zlibCompressionLevel: 4,

  // Write Concern for consistency
  writeConcern: {
    w: 'majority',
    j: true, // Wait for journal write
    wtimeout: 5000 // Timeout for write concern (5s)
  },

  // Read Preference
  readPreference: 'primaryPreferred' as any,
  readConcern: { level: 'majority' },

  // Retry Settings
  retryWrites: true,
  retryReads: true,

  // Other settings
  bufferCommands: false, // Disable buffering when disconnected
  autoIndex: process.env.NODE_ENV !== 'production', // Auto-create indexes only in dev
  autoCreate: process.env.NODE_ENV !== 'production', // Auto-create collections only in dev
};

// Native MongoDB client options for advanced operations
export const mongoClientOptions: MongoClientOptions = {
  minPoolSize: 10,
  maxPoolSize: 100,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  compressors: ['snappy', 'zlib'],
  zlibCompressionLevel: 4,
  retryWrites: true,
  retryReads: true,
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 5000
  },
  readPreference: 'primaryPreferred',
  readConcern: { level: 'majority' },
};

// Connection state interface
interface ConnectionState {
  isConnected: boolean;
  connectionTime?: Date;
  lastError?: Error;
  reconnectAttempts: number;
}

// Global connection cache for serverless environments
declare global {
  var mongooseOptimized: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
    state: ConnectionState;
    client?: MongoClient;
  };
}

let cached = global.mongooseOptimized || {
  conn: null,
  promise: null,
  state: {
    isConnected: false,
    reconnectAttempts: 0
  }
};

if (!global.mongooseOptimized) {
  global.mongooseOptimized = cached;
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  connections: {
    current: number;
    available: number;
    max: number;
  };
  details?: any;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    if (!cached.conn) {
      throw new Error('Database not connected');
    }

    // Ping the database
    await cached.conn.connection.db?.admin().ping();

    // Get connection pool stats
    const client = cached.conn.connection.getClient() as any;
    const poolStats = client.topology?.s?.pool;

    const responseTime = Date.now() - startTime;

    return {
      isHealthy: true,
      responseTime,
      connections: {
        current: poolStats?.totalConnectionCount || 0,
        available: poolStats?.availableConnectionCount || 0,
        max: connectionOptions.maxPoolSize || 100
      },
      details: {
        readyState: cached.conn.connection.readyState,
        host: cached.conn.connection.host,
        name: cached.conn.connection.name
      }
    };
  } catch (error) {
    return {
      isHealthy: false,
      responseTime: Date.now() - startTime,
      connections: {
        current: 0,
        available: 0,
        max: connectionOptions.maxPoolSize || 100
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Connection event handlers
function setupEventHandlers(connection: mongoose.Connection) {
  connection.on('connected', () => {
    cached.state.isConnected = true;
    cached.state.connectionTime = new Date();
    cached.state.reconnectAttempts = 0;
    console.log('[MongoDB] Connected successfully');
  });

  connection.on('error', (error) => {
    cached.state.lastError = error;
    console.error('[MongoDB] Connection error:', error);
  });

  connection.on('disconnected', () => {
    cached.state.isConnected = false;
    console.warn('[MongoDB] Disconnected from database');
  });

  connection.on('reconnected', () => {
    cached.state.isConnected = true;
    cached.state.reconnectAttempts++;
    console.log('[MongoDB] Reconnected successfully');
  });

  // Monitor slow queries in development
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName: string, method: string, ...args: any[]) => {
      console.log(`[MongoDB] ${collectionName}.${method}`, ...args);
    });
  }
}

// Optimized database connection function
async function dbConnect(): Promise<mongoose.Mongoose> {
  // Return existing connection if available
  if (cached.conn && cached.state.isConnected) {
    return cached.conn;
  }

  // Use existing promise if connection is in progress
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      cached.promise = null;
      throw error;
    }
  }

  // Create new connection
  cached.promise = mongoose
    .connect(MONGODB_URI as string, connectionOptions)
    .then((mongooseInstance) => {
      // Setup event handlers
      setupEventHandlers(mongooseInstance.connection);

      // Store native client for advanced operations
      cached.client = mongooseInstance.connection.getClient() as unknown as MongoClient;

      // Configure mongoose settings
      mongooseInstance.set('strictQuery', false);

      // Add custom plugins
      mongooseInstance.plugin((schema: any) => {
        // Add default toJSON transform
        schema.set('toJSON', {
          virtuals: true,
          versionKey: false,
          transform: (_: any, ret: any) => {
            delete ret._id;
            return ret;
          }
        });
      });

      return mongooseInstance;
    })
    .catch((error) => {
      cached.promise = null;
      cached.state.lastError = error;
      console.error('[MongoDB] Connection failed:', error);
      throw error;
    });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  if (cached.conn) {
    try {
      await cached.conn.disconnect();
      cached.conn = null;
      cached.promise = null;
      cached.state.isConnected = false;
      console.log('[MongoDB] Disconnected gracefully');
    } catch (error) {
      console.error('[MongoDB] Error during disconnect:', error);
      throw error;
    }
  }
}

// Setup graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

// Export native MongoDB client for advanced operations
export function getMongoClient(): MongoClient | undefined {
  return cached.client;
}

// Query performance monitoring utilities
export interface QueryStats {
  collection: string;
  operation: string;
  duration: number;
  timestamp: Date;
  filter?: any;
  options?: any;
}

const queryStats: QueryStats[] = [];
const MAX_STATS_SIZE = 1000;

export function recordQueryStats(stats: QueryStats) {
  queryStats.push(stats);
  if (queryStats.length > MAX_STATS_SIZE) {
    queryStats.shift(); // Remove oldest entry
  }
}

export function getQueryStats(limit: number = 100): QueryStats[] {
  return queryStats.slice(-limit);
}

export function getSlowQueries(thresholdMs: number = 100): QueryStats[] {
  return queryStats
    .filter(stat => stat.duration > thresholdMs)
    .sort((a, b) => b.duration - a.duration);
}

// Connection pool monitoring
export async function getConnectionPoolStats() {
  if (!cached.conn) {
    return null;
  }

  const client = cached.conn.connection.getClient() as any;
  const topology = client.topology;

  if (!topology || !topology.s || !topology.s.pool) {
    return null;
  }

  const pool = topology.s.pool;

  return {
    totalConnections: pool.totalConnectionCount || 0,
    availableConnections: pool.availableConnectionCount || 0,
    pendingConnections: pool.pendingConnectionCount || 0,
    maxPoolSize: connectionOptions.maxPoolSize,
    minPoolSize: connectionOptions.minPoolSize,
    waitQueueSize: pool.waitQueueSize || 0,
    utilization: ((pool.totalConnectionCount - pool.availableConnectionCount) / connectionOptions.maxPoolSize!) * 100
  };
}

export default dbConnect;