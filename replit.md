# Overview

This is the Elixr Labs Billing System built as a full-stack web application. The system allows administrators and finance managers to manage employee records, track billing information, and generate reports. It features role-based access control with two user types: administrators (full access) and finance managers (read-only access to most features). The application provides CRUD operations for employee data, CSV import/export functionality, and comprehensive billing analytics.

## Recent Changes (August 2025)
- Fixed database connection issues with Neon PostgreSQL by optimizing websocket configuration
- Resolved CSV export routing conflict by moving export route before /:id parameter route
- Updated CSV export format to match provided template with proper formatting:
  - SLNO, Name, Rate ($X.XX), Role, Cost-Centre, Team, C-ID, Start-Date, End-Date, Status (Active/Inactive), Band, SOW-ID, Appx Billing ($X,XXX.XX), Shift, Comments
- Enhanced export functionality with proper number formatting and error handling
- Fixed change reports to show newly added employees by setting changesSummary during employee creation
- Enhanced delete functionality to track employee deletions in change reports instead of permanent removal
- Modified employee queries to exclude deleted employees from regular listings while preserving deletion history
- Added new monthly billing per cost centre report with comprehensive analytics and CSV export functionality
- Implemented tabbed interface in reports page to separate change tracking and billing analysis
- Created comprehensive use case testing document (USE_CASES.md) covering all application functionality, user roles, and edge cases
- Implemented 30-minute session timeout with activity monitoring and user warning system
- Added automatic session expiry with 2-minute warning dialog before logout
- Enhanced security with rolling session expiry that resets on user activity
- Added "Reset Filters" button to Employee module for clearing all applied filters at once
- Enhanced filter UI with active filter count indicator and improved organization
- Fixed export functionality to respect applied filters and export only visible filtered records instead of entire dataset
- Enhanced employee form validation to enforce required fields (Name, Cost Centre, Start Date, Shift, Status, Team)
- Added visual indicators for mandatory fields with asterisks and improved error messaging
- Implemented comprehensive date validation for DD-MM-YYYY format with invalid date rejection
- Added cross-field validation to ensure start date is before end date
- Added character limit validation for comments field (256 characters max) with real-time character count
- Implemented calendar date picker components for Start Date and End Date fields to improve user experience
- Created reusable DatePicker component with DD-MM-YYYY format support and popover calendar interface
- Enhanced CSV import validation to prevent importing empty files with appropriate error messages
- Added validation for CSV files with no data records and improved user feedback
- Enhanced Billing Management with comprehensive filtering and pagination capabilities
- Added sortable columns, search functionality, and rate range filters to billing page
- Implemented responsive pagination with page navigation and records per page options
- Added comprehensive pagination to Reports module with filtering, sorting, and page navigation
- Implemented real-time cache invalidation for Reports module to ensure immediate updates when employee data changes
- Fixed synchronization issue between Employee and Reports modules - status changes now reflect immediately without manual refresh
- Enhanced all employee mutations (create, update, delete, import, clear) to invalidate reports cache for seamless data consistency
- Fixed Cost Centre Billing report CSV export to include billing percentage values matching the on-screen report data

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