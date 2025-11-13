# Pocketbase Schema Setup

Before running the migration script, you need to create these collections in your Pocketbase instance.

## Access Pocketbase Admin

1. Go to: `https://pb.aafairshare.online/_/`
2. Login with your admin credentials

---

## Collection 1: users (Auth Collection)

**Type**: Auth collection

### Fields:

| Field Name    | Type     | Required | Options                          |
|---------------|----------|----------|----------------------------------|
| username      | text     | Yes      | min: 3, max: 100                |
| email         | email    | Yes      | unique                           |
| avatar        | text     | No       | -                                |
| photo_url     | text     | No       | -                                |

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: Admin only
- **Update**: `id = @request.auth.id`
- **Delete**: Admin only

---

## Collection 2: categories

**Type**: Base collection

### Fields:

| Field Name | Type | Required | Options          |
|------------|------|----------|------------------|
| name       | text | Yes      | unique, max: 100 |
| color      | text | No       | max: 20          |
| icon       | text | No       | max: 50          |

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `@request.auth.id != ""`
- **Delete**: `@request.auth.id != ""`

---

## Collection 3: locations

**Type**: Base collection

### Fields:

| Field Name | Type | Required | Options          |
|------------|------|----------|------------------|
| name       | text | Yes      | unique, max: 100 |

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `@request.auth.id != ""`
- **Delete**: `@request.auth.id != ""`

---

## Collection 4: expenses

**Type**: Base collection

### Fields:

| Field Name   | Type     | Required | Options                    |
|--------------|----------|----------|----------------------------|
| amount       | number   | Yes      | min: 0                     |
| date         | date     | Yes      | -                          |
| month        | text     | Yes      | Format: YYYY-MM            |
| description  | text     | No       | max: 500                   |
| paid_by_id   | relation | Yes      | Single, Collection: users  |
| category_id  | relation | No       | Single, Collection: categories |
| location_id  | relation | No       | Single, Collection: locations |
| split_type   | text     | No       | max: 50                    |
| created_at   | date     | No       | auto on create             |
| updated_at   | date     | No       | auto on update             |

### Indexes:
- `month` (for faster queries)
- `date` (for sorting)
- `paid_by_id` (for user filtering)

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `@request.auth.id != ""`
- **Delete**: `@request.auth.id != ""`

---

## Collection 5: recurring

**Type**: Base collection

### Fields:

| Field Name   | Type     | Required | Options                        |
|--------------|----------|----------|--------------------------------|
| amount       | number   | Yes      | min: 0                         |
| description  | text     | No       | max: 500                       |
| category_id  | relation | No       | Single, Collection: categories |
| location_id  | relation | No       | Single, Collection: locations  |
| split_type   | text     | No       | max: 50                        |
| frequency    | text     | Yes      | max: 50                        |
| start_date   | date     | Yes      | -                              |
| end_date     | date     | No       | -                              |
| is_active    | bool     | Yes      | default: true                  |

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `@request.auth.id != ""`
- **Delete**: `@request.auth.id != ""`

---

## Collection 6: settlements

**Type**: Base collection

### Fields:

| Field Name | Type     | Required | Options                   |
|------------|----------|----------|---------------------------|
| month      | text     | Yes      | Format: YYYY-MM           |
| year       | number   | Yes      | -                         |
| amount     | number   | Yes      | min: 0                    |
| direction  | text     | Yes      | max: 50                   |
| user1_id   | relation | Yes      | Single, Collection: users |
| user2_id   | relation | Yes      | Single, Collection: users |
| created_at | date     | No       | auto on create            |

### Indexes:
- `month, year` (composite for faster queries)

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: Admin only
- **Delete**: Admin only

---

## Collection 7: shopping_lists (Optional)

**Type**: Base collection

### Fields:

| Field Name  | Type     | Required | Options                   |
|-------------|----------|----------|---------------------------|
| name        | text     | Yes      | max: 200                  |
| items       | json     | No       | -                         |
| created_by  | relation | Yes      | Single, Collection: users |
| created_at  | date     | No       | auto on create            |

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `created_by = @request.auth.id`
- **Delete**: `created_by = @request.auth.id`

---

## Quick Setup Script (via Pocketbase Console)

You can also use the Pocketbase JavaScript API to create collections programmatically. Here's a basic example:

```javascript
// In Pocketbase admin console (Settings → Import collections)
// Or use the migration script provided

// Example for creating a simple collection:
{
  "name": "categories",
  "type": "base",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": { "min": 1, "max": 100 }
    },
    {
      "name": "color",
      "type": "text",
      "required": false,
      "options": { "max": 20 }
    },
    {
      "name": "icon",
      "type": "text",
      "required": false,
      "options": { "max": 50 }
    }
  ]
}
```

---

## Verification Checklist

After creating collections:

- [ ] All 7 collections created
- [ ] Relation fields point to correct collections
- [ ] API rules are set appropriately
- [ ] Indexes created for performance
- [ ] Test creating a record in each collection via admin panel

---

## Next Steps

Once your Pocketbase schema is set up:

1. Set environment variables for migration script:
   ```bash
   # In .env file
   VITE_SUPABASE_URL=https://gsvyxsddmddipeoduyys.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Better for migration
   POCKETBASE_ADMIN_EMAIL=admin@example.com
   POCKETBASE_ADMIN_PASSWORD=your_admin_password
   ```

2. Run migration:
   ```bash
   node scripts/migrate-supabase-to-pocketbase.js
   ```

3. Verify data in Pocketbase admin panel

4. Test your application with migrated data

---

**Need Help?**  
- Pocketbase Docs: https://pocketbase.io/docs/collections/
- Schema validation: Check Pocketbase admin console for any errors
