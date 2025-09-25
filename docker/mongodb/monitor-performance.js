#!/usr/bin/env mongosh

// MongoDB Performance Monitoring Script
// Run this script periodically to monitor database performance

// Configuration
const DB_NAME = 'hanzo_build';
const SLOW_QUERY_THRESHOLD_MS = 100;
const TOP_N_QUERIES = 10;

// Helper function to format bytes
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to format numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

print('\n========================================');
print('MongoDB Performance Monitoring Report');
print('Database: ' + DB_NAME);
print('Timestamp: ' + new Date().toISOString());
print('========================================\n');

// Switch to the target database
db = db.getSiblingDB(DB_NAME);

// 1. Database Statistics
print('1. DATABASE STATISTICS');
print('----------------------');
const dbStats = db.stats();
print('  • Data Size: ' + formatBytes(dbStats.dataSize));
print('  • Storage Size: ' + formatBytes(dbStats.storageSize));
print('  • Index Size: ' + formatBytes(dbStats.indexSize));
print('  • Total Size: ' + formatBytes(dbStats.totalSize));
print('  • Collections: ' + dbStats.collections);
print('  • Objects: ' + formatNumber(dbStats.objects));
print('  • Indexes: ' + dbStats.indexes);
print('  • Average Object Size: ' + formatBytes(dbStats.avgObjSize || 0));

// 2. Connection Pool Status
print('\n2. CONNECTION POOL STATUS');
print('-------------------------');
const serverStatus = db.serverStatus();
const connections = serverStatus.connections;
print('  • Current Connections: ' + connections.current);
print('  • Available Connections: ' + connections.available);
print('  • Total Created: ' + formatNumber(connections.totalCreated));
print('  • Active Connections: ' + connections.active);

// 3. Operation Counters
print('\n3. OPERATION METRICS (since server start)');
print('------------------------------------------');
const opcounters = serverStatus.opcounters;
const totalOps = Object.values(opcounters).reduce((a, b) => a + b, 0);
print('  • Total Operations: ' + formatNumber(totalOps));
print('  • Inserts: ' + formatNumber(opcounters.insert));
print('  • Queries: ' + formatNumber(opcounters.query));
print('  • Updates: ' + formatNumber(opcounters.update));
print('  • Deletes: ' + formatNumber(opcounters.delete));
print('  • Commands: ' + formatNumber(opcounters.command));

// Calculate operations per second (if repl data available)
if (serverStatus.repl && serverStatus.repl.electionMetrics) {
  const uptimeSeconds = serverStatus.uptime;
  print('\n  Operations per second:');
  print('  • Queries/sec: ' + (opcounters.query / uptimeSeconds).toFixed(2));
  print('  • Inserts/sec: ' + (opcounters.insert / uptimeSeconds).toFixed(2));
  print('  • Updates/sec: ' + (opcounters.update / uptimeSeconds).toFixed(2));
}

// 4. Memory Usage
print('\n4. MEMORY USAGE');
print('---------------');
const mem = serverStatus.mem;
print('  • Resident Memory: ' + formatBytes(mem.resident * 1024 * 1024));
print('  • Virtual Memory: ' + formatBytes(mem.virtual * 1024 * 1024));
if (mem.mapped) {
  print('  • Mapped Memory: ' + formatBytes(mem.mapped * 1024 * 1024));
}

// WiredTiger Cache Statistics
if (serverStatus.wiredTiger && serverStatus.wiredTiger.cache) {
  const cache = serverStatus.wiredTiger.cache;
  print('\n  WiredTiger Cache:');
  print('  • Cache Size: ' + formatBytes(cache['maximum bytes configured']));
  print('  • Cache Used: ' + formatBytes(cache['bytes currently in the cache']));
  print('  • Cache Dirty: ' + formatBytes(cache['tracked dirty bytes in the cache']));
  const cacheUsagePercent = (cache['bytes currently in the cache'] / cache['maximum bytes configured'] * 100).toFixed(2);
  print('  • Cache Usage: ' + cacheUsagePercent + '%');
}

// 5. Collection Statistics
print('\n5. COLLECTION STATISTICS');
print('------------------------');
const collections = db.getCollectionNames().filter(c => !c.startsWith('system.'));
collections.forEach(function(collName) {
  const stats = db.getCollection(collName).stats();
  const indexStats = db.getCollection(collName).getIndexes();

  print('\n  Collection: ' + collName);
  print('  • Document Count: ' + formatNumber(stats.count));
  print('  • Data Size: ' + formatBytes(stats.size));
  print('  • Storage Size: ' + formatBytes(stats.storageSize));
  print('  • Index Count: ' + indexStats.length);
  print('  • Total Index Size: ' + formatBytes(stats.totalIndexSize || 0));

  // Index usage statistics
  const indexUsage = db.getCollection(collName).aggregate([
    { $indexStats: {} }
  ]).toArray();

  if (indexUsage.length > 0) {
    print('  • Index Usage:');
    indexUsage.forEach(function(idx) {
      const usage = idx.accesses.ops;
      if (usage > 0) {
        print('    - ' + idx.name + ': ' + formatNumber(usage) + ' operations');
      } else {
        print('    - ' + idx.name + ': UNUSED');
      }
    });
  }
});

