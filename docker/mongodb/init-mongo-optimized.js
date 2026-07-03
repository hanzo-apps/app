// MongoDB Initialization Script with Optimized Indexes and Settings
// hanzo.ai Build Platform

// Switch to the application database
db = db.getSiblingDB('hanzo_build');

// Create collections with validation rules
db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['space_id', 'user_id', '_createdAt'],
      properties: {
        space_id: {
          bsonType: 'string',
          description: 'Space identifier - required'
        },
        user_id: {
          bsonType: 'string',
          description: 'User identifier - required'
        },
        prompts: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Array of prompts'
        },
        _createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        _updatedAt: {
          bsonType: 'date',
          description: 'Update timestamp'
        }
      }
    }
  },
  collation: { locale: 'en', strength: 2 }
});

// Create optimized indexes for the projects collection
print('Creating indexes for projects collection...');

// Compound index for most common query pattern
db.projects.createIndex(
  { user_id: 1, space_id: 1, _createdAt: -1 },
  {
    name: 'user_space_created_idx',
    background: true,
    partialFilterExpression: { user_id: { $exists: true } }
  }
);

// Index for user queries with recent projects first
db.projects.createIndex(
  { user_id: 1, _updatedAt: -1 },
  { name: 'user_updated_idx', background: true }
);

// Index for space queries
db.projects.createIndex(
  { space_id: 1, _createdAt: -1 },
  { name: 'space_created_idx', background: true }
);

// Text index for searching prompts (if needed)
db.projects.createIndex(
  { prompts: 'text' },
  {
    name: 'prompts_text_idx',
    background: true,
    default_language: 'english',
    weights: { prompts: 10 }
  }
);

// TTL index for automatic cleanup of old projects (optional - 90 days)
// Uncomment if you want automatic cleanup
// db.projects.createIndex(
//   { _createdAt: 1 },
//   {
//     name: 'ttl_cleanup_idx',
//     expireAfterSeconds: 7776000, // 90 days
//     partialFilterExpression: { archived: true }
//   }
// );

// Create sessions collection with optimized indexes
db.createCollection('sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionToken', 'userId', 'expires'],
      properties: {
        sessionToken: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        expires: { bsonType: 'date' }
      }
    }
  }
});

// Session indexes
db.sessions.createIndex(
  { sessionToken: 1 },
  { name: 'session_token_idx', unique: true, background: true }
);

db.sessions.createIndex(
  { userId: 1, expires: 1 },
  { name: 'user_expires_idx', background: true }
);

// TTL index for session cleanup
db.sessions.createIndex(
  { expires: 1 },
  {
    name: 'session_ttl_idx',
    expireAfterSeconds: 0,
    background: true
  }
);

// Create users collection with indexes
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        name: { bsonType: 'string' },
        image: { bsonType: 'string' }
      }
    }
  }
});

// User indexes
db.users.createIndex(
  { email: 1 },
  { name: 'email_idx', unique: true, background: true }
);

// Create accounts collection for OAuth
db.createCollection('accounts');

db.accounts.createIndex(
  { userId: 1, provider: 1 },
  { name: 'user_provider_idx', background: true }
);

db.accounts.createIndex(
  { provider: 1, providerAccountId: 1 },
  { name: 'provider_account_idx', unique: true, background: true }
);

// Create health_check collection
db.createCollection('health_check');
db.health_check.insertOne({
  created_at: new Date(),
  status: 'initialized',
  version: '1.0.0'
});

// Configure collection-level settings
print('Configuring collection settings...');

// Set read/write concerns for critical collections
db.runCommand({
  collMod: 'projects',
  writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
});

db.runCommand({
  collMod: 'sessions',
  writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
});

// Create custom roles for better security
print('Creating custom roles...');

db.createRole({
  role: 'hanzoReadWrite',
  privileges: [
    {
      resource: { db: 'hanzo_build', collection: '' },
      actions: ['find', 'insert', 'update', 'remove', 'createIndex', 'dropIndex']
    }
  ],
  roles: []
});

db.createRole({
  role: 'hanzoBackup',
  privileges: [
    {
      resource: { db: 'hanzo_build', collection: '' },
      actions: ['find', 'listCollections', 'listIndexes']
    }
  ],
  roles: []
});

// Create application user with specific permissions
db.createUser({
  user: 'hanzo_app',
  pwd: process.env.MONGO_APP_PASSWORD || 'app_password_change_me',
  roles: [
    { role: 'hanzoReadWrite', db: 'hanzo_build' }
  ]
});

// Create backup user
db.createUser({
  user: 'hanzo_backup',
  pwd: process.env.MONGO_BACKUP_PASSWORD || 'backup_password_change_me',
  roles: [
    { role: 'hanzoBackup', db: 'hanzo_build' },
    { role: 'backup', db: 'admin' }
  ]
});

// Enable profiling for slow queries
db.setProfilingLevel(1, { slowms: 100 });

// Create system.profile collection with capped size
db.createCollection('system.profile', { capped: true, size: 10485760 }); // 10MB

// Display index information
print('\n=== Index Summary ===');
db.getCollectionNames().forEach(function(collection) {
  if (collection !== 'system.profile') {
    print('\nCollection: ' + collection);
    var indexes = db[collection].getIndexes();
    indexes.forEach(function(index) {
      print('  - ' + index.name + ': ' + JSON.stringify(index.key));
    });
  }
});

print('\n=== MongoDB initialization completed successfully ===');
print('Database: hanzo_build');
print('Collections created: ' + db.getCollectionNames().filter(c => c !== 'system.profile').join(', '));
print('Total indexes created: ' + db.getCollectionNames()
  .filter(c => c !== 'system.profile')
  .reduce((count, col) => count + db[col].getIndexes().length, 0));
print('Profiling enabled for queries slower than 100ms');