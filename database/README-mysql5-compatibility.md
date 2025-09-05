# MySQL 5.7 Compatibility Schema

This document explains the MySQL 5.7 compatible schema conversion from the original MySQL 8.0 schema.

## Files Overview

- `schema.sql` - Original MySQL 8.0 schema (from production server 10.74.100.30)
- `schema-mysql5.sql` - MySQL 5.7 compatible version
- `README-mysql5-compatibility.md` - This documentation

## Conversion Changes Made

### 1. UUID Generation (Major Change)

**MySQL 8.0 (Original):**
```sql
`id` char(36) NOT NULL DEFAULT (uuid())
```

**MySQL 5.7 (Converted):**
```sql
-- Custom UUID function
CREATE FUNCTION uuid_v4() RETURNS CHAR(36) ...

-- Table definition
`id` char(36) NOT NULL,

-- Trigger for each table
CREATE TRIGGER tablename_uuid_trigger 
BEFORE INSERT ON tablename 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END
```

### 2. JSON Data Type Conversion

**MySQL 8.0 (Original):**
```sql
`settings` json DEFAULT NULL,
`platforms` json NOT NULL DEFAULT (_utf8mb4'[chatgpt, gemini, perplexity, claude]'),
```

**MySQL 5.7 (Converted):**
```sql
`settings` longtext,
`platforms` longtext NOT NULL,

-- With trigger-based defaults
CREATE TRIGGER tracking_settings_uuid_trigger 
BEFORE INSERT ON tracking_settings 
FOR EACH ROW 
BEGIN 
    IF NEW.platforms IS NULL OR NEW.platforms = '' THEN
        SET NEW.platforms = '["chatgpt", "gemini", "perplexity", "claude"]';
    END IF;
    IF NEW.settings IS NULL OR NEW.settings = '' THEN
        SET NEW.settings = '{}';
    END IF;
END
```

### 3. Collation Updates

**MySQL 8.0 (Original):**
```sql
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

**MySQL 5.7 (Converted):**
```sql
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 4. MySQL Version-Specific Comments

Removed MySQL 8.0 specific version comments and replaced with 5.7 compatible syntax.

## Schema Statistics

- **Tables Created**: 19
- **Triggers Created**: 19 (one per table for UUID generation)
- **UUID Function**: 1 custom function
- **JSON Fields Converted**: 25 fields converted from `json` to `longtext`

## Application Compatibility

### No Code Changes Required

The application code **remains unchanged** because:

1. **Sequelize ORM Abstraction**: Sequelize handles the JSON serialization/deserialization automatically for `longtext` fields
2. **UUID Generation**: Application still works with UUID primary keys
3. **Data Types**: All data types remain functionally equivalent

### JSON Field Handling

The application will continue to work with JSON fields as before:

```typescript
// This still works in application code
const settings = {
  platforms: ['chatgpt', 'gemini'],
  alertsEnabled: false
};

await TrackingSettings.create({
  organizationId: 'uuid-here',
  settings: settings  // Sequelize automatically stringifies
});

// Reading also works the same
const record = await TrackingSettings.findByPk(id);
console.log(record.settings.platforms); // Sequelize auto-parses JSON
```

## Deployment Instructions

### For New MySQL 5.7 Installation

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p exchange_geo < database/schema-mysql5.sql

# Verify installation
mysql -u root -p exchange_geo -e "SHOW TABLES; SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema='exchange_geo';"
```

### For Migration from MySQL 8.0

```bash
# Backup existing data
mysqldump -u root -p exchange_geo > backup_data.sql

# Drop and recreate with new schema
mysql -u root -p -e "DROP DATABASE exchange_geo; CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p exchange_geo < database/schema-mysql5.sql

# Restore data (may need manual adjustments for UUID fields)
mysql -u root -p exchange_geo < backup_data.sql
```

## AI Search Extension Tables

All AI Search extension tables are fully converted and compatible:

### 1. Keywords Management
- ✅ `keywords` table with intent classification
- ✅ UUID trigger for primary keys
- ✅ Full-text search capabilities maintained

### 2. Tracking Configuration
- ✅ `tracking_settings` table with JSON defaults
- ✅ `platform_settings` table with enum constraints
- ✅ All foreign key relationships preserved

### 3. Competitor Analysis
- ✅ `competitors` table with domain tracking
- ✅ Unique constraints for organization isolation
- ✅ Analysis status tracking

### 4. AI Tracking Results
- ✅ `ai_tracking_results` table with longtext JSON fields
- ✅ All indexes preserved for query performance
- ✅ Foreign key cascading rules maintained

## Performance Considerations

### Indexes
All indexes from the original schema are preserved:
- Primary keys
- Foreign key indexes
- Composite indexes for query optimization
- Unique constraints for data integrity

### JSON Performance
Using `longtext` instead of native `json` type:
- **Pros**: Compatible with MySQL 5.7
- **Cons**: No native JSON functions (but rarely used in this application)
- **Impact**: Minimal, as application handles JSON through ORM

## Testing

### Schema Validation

```sql
-- Test UUID generation
INSERT INTO organizations (name) VALUES ('Test Org');
SELECT id, name FROM organizations WHERE name = 'Test Org';

-- Test JSON field handling  
INSERT INTO tracking_settings (organization_id) 
SELECT id FROM organizations WHERE name = 'Test Org' LIMIT 1;
SELECT platforms, settings FROM tracking_settings LIMIT 1;

-- Test foreign key constraints
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE 
FROM information_schema.table_constraints 
WHERE table_schema = 'exchange_geo' 
AND constraint_type = 'FOREIGN KEY';
```

### Application Testing

```bash
# Test application startup
npm run dev

# Test API endpoints
npm run test:api:simple

# Verify database connections
curl http://localhost:8000/health
```

## Troubleshooting

### Common Issues

1. **UUID Function Missing**
   ```sql
   -- Check if function exists
   SHOW FUNCTION STATUS WHERE Name = 'uuid_v4';
   
   -- If missing, reimport the function definition
   ```

2. **JSON Field Parsing Issues**
   ```javascript
   // Ensure JSON is valid in application
   const settings = JSON.parse(record.settings || '{}');
   ```

3. **Character Set Issues**
   ```sql
   -- Verify charset
   SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
   FROM information_schema.SCHEMATA 
   WHERE SCHEMA_NAME = 'exchange_geo';
   ```

## Version Compatibility

- ✅ **MySQL 5.7.8+**: Fully compatible
- ✅ **MySQL 8.0+**: Also compatible (can use either schema)
- ❌ **MySQL 5.6 and below**: Not compatible (missing JSON support simulation)

## Conclusion

This MySQL 5.7 compatible schema maintains 100% functional compatibility with the application while providing compatibility with older MySQL versions. All AI Search extension features, multi-tenant architecture, and performance optimizations are preserved.