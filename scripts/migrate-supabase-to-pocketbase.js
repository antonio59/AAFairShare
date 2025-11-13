#!/usr/bin/env node

/**
 * Migration Script: Supabase → Pocketbase
 * 
 * This script migrates all data from Supabase to Pocketbase
 * 
 * Prerequisites:
 * 1. Supabase credentials in environment
 * 2. Pocketbase instance running at VITE_POCKETBASE_URL
 * 3. Pocketbase collections created (see POCKETBASE_SCHEMA.md)
 * 
 * Usage:
 *   node scripts/migrate-supabase-to-pocketbase.js
 */

import PocketBase from 'pocketbase'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gsvyxsddmddipeoduyys.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'https://pb.aafairshare.online'
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD

// Check required environment variables
if (!SUPABASE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required')
  console.error('Add to .env file or set as environment variable')
  process.exit(1)
}

if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
  console.error('❌ Error: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required')
  console.error('Add to .env file:')
  console.error('  POCKETBASE_ADMIN_EMAIL=admin@example.com')
  console.error('  POCKETBASE_ADMIN_PASSWORD=your_admin_password')
  process.exit(1)
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const pb = new PocketBase(POCKETBASE_URL)

// Migration statistics
const stats = {
  users: { success: 0, failed: 0, skipped: 0 },
  categories: { success: 0, failed: 0, skipped: 0 },
  locations: { success: 0, failed: 0, skipped: 0 },
  expenses: { success: 0, failed: 0, skipped: 0 },
  recurring: { success: 0, failed: 0, skipped: 0 },
  settlements: { success: 0, failed: 0, skipped: 0 }
}

// ID mappings for referential integrity
const idMaps = {
  users: new Map(),
  categories: new Map(),
  locations: new Map()
}

async function authenticatePocketbase() {
  console.log('\n🔐 Authenticating with Pocketbase admin...')
  try {
    await pb.admins.authWithPassword(POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD)
    console.log('✅ Authenticated successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.message)
    return false
  }
}

async function migrateUsers() {
  console.log('\n👥 Migrating users...')
  
  try {
    // Fetch users from Supabase auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching Supabase users:', authError)
      return false
    }

    console.log(`Found ${authUsers.users.length} users in Supabase`)

    for (const user of authUsers.users) {
      try {
        // Check if user already exists in Pocketbase
        let pbUser = null
        try {
          pbUser = await pb.collection('users').getFirstListItem(`email="${user.email}"`)
          console.log(`⏭️  User ${user.email} already exists, skipping`)
          idMaps.users.set(user.id, pbUser.id)
          stats.users.skipped++
          continue
        } catch (e) {
          // User doesn't exist, proceed with creation
        }

        // Create user in Pocketbase
        const pbUserData = {
          email: user.email,
          username: user.user_metadata?.username || user.email.split('@')[0],
          emailVisibility: true,
          password: 'changeme123', // Users will need to reset
          passwordConfirm: 'changeme123',
          avatar: user.user_metadata?.avatar_url || '',
          photo_url: user.user_metadata?.photo_url || ''
        }

        const createdUser = await pb.collection('users').create(pbUserData)
        idMaps.users.set(user.id, createdUser.id)
        stats.users.success++
        console.log(`✅ Migrated user: ${user.email}`)
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message)
        stats.users.failed++
      }
    }

    console.log(`✅ Users migration complete: ${stats.users.success} succeeded, ${stats.users.skipped} skipped, ${stats.users.failed} failed`)
    return true
  } catch (error) {
    console.error('❌ User migration failed:', error)
    return false
  }
}

