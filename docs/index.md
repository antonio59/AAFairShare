# AAFairShare Documentation

> Complete documentation for the AAFairShare expense management application

## Quick Navigation

| Section                                        | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| [Getting Started](./getting-started/README.md) | Installation, setup, and first steps           |
| [Architecture](./architecture/README.md)       | System design, database schema, and tech stack |
| [Features](./features/README.md)               | Detailed feature documentation                 |
| [API Reference](./api/README.md)               | Convex functions and data models               |
| [Development](./development/README.md)         | Contributing, coding standards, testing        |
| [Deployment](./deployment/README.md)           | Production deployment guides                   |

---

## Overview

AAFairShare is a personal expense management application designed for couples or partners to track and split shared expenses fairly. Built with modern web technologies, it provides real-time synchronization, intuitive UI, and comprehensive analytics.

### Key Capabilities

- **Expense Tracking** - Log expenses with categories, locations, and receipts
- **Smart Splitting** - 50/50 or custom split options
- **Recurring Expenses** - Automated tracking for subscriptions and bills
- **Savings Goals** - Joint savings tracking with contribution history
- **Settlement Tracking** - Clear view of who owes whom
- **Analytics** - Spending patterns and trends visualization
- **Receipt Management** - Upload and organize receipts

### Tech Stack

| Layer          | Technology                                 |
| -------------- | ------------------------------------------ |
| Frontend       | React 19, TypeScript, Vite                 |
| UI Components  | shadcn/ui, Tailwind CSS                    |
| Backend        | Convex (serverless functions)              |
| Database       | Convex (real-time NoSQL)                   |
| Authentication | Convex Auth (Email/Password)               |
| Deployment     | Netlify (frontend), Convex Cloud (backend) |

---

## Documentation Structure

```
docs/
├── index.md                    # This file - documentation hub
├── getting-started/
│   ├── README.md              # Getting started overview
│   ├── installation.md        # Installation guide
│   ├── configuration.md       # Environment setup
│   └── first-steps.md         # Using the app for the first time
├── architecture/
│   ├── README.md              # Architecture overview
│   ├── tech-stack.md          # Technology decisions
│   ├── database-schema.md     # Convex schema documentation
│   ├── authentication.md      # Auth flow and security
│   └── folder-structure.md    # Project organization
├── features/
│   ├── README.md              # Features overview
│   ├── expenses.md            # Expense management
│   ├── recurring.md           # Recurring expenses
│   ├── settlements.md         # Settlement tracking
│   ├── savings-goals.md       # Savings goals feature
│   ├── analytics.md           # Analytics and reporting
│   └── receipts.md            # Receipt management
├── api/
│   ├── README.md              # API overview
│   ├── mutations.md           # Write operations
│   ├── queries.md             # Read operations
│   └── types.md               # TypeScript types
├── development/
│   ├── README.md              # Development overview
│   ├── contributing.md        # Contribution guidelines
│   ├── coding-standards.md    # Code style and conventions
│   ├── testing.md             # Testing strategies
│   └── troubleshooting.md     # Common issues and solutions
└── deployment/
    ├── README.md              # Deployment overview
    ├── convex-setup.md        # Convex deployment
    ├── netlify-setup.md       # Netlify deployment
    └── environment-vars.md    # Environment configuration
```

---

## Quick Links

### For Users

- [First Steps Guide](./getting-started/first-steps.md)
- [Feature Overview](./features/README.md)

### For Developers

- [Installation Guide](./getting-started/installation.md)
- [Architecture Overview](./architecture/README.md)
- [API Reference](./api/README.md)
- [Contributing Guide](./development/contributing.md)

### For DevOps

- [Deployment Guide](./deployment/README.md)
- [Environment Variables](./deployment/environment-vars.md)

---

## Version

Current Version: See [package.json](../package.json)

## License

MIT License - See [LICENSE](../LICENSE) for details.
