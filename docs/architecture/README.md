# Architecture Overview

> System design and technical architecture of AAFairShare

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React Application                        ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ ││
│  │  │  Pages   │  │Components│  │  Hooks   │  │  Providers  │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                    Convex React Client                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ WebSocket (Real-time)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Cloud                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Convex Functions                          ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ ││
│  │  │ Queries  │  │Mutations │  │ Actions  │  │  Internal   │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Convex Database                          ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  ││
│  │  │ users  │ │expenses│ │recurring│ │savings │ │settlements│ ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Technology       | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| **React 19**     | UI framework with latest features (useActionState) |
| **TypeScript**   | Type safety and developer experience               |
| **Vite**         | Fast build tool and dev server                     |
| **Tailwind CSS** | Utility-first styling                              |
| **shadcn/ui**    | Accessible component library                       |
| **React Router** | Client-side routing                                |
| **Lucide React** | Icon library                                       |
| **Recharts**     | Data visualization                                 |
| **date-fns**     | Date manipulation                                  |

### Backend

| Technology         | Purpose                     |
| ------------------ | --------------------------- |
| **Convex**         | Serverless backend platform |
| **Convex Auth**    | Authentication system       |
| **Convex Storage** | File storage for receipts   |

### Infrastructure

| Service            | Purpose                  |
| ------------------ | ------------------------ |
| **Netlify**        | Frontend hosting and CDN |
| **Convex Cloud**   | Backend hosting          |
| **GitHub Actions** | CI/CD pipelines          |

## Design Patterns

### Component Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── expense/        # Expense-related components
│   ├── layout/         # Layout components
│   └── analytics/      # Analytics components
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
├── providers/          # Context providers
└── services/           # Business logic services
```

### Data Flow

1. **User Action** → Component triggers mutation/query
2. **Convex Client** → Sends request via WebSocket
3. **Convex Function** → Processes request, validates, updates DB
4. **Real-time Sync** → All connected clients receive updates
5. **React Re-render** → UI updates automatically

### State Management

- **Server State**: Convex (useQuery, useMutation)
- **Auth State**: AuthContext (React Context)
- **Theme State**: ThemeContext (React Context)
- **Form State**: React useState / useActionState
- **UI State**: Component-local state

## Documentation

| Document                                  | Description                   |
| ----------------------------------------- | ----------------------------- |
| [Tech Stack](./tech-stack.md)             | Detailed technology decisions |
| [Database Schema](./database-schema.md)   | Convex schema documentation   |
| [Authentication](./authentication.md)     | Auth flow and security        |
| [Folder Structure](./folder-structure.md) | Project organization          |

## Key Design Decisions

### Why Convex?

1. **Real-time by default** - No polling, instant updates
2. **Type-safe** - End-to-end TypeScript
3. **Serverless** - No infrastructure management
4. **Integrated auth** - Built-in authentication
5. **File storage** - Native storage for receipts

### Why shadcn/ui?

1. **Accessible** - ARIA-compliant components
2. **Customizable** - Copy/paste, fully editable
3. **Modern** - Radix UI primitives
4. **Consistent** - Design system ready

### Why Closed Registration?

- Personal app for specific users
- Enhanced security (no public signup)
- Simplified user management
- Rate limiting on login attempts

## Security Considerations

- **Authentication**: JWT-based with bcrypt password hashing
- **Authorization**: All Convex functions check auth
- **Rate Limiting**: Login attempts limited (5 per 5 min)
- **Input Validation**: Server-side validation on all mutations
- **HTTPS**: Enforced in production

## Performance Optimizations

- **Code Splitting**: Lazy-loaded routes
- **Bundle Chunking**: Vendor and UI separated
- **Batch Fetching**: Efficient database queries
- **Real-time Sync**: No polling overhead

## Next Steps

- [Tech Stack Details](./tech-stack.md)
- [Database Schema](./database-schema.md)
- [Authentication](./authentication.md)
