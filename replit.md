# WalletCheck - MultiChain Balance Checker

## Overview

WalletCheck is a full-stack web application that allows users to check cryptocurrency wallet balances across multiple blockchain networks. The application supports Ethereum, Bitcoin, Polygon, and Binance Smart Chain (BSC) networks, providing real-time balance information with USD value conversion. It features a modern React frontend with a clean, responsive UI and an Express.js backend with PostgreSQL database integration for wallet and balance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development**: Hot module replacement via Vite integration in development mode

### Data Storage
- **Database**: PostgreSQL with connection pooling via Neon Database serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Database migrations handled through Drizzle Kit
- **Fallback Storage**: In-memory storage implementation for development/testing
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Authentication & Authorization
- **Session-based**: Uses Express sessions with PostgreSQL session store
- **Address Validation**: Client-side and server-side validation for different network address formats
- **CORS**: Configured for cross-origin requests with credential support

### Blockchain Integration
- **Multi-Network Support**: Ethereum, Bitcoin, Polygon, and BSC network compatibility
- **Address Validation**: Network-specific address format validation (EIP-55 for Ethereum-compatible, Base58 for Bitcoin)
- **Balance Fetching**: Blockchain API integration for real-time balance retrieval
- **USD Conversion**: Real-time cryptocurrency to USD price conversion

### External Dependencies

- **Database**: Neon Database (PostgreSQL serverless) for production data storage
- **UI Framework**: Radix UI for accessible, unstyled components
- **Styling**: Tailwind CSS for utility-first styling
- **Validation**: Zod for runtime type checking and validation
- **HTTP Client**: Native Fetch API with custom request wrapper
- **Development Tools**: Replit integration for development environment
- **Blockchain APIs**: External cryptocurrency APIs for balance and price data (implementation-specific)
- **Session Store**: PostgreSQL-based session storage for user state management