async function migrateCategories() {
  console.log('\n📁 Migrating categories...')
  
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')

    if (error) {
      console.error('❌ Error fetching categories:', error)
      return false
    }

    console.log(`Found ${categories?.length || 0} categories in Supabase`)

    for (const category of categories || []) {
      try {
        // Check if category exists
        let pbCategory = null
        try {
          pbCategory = await pb.collection('categories').getFirstListItem(`name="${category.name}"`)
          console.log(`⏭️  Category "${category.name}" already exists, skipping`)
          idMaps.categories.set(category.id, pbCategory.id)
          stats.categories.skipped++
          continue
        } catch (e) {
          // Category doesn't exist
        }

        const createdCategory = await pb.collection('categories').create({
          name: category.name,
          color: category.color || '',
          icon: category.icon || ''
        })
        
        idMaps.categories.set(category.id, createdCategory.id)
        stats.categories.success++
        console.log(`✅ Migrated category: ${category.name}`)
      } catch (error) {
        console.error(`❌ Failed to migrate category ${category.name}:`, error.message)
        stats.categories.failed++
      }
    }

    console.log(`✅ Categories migration complete: ${stats.categories.success} succeeded, ${stats.categories.skipped} skipped, ${stats.categories.failed} failed`)
    return true
  } catch (error) {
    console.error('❌ Categories migration failed:', error)
    return false
  }
}

async function migrateLocations() {
  console.log('\n📍 Migrating locations...')
  
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')

    if (error) {
      console.error('❌ Error fetching locations:', error)
      return false
    }

    console.log(`Found ${locations?.length || 0} locations in Supabase`)

    for (const location of locations || []) {
      try {
        // Check if location exists
        let pbLocation = null
        try {
          pbLocation = await pb.collection('locations').getFirstListItem(`name="${location.name}"`)
          console.log(`⏭️  Location "${location.name}" already exists, skipping`)
          idMaps.locations.set(location.id, pbLocation.id)
          stats.locations.skipped++
          continue
        } catch (e) {
          // Location doesn't exist
        }

        const createdLocation = await pb.collection('locations').create({
          name: location.name
        })
        
        idMaps.locations.set(location.id, createdLocation.id)
        stats.locations.success++
        console.log(`✅ Migrated location: ${location.name}`)
      } catch (error) {
        console.error(`❌ Failed to migrate location ${location.name}:`, error.message)
        stats.locations.failed++
      }
    }

    console.log(`✅ Locations migration complete: ${stats.locations.success} succeeded, ${stats.locations.skipped} skipped, ${stats.locations.failed} failed`)
    return true
  } catch (error) {
    console.error('❌ Locations migration failed:', error)
    return false
  }
}

async function migrateExpenses() {
  console.log('\n💰 Migrating expenses...')
  
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('❌ Error fetching expenses:', error)
      return false
    }

    console.log(`Found ${expenses?.length || 0} expenses in Supabase`)

    for (const expense of expenses || []) {
      try {
        // Map foreign keys
        const paidById = idMaps.users.get(expense.paid_by_id)
        const categoryId = idMaps.categories.get(expense.category_id)
        const locationId = idMaps.locations.get(expense.location_id)

        if (!paidById) {
          console.warn(`⚠️  Skipping expense: user ${expense.paid_by_id} not found`)
          stats.expenses.skipped++
          continue
        }

        const expenseData = {
          amount: expense.amount,
          date: expense.date,
          month: expense.month,
          description: expense.description || '',
          paid_by_id: paidById,
          category_id: categoryId || '',
          location_id: locationId || '',
          split_type: expense.split_type || '50/50',
          created_at: expense.created_at || new Date().toISOString(),
          updated_at: expense.updated_at || new Date().toISOString()
        }

        await pb.collection('expenses').create(expenseData)
        stats.expenses.success++
        
        if (stats.expenses.success % 10 === 0) {
          console.log(`✅ Migrated ${stats.expenses.success} expenses...`)
        }
      } catch (error) {
        console.error(`❌ Failed to migrate expense:`, error.message)
        stats.expenses.failed++
      }
    }

    console.log(`✅ Expenses migration complete: ${stats.expenses.success} succeeded, ${stats.expenses.skipped} skipped, ${stats.expenses.failed} failed`)
    return true
  } catch (error) {
    console.error('❌ Expenses migration failed:', error)
    return false
  }
}

