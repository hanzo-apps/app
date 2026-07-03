// MongoDB initialization script
db = db.getSiblingDB('hanzo_build');

// Create a test collection to ensure the database is initialized
db.createCollection('health_check');

// Insert a test document
db.health_check.insertOne({
  created_at: new Date(),
  status: 'initialized'
});

print('MongoDB initialization completed');