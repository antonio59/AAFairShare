# Changelog

All notable changes to AAFairShare will be documented in this file.

## [3.1.0] - 2024-12-02

### Added
- **Dark Mode** - Full dark theme support with system preference detection
  - Theme toggle in sidebar and header dropdown menu
  - Persistent theme preference stored locally
- **Receipt Storage** - Standalone receipt management
  - Take photo or upload from gallery
  - Store receipts independently from expenses
  - Grid view with search and filtering
  - Full-size viewer with download option
  - Receipts page accessible from sidebar
- **Receipt Attachments** - Attach photos to expenses
  - Camera capture or file upload when adding expenses
  - View attached receipts from expense details
- **Goal Milestones** - Savings goal progress celebrations
  - Visual badges at 25%, 50%, 75%, and 100% milestones
  - Toast notifications when milestones are reached
- **Monthly Savings Targets** - Enhanced goal planning
  - Set target dates for savings goals
  - Automatic monthly contribution suggestions
- **Quick Add Widget** - Floating action button with expense presets
  - 6 preset categories (Coffee, Groceries, Dining, Transport, Bills, Other)
  - Quick access to full expense form
- **Year-End Summary** - Comprehensive yearly analytics
  - Total spending, category breakdowns, trends
  - Accessible from Analytics page yearly tab
- **Export Functions** - Download expense data
  - CSV export for spreadsheet analysis
  - PDF export for records

### Changed
- **Avatar Display** - Simplified UI showing avatars only without usernames
- **Location Sorting** - Locations now sorted alphabetically in dropdowns
- **Mobile Experience** - Improved expense cards with dropdown menu actions

### Fixed
- Dark mode colors for sidebar, table headers, and navigation
- Standalone receipts display in grid view
- Filter logic for receipts without title/notes
- QuickStats using dashboard's selected month instead of current month
- Delete expense dialog prop name mismatch

### Security
- Removed .env from git history
- Cleaned up sensitive configuration files

---

## [3.0.0] - 2024-12-01

### Added
- **Convex Backend** - Complete migration from Supabase to Convex
  - Real-time data synchronization
  - Serverless functions for all operations
- **Convex Auth** - Google OAuth authentication
  - Simplified login with Google account
  - Secure token-based authentication
- **Email Notifications** - Resend integration
  - Settlement notification emails
  - Goal completion celebration emails
- **Individual Contributions** - Enhanced savings goals
  - Track who contributed what amount
  - Edit and delete individual contributions
  - Contribution breakdown in goal details

### Changed
- Database architecture from Supabase PostgreSQL to Convex
- Authentication from Supabase Auth to Convex Auth with Google OAuth
- All API calls converted to Convex queries and mutations

### Removed
- Supabase client and dependencies
- Auth0 integration (replaced with Convex Auth)
- Legacy documentation files

---

## [2.x.x] - Previous Versions

### Features (inherited)
- Expense tracking with categories and locations
- Settlement calculations between two users
- Recurring expense management
- Savings goals with contributions
- Analytics and spending insights
- PWA support for mobile installation