async function migrateRecurring() {
  console.log('\n🔄 Migrating recurring expenses...')
  
  try {
    const { data: recurring, error } = await supabase
      .from('recurring')
      .select('*')

    if (error) {
      console.error('❌ Error fetching recurring expenses:', error)
      return false
    }

    console.log(`Found ${recurring?.length || 0} recurring expenses in Supabase`)

    for (const rec of recurring || []) {
      try {
        // Map foreign keys
        const categoryId = idMaps.categories.get(rec.category_id)
        const locationId = idMaps.locations.get(rec.location_id)

        const recurringData = {
          amount: rec.amount,
          description: rec.description || '',
          category_id: categoryId || '',
          location_id: locationId || '',
          split_type: rec.split_type || '50/50',
          frequency: rec.frequency,
          start_date: rec.start_date,
          end_date: rec.end_date || '',
          is_active: rec.is_active !== false
        }

        await pb.collection('recurring').create(recurringData)
        stats.recurring.success++
        console.log(`✅ Migrated recurring expense: ${rec.description}`)
      } catch (error) {
        console.error(`❌ Failed to migrate recurring expense:`, error.message)
        stats.recurring.failed++
      }
    }

    console.log(`✅ Recurring expenses migration complete: ${stats.recurring.success} succeeded, ${stats.recurring.skipped} skipped, ${stats.recurring.failed} failed`)
    return true
  } catch (error) {
    console.error('❌ Recurring expenses migration failed:', error)
    return false
  }
}

async function migrateSettlements() {
  console.log('\n💳 Migrating settlements...')
  
  try {
    const { data: settlements, error } = await supabase
      .from('settlements')
      .select('*')

    if (error) {
      console.error('❌ Error fetching settlements:', error)
      return false
    }

    console.log(`Found ${settlements?.length || 0} settlements in Supabase`)

    for (const settlement of settlements || []) {
      try {
        // Map foreign keys
        const user1Id = idMaps.users.get(settlement.user1_id)
        const user2Id = idMaps.users.get(settlement.user2_id)

        if (!user1Id || !user2Id) {
          console.warn(`⚠️  Skipping settlement: users not found`)
          stats.settlements.skipped++
          continue
        }

        const settlementData = {
          month: settlement.month,
          year: settlement.year,
          amount: settlement.amount,
          direction: settlement.direction,
          user1_id: user1Id,
          user2_id: user2Id,
          created_at: settlement.created_at || new Date().toISOString()
        }

        await pb.collection('settlements').create(settlementData)
        stats.settlements.success++
        console.log(`✅ Migrated settlement: ${settlement.month} ${settlement.year}`)
      } catch (error) {
        console.error(`❌ Failed to migrate settlement:`, error.message)
        stats.settlements.failed++
      }
    }

    console.log(`✅ Settlements migration complete: ${stats.settlements.success} succeeded, ${stats.settlements.skipped} skipped, ${stats.settlements.failed} failed`)
    return true
  } catch (error) {
    console.error('❌ Settlements migration failed:', error)
    return false
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  
  for (const [collection, stat] of Object.entries(stats)) {
    const total = stat.success + stat.failed + stat.skipped
    console.log(`\n${collection.toUpperCase()}:`)
    console.log(`  ✅ Success: ${stat.success}`)
    console.log(`  ⏭️  Skipped: ${stat.skipped}`)
    console.log(`  ❌ Failed:  ${stat.failed}`)
    console.log(`  📊 Total:   ${total}`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Migration complete!')
  console.log('='.repeat(60))
}

async function main() {
  console.log('🚀 Starting Supabase → Pocketbase Migration')
  console.log('='.repeat(60))
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`Pocketbase URL: ${POCKETBASE_URL}`)
  console.log('='.repeat(60))

  // Authenticate with Pocketbase
  if (!await authenticatePocketbase()) {
    console.error('❌ Migration aborted: Could not authenticate with Pocketbase')
    process.exit(1)
  }

  // Run migrations in order (respecting foreign key dependencies)
  await migrateUsers()
  await migrateCategories()
  await migrateLocations()
  await migrateExpenses()
  await migrateRecurring()
  await migrateSettlements()

  // Print summary
  await printSummary()

  console.log('\n⚠️  IMPORTANT POST-MIGRATION STEPS:')
  console.log('1. Users need to reset their passwords (set to "changeme123")')
  console.log('2. Verify data integrity in Pocketbase admin panel')
  console.log('3. Test authentication and core features')
  console.log('4. Update your deployment with new environment variables')
}

// Run migration
main().catch(error => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
