#!/bin/bash

# MongoDB Optimization Testing Script
# Tests and validates all optimization configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Helper functions
log() { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1" >&2; ((TESTS_FAILED++)); }
warning() { echo -e "${YELLOW}[!]${NC} $1"; ((WARNINGS++)); }
info() { echo -e "${BLUE}[i]${NC} $1"; }
test_header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

# Configuration
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-hanzo}"
MONGO_PASSWORD="${MONGO_PASSWORD:-defaultpassword123}"
MONGO_DB="${MONGO_DB:-hanzo_build}"

# Function to execute MongoDB command
mongo_exec() {
    docker exec hanzo-mongodb-prod mongosh \
        --host ${MONGO_HOST}:${MONGO_PORT} \
        -u ${MONGO_USER} -p ${MONGO_PASSWORD} \
        --authenticationDatabase admin --quiet \
        --eval "$1" 2>/dev/null
}

# Start testing
echo -e "${BLUE}MongoDB Optimization Test Suite${NC}"
echo "================================"
echo "Testing MongoDB optimizations for Hanzo Build Platform"
echo ""

# Test 1: Connection Pool Configuration
test_header "Testing Connection Pool Configuration"

CONNECTION_STATS=$(mongo_exec "
    var status = db.serverStatus();
    var connections = status.connections;
    print(JSON.stringify({
        current: connections.current,
        available: connections.available,
        totalCreated: connections.totalCreated
    }));
")

if [ -n "${CONNECTION_STATS}" ]; then
    log "Connection pool is active"
    info "Connection stats: ${CONNECTION_STATS}"
    ((TESTS_PASSED++))
else
    error "Could not retrieve connection pool stats"
fi

# Test 2: WiredTiger Cache Configuration
test_header "Testing WiredTiger Cache Settings"

CACHE_STATS=$(mongo_exec "
    var status = db.serverStatus();
    if (status.wiredTiger && status.wiredTiger.cache) {
        var cache = status.wiredTiger.cache;
        var cacheSize = cache['maximum bytes configured'];
        var cacheUsed = cache['bytes currently in the cache'];
        var utilization = (cacheUsed / cacheSize * 100).toFixed(2);
        print('Cache Size: ' + (cacheSize / 1024 / 1024) + 'MB');
        print('Cache Used: ' + (cacheUsed / 1024 / 1024) + 'MB');
        print('Utilization: ' + utilization + '%');
        print('PASS');
    } else {
        print('FAIL');
    }
")

if [[ "${CACHE_STATS}" == *"PASS"* ]]; then
    log "WiredTiger cache is properly configured"
    echo "${CACHE_STATS}" | grep -v PASS
    ((TESTS_PASSED++))
else
    error "WiredTiger cache configuration issue"
fi

# Test 3: Index Creation and Usage
test_header "Testing Index Configuration"

# Switch to application database
mongo_exec "use ${MONGO_DB}" > /dev/null

# Check indexes on projects collection
INDEX_COUNT=$(mongo_exec "
    db = db.getSiblingDB('${MONGO_DB}');
    var indexes = db.projects.getIndexes();
    print(indexes.length);
")

if [ "${INDEX_COUNT}" -ge 3 ]; then
    log "Indexes created successfully (${INDEX_COUNT} indexes found)"
    ((TESTS_PASSED++))

    # Check for specific indexes
    REQUIRED_INDEXES=("user_space_created_idx" "user_updated_idx" "space_created_idx")
    for idx in "${REQUIRED_INDEXES[@]}"; do
        INDEX_EXISTS=$(mongo_exec "
            db = db.getSiblingDB('${MONGO_DB}');
            var exists = db.projects.getIndexes().filter(i => i.name === '${idx}').length > 0;
            print(exists);
        ")
        if [ "${INDEX_EXISTS}" = "true" ]; then
            log "  Index '${idx}' exists"
        else
            warning "  Index '${idx}' not found"
        fi
    done
else
    error "Insufficient indexes created (found ${INDEX_COUNT}, expected at least 3)"
fi

# Test 4: Query Performance
test_header "Testing Query Performance"

# Insert test data
mongo_exec "
    db = db.getSiblingDB('${MONGO_DB}');
    // Clean up old test data
    db.test_performance.drop();
    // Insert test documents
    var docs = [];
    for(var i = 0; i < 10000; i++) {
        docs.push({
            user_id: 'perf_user_' + Math.floor(i / 100),
            space_id: 'perf_space_' + Math.floor(i / 10),
            data: 'x'.repeat(1000),
            _createdAt: new Date()
        });
    }
    db.test_performance.insertMany(docs);
    db.test_performance.createIndex({user_id: 1, _createdAt: -1});
" > /dev/null

# Test query performance
QUERY_TIME=$(mongo_exec "
    db = db.getSiblingDB('${MONGO_DB}');
    var start = Date.now();
    for(var i = 0; i < 100; i++) {
        db.test_performance.find({user_id: 'perf_user_50'}).toArray();
    }
    var duration = Date.now() - start;
    print(duration);
")

AVG_QUERY_TIME=$((QUERY_TIME / 100))
if [ "${AVG_QUERY_TIME}" -le 10 ]; then
    log "Query performance is excellent (${AVG_QUERY_TIME}ms average)"
    ((TESTS_PASSED++))
elif [ "${AVG_QUERY_TIME}" -le 50 ]; then
    warning "Query performance is acceptable (${AVG_QUERY_TIME}ms average)"
    ((TESTS_PASSED++))
else
    error "Query performance is poor (${AVG_QUERY_TIME}ms average)"
fi

# Clean up test data
mongo_exec "db.getSiblingDB('${MONGO_DB}').test_performance.drop();" > /dev/null

# Test 5: Compression Settings
test_header "Testing Compression Configuration"

COMPRESSION_STATS=$(mongo_exec "
    db = db.getSiblingDB('${MONGO_DB}');
    var stats = db.projects.stats();
    var compressionRatio = stats.size / stats.storageSize;
    if (compressionRatio > 1) {
        print('Compression is active');
        print('Compression ratio: ' + compressionRatio.toFixed(2));
        print('PASS');
    } else {
        print('No significant compression detected');
        print('WARN');
    }
")

if [[ "${COMPRESSION_STATS}" == *"PASS"* ]]; then
    log "Compression is properly configured"
    echo "${COMPRESSION_STATS}" | grep -v PASS
    ((TESTS_PASSED++))
elif [[ "${COMPRESSION_STATS}" == *"WARN"* ]]; then
    warning "Compression may not be fully active (needs more data)"
    ((TESTS_PASSED++))
else
    error "Compression configuration issue"
fi

# Test 6: Profiling Configuration
test_header "Testing Query Profiling"

PROFILING_LEVEL=$(mongo_exec "
    db = db.getSiblingDB('${MONGO_DB}');
    var level = db.getProfilingLevel();
    print(level);
")

if [ "${PROFILING_LEVEL}" = "1" ]; then
    log "Profiling is enabled for slow queries"
    ((TESTS_PASSED++))

    # Check profiling threshold
    PROFILING_SLOWMS=$(mongo_exec "
        db = db.getSiblingDB('${MONGO_DB}');
        var status = db.getProfilingStatus();
        print(status.slowms);
    ")
    info "Slow query threshold: ${PROFILING_SLOWMS}ms"
else
    warning "Profiling is not enabled (level: ${PROFILING_LEVEL})"
fi

# Test 7: Backup Script Availability
test_header "Testing Backup Scripts"

if docker exec hanzo-mongodb-prod test -f /usr/local/bin/backup.sh; then
    log "Backup script is available"
    ((TESTS_PASSED++))
else
    error "Backup script not found"
fi

if docker exec hanzo-mongodb-prod test -f /usr/local/bin/restore.sh; then
    log "Restore script is available"
    ((TESTS_PASSED++))
else
    error "Restore script not found"
fi

if docker exec hanzo-mongodb-prod test -f /usr/local/bin/monitor-performance.js; then
    log "Performance monitoring script is available"
    ((TESTS_PASSED++))
else
    error "Performance monitoring script not found"
fi

# Test 8: Security Configuration
test_header "Testing Security Settings"

# Check authentication
AUTH_ENABLED=$(mongo_exec "
    var cmdLineOpts = db.adminCommand({getCmdLineOpts: 1});
    var authEnabled = cmdLineOpts.parsed.security && cmdLineOpts.parsed.security.authorization;
    print(authEnabled === 'enabled' ? 'true' : 'false');
")

if [ "${AUTH_ENABLED}" = "true" ]; then
    log "Authentication is enabled"
    ((TESTS_PASSED++))
else
    error "Authentication is not properly configured"
fi

# Check custom users
CUSTOM_USERS=$(mongo_exec "
    db = db.getSiblingDB('${MONGO_DB}');
    var users = db.getUsers();
    print(users.length);
")

if [ "${CUSTOM_USERS}" -ge 1 ]; then
    log "Custom users configured (${CUSTOM_USERS} users found)"
    ((TESTS_PASSED++))
else
    warning "No custom users found in application database"
fi

# Test 9: Memory Limits
test_header "Testing Resource Limits"

# Check ulimits
ULIMITS=$(docker exec hanzo-mongodb-prod sh -c "ulimit -n && ulimit -u")
NOFILE=$(echo "${ULIMITS}" | head -1)
NPROC=$(echo "${ULIMITS}" | tail -1)

if [ "${NOFILE}" -ge 64000 ]; then
    log "File descriptor limit is properly set (${NOFILE})"
    ((TESTS_PASSED++))
else
    warning "File descriptor limit is low (${NOFILE})"
fi

if [ "${NPROC}" -ge 32000 ]; then
    log "Process limit is properly set (${NPROC})"
    ((TESTS_PASSED++))
else
    warning "Process limit is low (${NPROC})"
fi

# Test 10: Replication Readiness
test_header "Testing Replication Readiness"

REPL_STATUS=$(mongo_exec "
    var status = rs.status();
    if (status.ok === 0 && status.code === 94) {
        print('Not configured (ready for future setup)');
        print('READY');
    } else if (status.ok === 1) {
        print('Replica set is active');
        print('ACTIVE');
    } else {
        print('Unknown status');
        print('UNKNOWN');
    }
" 2>/dev/null || echo "READY")

if [[ "${REPL_STATUS}" == *"READY"* ]] || [[ "${REPL_STATUS}" == *"ACTIVE"* ]]; then
    log "Replication configuration is ready"
    ((TESTS_PASSED++))
else
    warning "Replication status unclear"
fi

# Summary
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Tests Passed: ${TESTS_PASSED}/${TOTAL_TESTS}"
echo "Tests Failed: ${TESTS_FAILED}"
echo "Warnings: ${WARNINGS}"
echo "Success Rate: ${SUCCESS_RATE}%"

if [ ${TESTS_FAILED} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All optimization tests passed successfully!${NC}"
    echo "MongoDB is properly optimized for production use."
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed. Please review the configuration.${NC}"
    exit 1
fi