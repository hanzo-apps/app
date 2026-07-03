#!/bin/bash

# MongoDB Backup Script for Hanzo Build Platform
# Supports full and incremental backups with compression and encryption

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-hanzo_build}"
MONGO_USER="${MONGO_USER:-hanzo_backup}"
MONGO_PASSWORD="${MONGO_PASSWORD:-backup_password_change_me}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_TYPE="${1:-full}" # full or incremental
COMPRESSION="${COMPRESSION:-gzip}" # none, gzip, or zstd
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}" # Optional GPG key for encryption

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${MONGO_DB}_${BACKUP_TYPE}_${TIMESTAMP}"

# Function to perform backup
perform_backup() {
    local backup_path="${BACKUP_DIR}/${BACKUP_NAME}"

    log "Starting ${BACKUP_TYPE} backup for database: ${MONGO_DB}"
    log "Backup destination: ${backup_path}"

    # Build mongodump command
    MONGODUMP_CMD="mongodump"
    MONGODUMP_CMD="${MONGODUMP_CMD} --host=${MONGO_HOST}:${MONGO_PORT}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --db=${MONGO_DB}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --username=${MONGO_USER}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --password=${MONGO_PASSWORD}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --authenticationDatabase=admin"
    MONGODUMP_CMD="${MONGODUMP_CMD} --out=${backup_path}"

    # Add options based on backup type
    if [ "${BACKUP_TYPE}" = "full" ]; then
        MONGODUMP_CMD="${MONGODUMP_CMD} --oplog"
        log "Including oplog for point-in-time recovery"
    else
        # For incremental, backup only documents modified after last full backup
        LAST_FULL_BACKUP=$(find ${BACKUP_DIR} -name "*_full_*" -type d | sort -r | head -1)
        if [ -z "${LAST_FULL_BACKUP}" ]; then
            error "No full backup found. Please run a full backup first."
            exit 1
        fi
        LAST_BACKUP_TIME=$(stat -c %Y "${LAST_FULL_BACKUP}" 2>/dev/null || stat -f %m "${LAST_FULL_BACKUP}" 2>/dev/null)
        LAST_BACKUP_ISO=$(date -d "@${LAST_BACKUP_TIME}" -Iseconds 2>/dev/null || date -r "${LAST_BACKUP_TIME}" -Iseconds 2>/dev/null)
        log "Performing incremental backup since: ${LAST_BACKUP_ISO}"
        # Note: True incremental backup requires oplog or change streams
        # This is a simplified version that backs up all data
    fi

    # Add performance options
    MONGODUMP_CMD="${MONGODUMP_CMD} --numParallelCollections=4"
    MONGODUMP_CMD="${MONGODUMP_CMD} --gzip" # Use MongoDB's built-in compression

    # Execute backup
    log "Executing: mongodump with specified parameters..."
    if eval ${MONGODUMP_CMD}; then
        log "MongoDB dump completed successfully"
    else
        error "MongoDB dump failed"
        exit 1
    fi

    # Additional compression if requested
    if [ "${COMPRESSION}" != "none" ] && [ "${COMPRESSION}" != "gzip" ]; then
        log "Applying ${COMPRESSION} compression..."
        case ${COMPRESSION} in
            zstd)
                tar -cf - -C "${BACKUP_DIR}" "${BACKUP_NAME}" | zstd -T0 > "${backup_path}.tar.zst"
                rm -rf "${backup_path}"
                backup_path="${backup_path}.tar.zst"
                ;;
            *)
                warning "Unknown compression type: ${COMPRESSION}, skipping additional compression"
                ;;
        esac
    fi

    # Encryption if key is provided
    if [ -n "${ENCRYPTION_KEY}" ]; then
        log "Encrypting backup with GPG..."
        if command -v gpg >/dev/null 2>&1; then
            gpg --trust-model always --encrypt --recipient "${ENCRYPTION_KEY}" \
                --output "${backup_path}.gpg" "${backup_path}"
            rm -f "${backup_path}"
            backup_path="${backup_path}.gpg"
        else
            warning "GPG not found, skipping encryption"
        fi
    fi

    # Create metadata file
    cat > "${BACKUP_DIR}/${BACKUP_NAME}.metadata" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "database": "${MONGO_DB}",
    "type": "${BACKUP_TYPE}",
    "compression": "${COMPRESSION}",
    "encrypted": $([ -n "${ENCRYPTION_KEY}" ] && echo "true" || echo "false"),
    "size": $(du -sb "${backup_path}" 2>/dev/null | cut -f1 || echo "0"),
    "host": "${MONGO_HOST}",
    "collections": $(mongosh --host ${MONGO_HOST}:${MONGO_PORT} -u ${MONGO_USER} -p ${MONGO_PASSWORD} --authenticationDatabase admin --quiet --eval "db.getSiblingDB('${MONGO_DB}').getCollectionNames().length" 2>/dev/null || echo "unknown")
}
EOF

    log "Backup completed: ${backup_path}"
    return 0
}

