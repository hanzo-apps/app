#!/bin/bash

# MongoDB Restore Script for Hanzo Build Platform
# Supports restoration from full and incremental backups

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-hanzo_build}"
MONGO_USER="${MONGO_USER:-hanzo}"
MONGO_PASSWORD="${MONGO_PASSWORD:-defaultpassword123}"
BACKUP_PATH="${1:-}"
RESTORE_DB="${2:-${MONGO_DB}}" # Optional: restore to different database
DROP_EXISTING="${DROP_EXISTING:-false}" # Whether to drop existing database
DECRYPTION_KEY="${DECRYPTION_KEY:-}" # GPG key for decryption

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to list available backups
list_backups() {
    log "Available backups in ${BACKUP_DIR}:"
    echo ""

    # Find all backup directories and files
    local backups=$(find "${BACKUP_DIR}" -name "${MONGO_DB}_*" \( -type d -o -type f \) | grep -v ".metadata" | sort -r)

    if [ -z "${backups}" ]; then
        warning "No backups found"
        return 1
    fi

    local count=1
    for backup in ${backups}; do
        local backup_name=$(basename "${backup}")
        local metadata_file="${BACKUP_DIR}/${backup_name%.tar.*}.metadata"
        metadata_file="${metadata_file%.gpg}.metadata"

        # Display backup info
        echo -e "${BLUE}[${count}]${NC} ${backup_name}"

        # Try to read metadata
        if [ -f "${metadata_file}" ]; then
            local backup_date=$(grep '"timestamp"' "${metadata_file}" | cut -d'"' -f4 || echo "unknown")
            local backup_type=$(grep '"type"' "${metadata_file}" | cut -d'"' -f4 || echo "unknown")
            local backup_size=$(grep '"size"' "${metadata_file}" | cut -d':' -f2 | tr -d ', ' || echo "0")
            local human_size=$(numfmt --to=iec-i --suffix=B "${backup_size}" 2>/dev/null || echo "unknown")

            echo "    Date: ${backup_date}"
            echo "    Type: ${backup_type}"
            echo "    Size: ${human_size}"
        else
            echo "    (No metadata available)"
        fi
        echo ""

        count=$((count + 1))
    done

    return 0
}

# Function to prepare backup for restoration
prepare_backup() {
    local backup_file=$1
    local temp_dir="${BACKUP_DIR}/restore_temp_$(date +%s)"

    log "Preparing backup for restoration..."

    # Create temporary directory
    mkdir -p "${temp_dir}"

    # Handle encrypted backups
    if [[ "${backup_file}" == *.gpg ]]; then
        if [ -z "${DECRYPTION_KEY}" ]; then
            error "Backup is encrypted but no decryption key provided"
            error "Set DECRYPTION_KEY environment variable"
            return 1
        fi

        log "Decrypting backup..."
        local decrypted_file="${temp_dir}/$(basename "${backup_file%.gpg}")"
        gpg --decrypt --output "${decrypted_file}" "${backup_file}"
        backup_file="${decrypted_file}"
    fi

    # Handle compressed backups
    if [[ "${backup_file}" == *.tar.zst ]]; then
        log "Extracting zstd compressed backup..."
        zstd -d -c "${backup_file}" | tar -xf - -C "${temp_dir}"
        backup_file="${temp_dir}/$(basename "${backup_file%.tar.zst}")"
    elif [[ "${backup_file}" == *.tar.gz ]]; then
        log "Extracting gzip compressed backup..."
        tar -xzf "${backup_file}" -C "${temp_dir}"
        backup_file="${temp_dir}/$(basename "${backup_file%.tar.gz}")"
    fi

    echo "${backup_file}"
}

# Function to perform restoration
perform_restore() {
    local backup_path=$1

    log "Starting restoration from: ${backup_path}"
    log "Target database: ${RESTORE_DB}"

    # Check if backup exists
    if [ ! -e "${backup_path}" ]; then
        error "Backup not found: ${backup_path}"
        return 1
    fi

    # Prepare backup (decrypt/decompress if needed)
    backup_path=$(prepare_backup "${backup_path}")

    # Build mongorestore command
    MONGORESTORE_CMD="mongorestore"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --host=${MONGO_HOST}:${MONGO_PORT}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --username=${MONGO_USER}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --password=${MONGO_PASSWORD}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --authenticationDatabase=admin"

    # Check if we're restoring to a different database
    if [ "${RESTORE_DB}" != "${MONGO_DB}" ]; then
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --nsFrom='${MONGO_DB}.*'"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --nsTo='${RESTORE_DB}.*'"
        log "Restoring to different database: ${MONGO_DB} -> ${RESTORE_DB}"
    else
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --db=${RESTORE_DB}"
    fi

    # Add drop option if requested
    if [ "${DROP_EXISTING}" = "true" ]; then
        warning "Dropping existing database before restore"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --drop"
    fi

    # Add performance options
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --numParallelCollections=4"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --numInsertionWorkersPerCollection=4"

    # Handle directory vs archive
    if [ -d "${backup_path}" ]; then
        # It's a directory
        if [ "${RESTORE_DB}" != "${MONGO_DB}" ]; then
            MONGORESTORE_CMD="${MONGORESTORE_CMD} ${backup_path}"
        else
            MONGORESTORE_CMD="${MONGORESTORE_CMD} ${backup_path}/${MONGO_DB}"
        fi
    else
        # It's likely an archive
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --archive=${backup_path}"
        if [[ "${backup_path}" == *.gz ]]; then
            MONGORESTORE_CMD="${MONGORESTORE_CMD} --gzip"
        fi
    fi

    # Add oplog replay if available
    if [ -f "${backup_path}/oplog.bson" ]; then
        log "Oplog found, will replay for point-in-time recovery"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --oplogReplay"
    fi

    # Execute restore
    log "Executing: mongorestore with specified parameters..."
    if eval ${MONGORESTORE_CMD}; then
        log "MongoDB restore completed successfully"
    else
        error "MongoDB restore failed"
        return 1
    fi

    # Cleanup temporary files
    if [[ "${backup_path}" == *"/restore_temp_"* ]]; then
        log "Cleaning up temporary files..."
        rm -rf "$(dirname "${backup_path}")"
    fi

    return 0
}