// 6. Slow Query Analysis
print('\n6. SLOW QUERY ANALYSIS');
print('----------------------');
const profileData = db.system.profile.find({
  millis: { $gte: SLOW_QUERY_THRESHOLD_MS }
}).sort({ millis: -1 }).limit(TOP_N_QUERIES).toArray();

if (profileData.length > 0) {
  print('  Top ' + TOP_N_QUERIES + ' slowest queries (>= ' + SLOW_QUERY_THRESHOLD_MS + 'ms):');
  profileData.forEach(function(query, index) {
    print('\n  Query #' + (index + 1) + ':');
    print('  • Duration: ' + query.millis + 'ms');
    print('  • Operation: ' + query.op);
    print('  • Collection: ' + query.ns);
    if (query.command) {
      print('  • Command: ' + JSON.stringify(query.command).substring(0, 200));
    }
    if (query.planSummary) {
      print('  • Plan: ' + query.planSummary);
    }
    print('  • Timestamp: ' + query.ts);
  });
} else {
  print('  No slow queries found (threshold: ' + SLOW_QUERY_THRESHOLD_MS + 'ms)');
}

// 7. Current Operations
print('\n7. CURRENT OPERATIONS');
print('--------------------');
const currentOps = db.currentOp({ active: true, microsecs_running: { $gte: 1000 } });
if (currentOps.inprog && currentOps.inprog.length > 0) {
  print('  Active long-running operations:');
  currentOps.inprog.forEach(function(op) {
    print('  • Operation ID: ' + op.opid);
    print('    - Type: ' + op.op);
    print('    - Duration: ' + (op.microsecs_running / 1000).toFixed(2) + 'ms');
    print('    - Description: ' + (op.desc || 'N/A'));
  });
} else {
  print('  No long-running operations currently active');
}

// 8. Replication Lag (if applicable)
const replStatus = db.adminCommand({ replSetGetStatus: 1, $readPreference: { mode: 'primary' } });
if (replStatus.ok === 1) {
  print('\n8. REPLICATION STATUS');
  print('--------------------');
  print('  • Replica Set: ' + replStatus.set);
  print('  • Members: ' + replStatus.members.length);

  replStatus.members.forEach(function(member) {
    if (member.state === 1) {
      print('  • Primary: ' + member.name);
    } else if (member.state === 2) {
      const lag = member.optime ?
        (replStatus.members.find(m => m.state === 1).optime.ts.t - member.optime.ts.t) : 'Unknown';
      print('  • Secondary: ' + member.name + ' (Lag: ' + lag + 's)');
    }
  });
}

// 9. Query Plan Cache Statistics
print('\n9. QUERY PLAN CACHE');
print('-------------------');
collections.forEach(function(collName) {
  const planCache = db.getCollection(collName).getPlanCache().listQueryShapes();
  if (planCache.length > 0) {
    print('  Collection: ' + collName);
    print('  • Cached Query Shapes: ' + planCache.length);
  }
});

// 10. Recommendations
print('\n10. PERFORMANCE RECOMMENDATIONS');
print('--------------------------------');

// Check for unused indexes
let unusedIndexCount = 0;
collections.forEach(function(collName) {
  const indexUsage = db.getCollection(collName).aggregate([
    { $indexStats: {} }
  ]).toArray();

  indexUsage.forEach(function(idx) {
    if (idx.accesses.ops === 0 && idx.name !== '_id_') {
      unusedIndexCount++;
      print('  ⚠ Unused index: ' + collName + '.' + idx.name);
    }
  });
});

if (unusedIndexCount === 0) {
  print('  ✓ All indexes are being used');
}

// Check cache usage
if (serverStatus.wiredTiger && serverStatus.wiredTiger.cache) {
  const cacheUsagePercent = (serverStatus.wiredTiger.cache['bytes currently in the cache'] /
                             serverStatus.wiredTiger.cache['maximum bytes configured'] * 100);
  if (cacheUsagePercent > 95) {
    print('  ⚠ WiredTiger cache usage is high (' + cacheUsagePercent.toFixed(2) + '%). Consider increasing cache size.');
  } else if (cacheUsagePercent < 50) {
    print('  ℹ WiredTiger cache usage is low (' + cacheUsagePercent.toFixed(2) + '%). You may reduce cache size if memory is needed elsewhere.');
  } else {
    print('  ✓ WiredTiger cache usage is optimal (' + cacheUsagePercent.toFixed(2) + '%)');
  }
}

// Check connection pool
if (connections.current > connections.available * 0.8) {
  print('  ⚠ Connection pool usage is high. Consider increasing max connections.');
} else {
  print('  ✓ Connection pool has sufficient capacity');
}

// Check for collections without indexes (except small ones)
collections.forEach(function(collName) {
  const stats = db.getCollection(collName).stats();
  const indexes = db.getCollection(collName).getIndexes();
  if (stats.count > 1000 && indexes.length === 1) { // Only has _id index
    print('  ⚠ Large collection without custom indexes: ' + collName + ' (' + formatNumber(stats.count) + ' documents)');
  }
});

print('\n========================================');
print('Report completed at: ' + new Date().toISOString());
print('========================================\n');