#!/bin/bash
# feature-setup.sh

FEATURE=$1
MODE=$2 # install / remove / upgrade
BASE_PATH="/var/www/html"

BASE_FEATURE_PATH="${BASE_PATH}/src/features"
FEATURE_PATH="{$BASE_FEATURE_PATH}/${FEATURE}"

BASE_SOURCE_PATH="${BASE_PATH}/packages"
SOURCE_PATH="${BASE_SOURCE_PATH}/${FEATURE}"

HISTORY_FILE = "${BASE_PATH}/history.txt"

<<< Notes for AI Agent
The manifest.json structure is always like:

{
  "name": "account",
  "version": "1.0.0",
  "target": [
    "src/features/account"
  ],
  "migrations": true,
  "db_tables": ["account_recovery", "account_token"],
  "depends_on": ["user"]
}
>>>


echo "=== Setup feature ${ENTITY} ==="

some spaces

echo IMPORTANT NOTES
echo Make sure you have a rollback plan. Use git to record your development progress
echo Database structure changes could happend.
echo WARNING! Existing data will be lost from dropped tables


if $MODE = remove
{

    Check if $FEATURE_PATH exist
        if it doesn't exist
        show error message -> 'Feature $FEATURE is not installed"
        show error message -> 'Try a fresh install"
        abort further execution

  show confirmation message: Are you sure you want to remove ${FEATURE} and related DB structure & data? No / Yes
  on no
   show message: "Delete procedure aborted by user request"

  on yes

    PARSE $FEATURE_PATH/manifest.json
   if file doesn't exist
   show error message -> 'Could not locate "$FEATURE_PATH/manifest.json"
   show error message -> 'Delete procedure aborted"
   show error message -> 'Feature has to be removed manually"

   EXTRACT INFO

   CHECK if value extract for key 'depends_on` has value:
     If so iterate through values and see if any BASE_FEATURE_PATH/iterated_value exist
     show error message -> 'Delete procedure aborted"
     show error message -> 'Following features need to be removed first: " >> show iterated values

     abort further execution

   show confirmation message "Are you sure you want to remove $FEATIRE?" No / Yes
   On no
    abort further execution


   EXTRACT "db_tables" value from manifest.json
   show confirmation message: Following DB tables will be dropped: >>> list actual db_tables values  . Are you sure you want to continue? No / Yes

  On no
    show message: "Delete procedure aborted by user request"

  On yes
    iterates through them and DROP database table
    write message to HISTORY text: ${TIMESTAMP} Database ${DB_TABLE} removed

    On error
      show error message: Delete procedure aborted
      echo show the actual error message
      abort further execution

    remove folder FEATURE_PATH exist
    write message to HISTORY text: ${TIMESTAMP} Feature ${FEATURE} removed

    show message: "Feature ${FEATURE} removed with success""
}}

Check if $SOURCE_PATH exist
    if it doesn't exist
    show error message
    abort further execution

IF $MODE = upgrade
{
  Check if $FEATURE_PATH exist
      if it doesn't exist
      show error message -> 'Feature $FEATURE is not installed"
      show error message -> 'Try a fresh install"
      abort further execution
}

PARSE $SOURCE_PATH/manifest.json
 if file doesn't exist
 show error message -> 'Could not find $SOURCE_PATH/manifest.json
 abort further execution

EXTRACT info



IF $MODE = upgrade {
  PARSE $FEATURE_PATH/manifest.json
 if file doesn't exist
 show error message -> 'Could not locate "$FEATURE_PATH/manifest.json"
 show error message -> 'Upgrade procedure aborted"
 show error message -> 'First remove existing $FEATURE"

 abort further execution
}

# Create directories if they don't exist
mkdir -p "$FEATURE_DIR"
mkdir -p "$TEMP_DIR"

if [ ! -f "$ENTITY_PATH" ]; then
  echo "Error: Entity file not found: $ENTITY_PATH"
  exit 1
fi


echo "Entity path: $ENTITY_PATH"
  "$MIGRATION_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Successfully generated migration: $MIGRATION_NAME"
else
  echo "❌ Failed to generate migration"
  exit 1
fi

# Cleanup
rm "$TEMP_FILE"