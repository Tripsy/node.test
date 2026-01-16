#!/bin/bash
# generate-migration.sh

FEATURE=$1
ENTITY=$2
BASE_PATH="/var/www/html/src"
FEATURE_PATH="${BASE_PATH}/features/${FEATURE}"
ENTITY_PATH="${FEATURE_PATH}/${ENTITY}.entity.ts"
MIGRATION_NAME="${ENTITY}.migration.ts"
MIGRATION_PATH="${FEATURE_PATH}/database/${MIGRATION_NAME}"

TEMP_DIR="/commands/tmp"
TEMP_FILE="${TEMP_DIR}/data-source-${ENTITY}.ts"

# Create directories if they don't exist
mkdir -p "$FEATURE_DIR"
mkdir -p "$TEMP_DIR"

if [ ! -f "$ENTITY_PATH" ]; then
  echo "Error: Entity file not found: $ENTITY_PATH"
  exit 1
fi

echo "=== Generating migration for ${ENTITY} ==="
echo "Entity path: $ENTITY_PATH"

# Delete existing migration if it exists
if [ -f "$MIGRATION_PATH" ]; then
  echo "Deleting existing migration: $MIGRATION_PATH"
  rm "$MIGRATION_PATH"
fi

echo "Migration will be saved to: $MIGRATION_PATH"

cat > $TEMP_FILE << EOF
import { DataSource } from 'typeorm';
import { Configuration } from '$BASE_PATH/config/settings.config';
import { $ENTITY } from '$ENTITY_PATH';

// Create a custom data source with only the target entity
export default new DataSource({
  type: Configuration.get('database.connection') as 'postgres' | 'mariadb',
  host: Configuration.get<string>('database.host'),
  port: Configuration.get<number>('database.port'),
  username: Configuration.get<string>('database.username'),
  password: Configuration.get<string>('database.password'),
  database: Configuration.get<string>('database.name'),
  synchronize: false,
  logging: false,
  migrationsTableName: Configuration.get('database.connection') === 'postgres' ? 'system.migrations' : 'migrations',
  entities: [$ENTITY],  // Only include the target entity
  subscribers: [],
  poolSize: 10,
});
EOF

# Generate migration
pnpx tsx ./node_modules/typeorm/cli.js migration:generate \
  -d "$TEMP_FILE" \
  "$MIGRATION_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Successfully generated migration: $MIGRATION_NAME"
else
  echo "❌ Failed to generate migration"
  exit 1
fi

# Cleanup
rm "$TEMP_FILE"