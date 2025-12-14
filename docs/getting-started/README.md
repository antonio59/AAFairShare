# Getting Started

> Set up and run AAFairShare in minutes

## Overview

This guide will help you get AAFairShare running on your local machine for development or personal use.

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement                    | Version | Purpose                   |
| ------------------------------ | ------- | ------------------------- |
| [Node.js](https://nodejs.org/) | v18+    | JavaScript runtime        |
| [Bun](https://bun.sh/)         | Latest  | Package manager & runtime |
| [Git](https://git-scm.com/)    | Latest  | Version control           |

You'll also need:

- A [Convex](https://convex.dev) account (free tier available)
- A code editor (VS Code recommended)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/antonio59/aafairshare.git
cd aafairshare

# 2. Install dependencies
bun install

# 3. Set up Convex (follow prompts)
bun x convex dev

# 4. Start development server
bun run dev
```

The app will be available at `http://localhost:8080`

## Guides

| Guide                               | Description                        |
| ----------------------------------- | ---------------------------------- |
| [Installation](./installation.md)   | Detailed installation instructions |
| [Configuration](./configuration.md) | Environment variables and settings |
| [First Steps](./first-steps.md)     | Using the app for the first time   |

## Next Steps

1. **[Installation](./installation.md)** - Complete setup guide
2. **[Configuration](./configuration.md)** - Configure your environment
3. **[First Steps](./first-steps.md)** - Learn to use the app
4. **[Architecture](../architecture/README.md)** - Understand how it works
