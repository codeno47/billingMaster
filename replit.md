# Overview

This is an Employee Billing Management System built as a full-stack web application. The system allows administrators and finance managers to manage employee records, track billing information, and generate reports. It features role-based access control with two user types: administrators (full access) and finance managers (read-only access to most features). The application provides CRUD operations for employee data, CSV import/export functionality, and comprehensive billing analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation
- **File Structure**: Component-based architecture with shared utilities and hooks

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling CSV file uploads
- **Session Management**: Express sessions with PostgreSQL storage
- **CSV Processing**: Built-in CSV parser for bulk employee data import

## Authentication & Authorization
- **Authentication Provider**: Simple username/password authentication (replaced Replit SSO)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control with 'admin' and 'finance' roles
- **Route Protection**: Middleware-based authentication checks and frontend route guards
- **Predefined Users**: 
  - Admin: username='admin', password='admin123' (full access)
  - Finance: username='finance', password='finance123' (read-only access to most features)

## Data Storage
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle migrations for database versioning
- **Tables**: Users, employees, billing rates, projects, and sessions
- **Data Validation**: Zod schemas shared between frontend and backend

## Development Environment
- **Build System**: Vite for frontend bundling and development server
- **Development Mode**: Hot module replacement with error overlay
- **Production Build**: Static assets served by Express with API routes
- **Environment**: Replit-optimized with cartographer plugin for development

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment variable-based connection string

## Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Management**: PostgreSQL session store for persistent login state

## Development Tools
- **Replit Platform**: Development environment with built-in deployment
- **Vite Plugins**: Runtime error modal and cartographer for enhanced development experience

## UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Lucide React**: Icon library for consistent iconography
- **TanStack Query**: Data fetching and caching library

## File Processing
- **CSV Parse**: Library for parsing CSV files during bulk import operations
- **Multer**: Middleware for handling multipart form data and file uploads

## Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Utility for managing component variants
- **Tailwind Merge**: Utility for merging Tailwind CSS classes