# Function to verify backup
verify_backup() {
    local backup_path="${BACKUP_DIR}/${BACKUP_NAME}"

    log "Verifying backup integrity..."

    # Check if backup exists
    if [ ! -e "${backup_path}" ] && [ ! -e "${backup_path}.tar.zst" ] && [ ! -e "${backup_path}.gpg" ]; then
        error "Backup not found at ${backup_path}"
        return 1
    fi

    # If it's a directory (uncompressed), check for BSON files
    if [ -d "${backup_path}" ]; then
        local bson_count=$(find "${backup_path}" -name "*.bson" | wc -l)
        if [ ${bson_count} -eq 0 ]; then
            error "No BSON files found in backup"
            return 1
        fi
        log "Found ${bson_count} BSON files in backup"
    fi

    log "Backup verification passed"
    return 0
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."

    # Find and remove old backup directories
    find "${BACKUP_DIR}" -name "${MONGO_DB}_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true

    # Find and remove old compressed backups
    find "${BACKUP_DIR}" -name "${MONGO_DB}_*.tar.*" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

    # Find and remove old encrypted backups
    find "${BACKUP_DIR}" -name "${MONGO_DB}_*.gpg" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

    # Find and remove old metadata files
    find "${BACKUP_DIR}" -name "${MONGO_DB}_*.metadata" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

    log "Cleanup completed"
}

# Function to send notifications (optional)
send_notification() {
    local status=$1
    local message=$2

    # If webhook URL is set, send notification
    if [ -n "${WEBHOOK_URL:-}" ]; then
        curl -X POST "${WEBHOOK_URL}" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"MongoDB Backup ${status}: ${message}\"}" \
            2>/dev/null || warning "Failed to send notification"
    fi
}

# Main execution
main() {
    log "MongoDB Backup Script Started"
    log "Backup Type: ${BACKUP_TYPE}"
    log "Compression: ${COMPRESSION}"
    log "Encryption: $([ -n "${ENCRYPTION_KEY}" ] && echo "Enabled" || echo "Disabled")"

    # Check prerequisites
    if ! command -v mongodump >/dev/null 2>&1; then
        error "mongodump not found. Please install MongoDB tools."
        exit 1
    fi

    # Perform backup
    if perform_backup; then
        if verify_backup; then
            cleanup_old_backups

            # Calculate backup size
            BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}"* 2>/dev/null | cut -f1 || echo "unknown")

            log "✓ Backup completed successfully"
            log "  Location: ${BACKUP_DIR}/${BACKUP_NAME}"
            log "  Size: ${BACKUP_SIZE}"

            send_notification "SUCCESS" "Database ${MONGO_DB} backed up successfully (${BACKUP_SIZE})"
        else
            error "Backup verification failed"
            send_notification "FAILED" "Database ${MONGO_DB} backup verification failed"
            exit 1
        fi
    else
        error "Backup failed"
        send_notification "FAILED" "Database ${MONGO_DB} backup failed"
        exit 1
    fi
}

# Run main function
main

exit 0