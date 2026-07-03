# MongoDB Management Makefile for Hanzo Build Platform

.PHONY: help backup restore monitor shell logs stats optimize cleanup test-connection

# Default target
help:
	@echo "MongoDB Management Commands:"
	@echo "  make backup              - Create a full backup of the database"
	@echo "  make backup-incremental  - Create an incremental backup"
	@echo "  make restore             - Restore from the latest backup"
	@echo "  make restore-list        - List all available backups"
	@echo "  make monitor             - Run performance monitoring report"
	@echo "  make shell               - Open MongoDB shell"
	@echo "  make logs                - Show MongoDB logs"
	@echo "  make stats               - Show quick database statistics"
	@echo "  make optimize            - Run optimization tasks"
	@echo "  make cleanup             - Clean up old backups and logs"
	@echo "  make test-connection     - Test database connectivity"
	@echo "  make index-usage         - Show index usage statistics"
	@echo "  make slow-queries        - Analyze slow queries"

# Backup operations
backup:
	@echo "Creating full backup..."
	@docker exec hanzo-mongodb-prod bash /usr/local/bin/backup.sh full

backup-incremental:
	@echo "Creating incremental backup..."
	@docker exec hanzo-mongodb-prod bash /usr/local/bin/backup.sh incremental

# Restore operations
restore-list:
	@echo "Listing available backups..."
	@docker exec hanzo-mongodb-prod bash /usr/local/bin/restore.sh

restore:
	@echo "Starting restore process..."
	@echo "This will list available backups. Choose one to restore."
	@docker exec -it hanzo-mongodb-prod bash /usr/local/bin/restore.sh

restore-latest:
	@echo "Restoring from latest backup..."
	@LATEST=$$(docker exec hanzo-mongodb-prod find /backup -name "hanzo_build_full_*" -type d | sort -r | head -1) && \
	docker exec hanzo-mongodb-prod bash /usr/local/bin/restore.sh $$LATEST

# Monitoring operations
monitor:
	@echo "Running performance monitoring..."
	@docker exec hanzo-mongodb-prod mongosh --file /usr/local/bin/monitor-performance.js

stats:
	@echo "Database Statistics:"
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.stats()' | python3 -m json.tool || true

index-usage:
	@echo "Index Usage Statistics:"
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.getCollectionNames().forEach(function(c) { \
			print("Collection: " + c); \
			db[c].aggregate([{$$indexStats: {}}]).forEach(function(idx) { \
				print("  " + idx.name + ": " + idx.accesses.ops + " ops"); \
			}); \
		})'

slow-queries:
	@echo "Analyzing slow queries (last 20):"
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.system.profile.find({millis: {$$gte: 100}}).sort({ts: -1}).limit(20).forEach(function(q) { \
			print("Duration: " + q.millis + "ms | " + q.op + " | " + q.ns); \
			if (q.command) print("  Command: " + JSON.stringify(q.command).substring(0, 100)); \
		})'

# Shell access
shell:
	@echo "Opening MongoDB shell..."
	@docker exec -it hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin

# Logs
logs:
	@echo "Showing MongoDB logs (last 100 lines):"
	@docker exec hanzo-mongodb-prod tail -n 100 /var/log/mongodb/mongod.log || \
		docker logs --tail 100 hanzo-mongodb-prod

logs-follow:
	@echo "Following MongoDB logs:"
	@docker exec hanzo-mongodb-prod tail -f /var/log/mongodb/mongod.log || \
		docker logs -f hanzo-mongodb-prod

# Optimization tasks
optimize:
	@echo "Running optimization tasks..."
	@echo "1. Compacting database..."
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.runCommand({compact: "projects"}); \
			db.runCommand({compact: "sessions"}); \
			db.runCommand({compact: "users"}); \
			print("Compaction completed");'
	@echo "2. Rebuilding indexes..."
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.getCollectionNames().forEach(function(c) { \
			if (!c.startsWith("system.")) { \
				print("Reindexing " + c); \
				db[c].reIndex(); \
			} \
		}); print("Index rebuild completed");'
	@echo "3. Updating statistics..."
	@docker exec hanzo-mongodb-prod mongosh admin \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.runCommand({flushRouterConfig: 1}); \
			print("Statistics updated");'

# Cleanup operations
cleanup:
	@echo "Cleaning up old backups and logs..."
	@docker exec hanzo-mongodb-prod find /backup -name "hanzo_build_*" -mtime +30 -exec rm -rf {} \; || true
	@docker exec hanzo-mongodb-prod sh -c 'echo "" > /var/log/mongodb/mongod.log.old && \
		mv /var/log/mongodb/mongod.log /var/log/mongodb/mongod.log.old && \
		echo "Log rotated at $$(date)" > /var/log/mongodb/mongod.log' || true
	@echo "Cleanup completed"

# Test connectivity
test-connection:
	@echo "Testing MongoDB connection..."
	@docker exec hanzo-mongodb-prod mongosh \
		--host localhost:27017 \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin \
		--quiet --eval 'db.adminCommand("ping")' && \
		echo "✓ Connection successful" || echo "✗ Connection failed"

# Development helpers
create-test-data:
	@echo "Creating test data..."
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'for(var i=0; i<1000; i++) { \
			db.projects.insertOne({ \
				space_id: "test_space_" + Math.floor(i/10), \
				user_id: "test_user_" + Math.floor(i/100), \
				prompts: ["prompt " + i], \
				_createdAt: new Date(), \
				_updatedAt: new Date() \
			}); \
		} print("Created 1000 test documents");'

drop-test-data:
	@echo "Dropping test data..."
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'db.projects.deleteMany({user_id: /^test_user_/}); \
			print("Test data removed");'

# Performance testing
benchmark:
	@echo "Running performance benchmark..."
	@docker exec hanzo-mongodb-prod mongosh hanzo_build \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'var start = Date.now(); \
		for(var i=0; i<1000; i++) { \
			db.projects.find({user_id: "test_user_1"}).toArray(); \
		} \
		var duration = Date.now() - start; \
		print("1000 queries completed in " + duration + "ms"); \
		print("Average: " + (duration/1000).toFixed(2) + "ms per query");'

# Docker compose helpers
up:
	cd ../.. && docker compose -f docker/compose.prod.yml up -d mongodb

down:
	cd ../.. && docker compose -f docker/compose.prod.yml down mongodb

restart:
	cd ../.. && docker compose -f docker/compose.prod.yml restart mongodb

# Health check
health:
	@echo "MongoDB Health Status:"
	@docker exec hanzo-mongodb-prod mongosh \
		--host localhost:27017 \
		-u hanzo -p ${MONGO_PASSWORD:-defaultpassword123} \
		--authenticationDatabase admin --quiet \
		--eval 'var status = db.serverStatus(); \
		print("Uptime: " + Math.floor(status.uptime/3600) + " hours"); \
		print("Connections: " + status.connections.current + "/" + status.connections.available); \
		print("Operations/sec: " + Math.round(status.opcounters.query/status.uptime)); \
		var ping = db.adminCommand("ping"); \
		print("Status: " + (ping.ok ? "HEALTHY" : "UNHEALTHY"));'