# Function to verify restoration
verify_restore() {
    log "Verifying restoration..."

    # Connect and check database exists
    local db_exists=$(mongosh --host ${MONGO_HOST}:${MONGO_PORT} \
        -u ${MONGO_USER} -p ${MONGO_PASSWORD} \
        --authenticationDatabase admin --quiet \
        --eval "db.getSiblingDB('${RESTORE_DB}').getCollectionNames().length" 2>/dev/null)

    if [ -z "${db_exists}" ] || [ "${db_exists}" = "0" ]; then
        error "Database ${RESTORE_DB} appears to be empty after restoration"
        return 1
    fi

    log "Found ${db_exists} collections in restored database"

    # Get document counts
    mongosh --host ${MONGO_HOST}:${MONGO_PORT} \
        -u ${MONGO_USER} -p ${MONGO_PASSWORD} \
        --authenticationDatabase admin --quiet \
        --eval "
            db = db.getSiblingDB('${RESTORE_DB}');
            var collections = db.getCollectionNames();
            print('Collection document counts:');
            collections.forEach(function(coll) {
                if (!coll.startsWith('system.')) {
                    var count = db[coll].countDocuments();
                    print('  • ' + coll + ': ' + count + ' documents');
                }
            });
        " 2>/dev/null || warning "Could not retrieve document counts"

    # Rebuild indexes
    log "Rebuilding indexes..."
    mongosh --host ${MONGO_HOST}:${MONGO_PORT} \
        -u ${MONGO_USER} -p ${MONGO_PASSWORD} \
        --authenticationDatabase admin --quiet \
        --eval "
            db = db.getSiblingDB('${RESTORE_DB}');
            db.getCollectionNames().forEach(function(coll) {
                if (!coll.startsWith('system.')) {
                    db[coll].reIndex();
                }
            });
            print('Indexes rebuilt successfully');
        " 2>/dev/null || warning "Could not rebuild indexes"

    log "Restoration verification completed"
    return 0
}

# Function to perform point-in-time recovery
point_in_time_recovery() {
    local backup_path=$1
    local target_time=$2

    log "Performing point-in-time recovery to: ${target_time}"

    # First, restore the full backup
    if ! perform_restore "${backup_path}"; then
        error "Failed to restore base backup"
        return 1
    fi

    # Apply oplog entries up to target time
    if [ -f "${backup_path}/oplog.bson" ]; then
        log "Applying oplog entries up to ${target_time}..."

        MONGORESTORE_CMD="mongorestore"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --host=${MONGO_HOST}:${MONGO_PORT}"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --username=${MONGO_USER}"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --password=${MONGO_PASSWORD}"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --authenticationDatabase=admin"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --oplogReplay"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} --oplogLimit=${target_time}"
        MONGORESTORE_CMD="${MONGORESTORE_CMD} ${backup_path}"

        eval ${MONGORESTORE_CMD} || warning "Oplog replay encountered issues"
    else
        warning "No oplog found for point-in-time recovery"
    fi

    return 0
}

# Main execution
main() {
    log "MongoDB Restore Script Started"

    # Check prerequisites
    if ! command -v mongorestore >/dev/null 2>&1; then
        error "mongorestore not found. Please install MongoDB tools."
        exit 1
    fi

    # If no backup path provided, list available backups
    if [ -z "${BACKUP_PATH}" ]; then
        list_backups
        echo ""
        info "Usage: $0 <backup_path> [target_database] [DROP_EXISTING=true/false]"
        info "Example: $0 /backup/hanzo_build_full_20240101_120000"
        info "Example: $0 /backup/hanzo_build_full_20240101_120000.tar.gz hanzo_build_restored"
        exit 0
    fi

    # Confirm dangerous operations
    if [ "${DROP_EXISTING}" = "true" ]; then
        warning "This will DROP the existing database: ${RESTORE_DB}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "${confirm}" != "yes" ]; then
            log "Restoration cancelled"
            exit 0
        fi
    fi

    # Perform restoration
    if perform_restore "${BACKUP_PATH}"; then
        if verify_restore; then
            log "✓ Database restoration completed successfully"
            log "  Database: ${RESTORE_DB}"
            log "  Source: ${BACKUP_PATH}"

            # Send notification if configured
            if [ -n "${WEBHOOK_URL:-}" ]; then
                curl -X POST "${WEBHOOK_URL}" \
                    -H "Content-Type: application/json" \
                    -d "{\"text\": \"MongoDB Restore SUCCESS: Database ${RESTORE_DB} restored successfully from ${BACKUP_PATH}\"}" \
                    2>/dev/null || true
            fi
        else
            error "Restoration verification failed"
            exit 1
        fi
    else
        error "Restoration failed"
        exit 1
    fi
}

# Run main function
main

exit 0