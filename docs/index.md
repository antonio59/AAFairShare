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

- **Expense Tracking** - Log expenses with categories, locations, who paid and receipts
- **Smart Splitting** - 50/50, or owed in full by the other person
- **Recurring Expenses** - Automated tracking for subscriptions and bills
- **Settlement Tracking** - Clear view of who owes whom, in whole pence, with settled months protected
- **Shared Refund Credits** - Refunds on household bills used automatically, oldest first, with unused credit shown separately
- **Activity Feed** - Searchable history of who did what
- **Savings Goals** - Joint savings tracking with contribution history
- **Analytics** - Spending patterns and trends visualization
- **Documents** - Upload and organize receipts, bills and warranties

### Tech Stack

| Layer          | Technology                                 |
| -------------- | ------------------------------------------ |
| Frontend       | React 19, TypeScript, Vite                 |
| UI Components  | shadcn/ui, Tailwind CSS                    |
| Backend        | Convex (serverless functions)              |
| Database       | Convex (real-time NoSQL)                   |
| Authentication | Convex Auth (Email/Password)               |
| Deployment     | Cloudflare (frontend), Convex Cloud (backend) |

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
│   ├── database-schema.md     # Convex schema documentation
│   └── folder-structure.md    # Project organization
├── features/
│   ├── README.md              # Features overview
│   └── refund-credits.md      # Shared refund credits
├── api/
│   └── README.md              # Convex functions overview
├── development/
│   └── README.md              # Development overview
└── deployment/
    └── README.md              # Deployment overview
```

---

## Quick Links

### For Users

- [First Steps Guide](./getting-started/first-steps.md)
- [Feature Overview](./features/README.md)
- [Shared Refund Credits](./features/refund-credits.md)

### For Developers

- [Installation Guide](./getting-started/installation.md)
- [Architecture Overview](./architecture/README.md)
- [API Reference](./api/README.md)
- [Development Guide](./development/README.md)

### For DevOps

- [Deployment Guide](./deployment/README.md)

---

## Version

Current version: **3.5.0**. The number lives in [package.json](../package.json); the app reads it at build time and shows it, with the version history, under Settings → About. Release notes are in [CHANGELOG.md](../CHANGELOG.md).

## License

MIT License - See [LICENSE](../LICENSE) for details.
