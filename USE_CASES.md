# Employee Billing Management System - Use Case Testing Document

## Overview
This document provides comprehensive test scenarios for the Employee Billing Management System. The application features role-based access control, employee data management, CSV import/export, and advanced reporting with analytics.

## Test Credentials
- **Admin User**: username=`admin`, password=`admin123` (Full access)
- **Finance User**: username=`finance`, password=`finance123` (Read-only access to most features)

## Use Case Categories

### 1. Authentication & Authorization Testing

#### UC-1.1: Admin Login
**Objective**: Verify admin can log in and access all features
**Steps**:
1. Navigate to the application
2. Enter username: `admin`, password: `admin123`
3. Click Login
**Expected Result**: Successfully logged in, redirected to dashboard with full navigation menu

#### UC-1.2: Finance User Login
**Objective**: Verify finance user has restricted access
**Steps**:
1. Log out if currently logged in
2. Enter username: `finance`, password: `finance123`
3. Click Login
4. Navigate through different sections
**Expected Result**: Logged in but cannot access User Management section, has read-only access to most features

#### UC-1.3: Invalid Login
**Objective**: Test login security
**Steps**:
1. Enter invalid credentials (e.g., `wrong`, `password`)
2. Click Login
**Expected Result**: Error message displayed, login denied

### 2. Dashboard Overview Testing

#### UC-2.1: Dashboard Statistics
**Objective**: Verify dashboard displays accurate employee statistics
**Steps**:
1. Log in as admin
2. View dashboard statistics cards
**Expected Result**: Shows total employees (161), active employees (80), inactive employees (81), total billing amount

#### UC-2.2: Recent Activity
**Objective**: Check recent activity feed
**Steps**:
1. On dashboard, scroll to recent activity section
**Expected Result**: Shows recent employee additions, modifications, and deletions

### 3. Employee Management Testing

#### UC-3.1: View Employee List
**Objective**: Test employee listing functionality
**Steps**:
1. Navigate to Employees section
2. Review the employee table
**Expected Result**: Displays all active employees with pagination, search, and filter options

#### UC-3.2: Add New Employee
**Objective**: Test employee creation
**Steps**:
1. Click "Add Employee" button
2. Fill out the form:
   - Name: "John Doe"
   - Role: "Software Engineer"
   - Rate: "75.00"
   - Cost Centre: "Engineering"
   - Team: "Backend"
   - C-ID: "ENG001"
   - Start Date: Current date
   - Status: Active
   - Band: "L3"
   - SOW ID: "SOW-2025-001"
   - Shift: "Day"
   - Comments: "New hire for Q1 project"
3. Click Save
**Expected Result**: Employee added successfully, appears in employee list

#### UC-3.3: Edit Employee
**Objective**: Test employee modification
**Steps**:
1. Find an existing employee in the list
2. Click edit button
3. Modify the rate from current value to a new value (e.g., change to "80.00")
4. Save changes
**Expected Result**: Employee updated successfully, changes reflected in list

#### UC-3.4: Delete Employee (Soft Delete)
**Objective**: Test employee deletion tracking
**Steps**:
1. Select an employee from the list
2. Click delete button
3. Confirm deletion
4. Check that employee no longer appears in main list
5. Go to Reports > Changes to verify deletion is tracked
**Expected Result**: Employee removed from active list but deletion tracked in change reports

#### UC-3.5: Search and Filter
**Objective**: Test search and filtering functionality
**Steps**:
1. Use search box to find specific employee by name
2. Filter by status (Active/Inactive)
3. Filter by cost centre
4. Filter by role
**Expected Result**: List updates dynamically based on search criteria

### 4. CSV Import/Export Testing

#### UC-4.1: CSV Export
**Objective**: Test data export functionality
**Steps**:
1. Navigate to Employees section
2. Click "Export CSV" button
**Expected Result**: CSV file downloads with proper formatting:
- Headers: SLNO, Name, Rate ($X.XX), Role, Cost-Centre, Team, C-ID, Start-Date, End-Date, Status, Band, SOW-ID, Appx Billing ($X,XXX.XX), Shift, Comments
- Currency formatting applied correctly

#### UC-4.2: CSV Import
**Objective**: Test bulk employee import
**Steps**:
1. Click "Import CSV" button
2. Use the provided sample CSV file from `attached_assets/Billing-Table-Sample_Rand-v2om_1754209024555.csv`
3. Upload the file
4. Review import preview
5. Confirm import
**Expected Result**: Multiple employees imported successfully, data validated and added to system

#### UC-4.3: CSV Import Validation
**Objective**: Test import error handling
**Steps**:
1. Create a CSV with invalid data (missing required fields, invalid rates)
2. Attempt to import
**Expected Result**: Validation errors displayed, invalid records rejected

### 5. Billing Management Testing

#### UC-5.1: View Billing Dashboard
**Objective**: Test billing overview
**Steps**:
1. Navigate to Billing section
2. Review billing statistics and charts
**Expected Result**: Shows total billing amounts, cost centre breakdowns, and rate distributions

#### UC-5.2: Billing Calculations
**Objective**: Verify billing calculations are accurate
**Steps**:
1. Check employee with known rate and hours
2. Verify billing calculation (Rate × Hours × 160 hours/month for full-time)
**Expected Result**: Calculations match expected values

### 6. Reports and Analytics Testing

#### UC-6.1: Change Reports
**Objective**: Test change tracking functionality
**Steps**:
1. Navigate to Reports section
2. Click on "Changes" tab
3. Review recent changes list
**Expected Result**: Shows recently added, modified, and deleted employees with timestamps

#### UC-6.2: Monthly Billing by Cost Centre
**Objective**: Test billing analytics
**Steps**:
1. In Reports section, click "Monthly Billing" tab
2. Review cost centre billing breakdown
3. Check interactive charts and sparklines
**Expected Result**: Shows billing amounts per cost centre with performance trends and visual indicators

#### UC-6.3: Export Billing Report
**Objective**: Test report export
**Steps**:
1. In Monthly Billing tab, click "Export CSV"
**Expected Result**: Downloads detailed billing report with cost centre analytics

#### UC-6.4: Performance Trends
**Objective**: Test sparkline charts and trend analysis
**Steps**:
1. In Monthly Billing tab, hover over sparkline charts
2. Review 6-month historical data
3. Check percentage change indicators
**Expected Result**: Interactive tooltips show monthly data, color-coded trend indicators (green for positive, red for negative)

### 7. Settings and User Management Testing

#### UC-7.1: User Management (Admin Only)
**Objective**: Test user administration
**Steps**:
1. Log in as admin
2. Navigate to User Management
3. View existing users
4. Test user creation (if applicable)
**Expected Result**: Admin can view and manage user accounts

#### UC-7.2: Finance User Restrictions
**Objective**: Verify finance user cannot access user management
**Steps**:
1. Log in as finance user
2. Try to access User Management
**Expected Result**: User Management section not visible or accessible

#### UC-7.3: Settings Configuration
**Objective**: Test application settings
**Steps**:
1. Navigate to Settings
2. Review available configuration options
**Expected Result**: Settings page displays available configurations

### 8. Edge Cases and Error Handling

#### UC-8.1: Session Timeout
**Objective**: Test session management
**Steps**:
1. Log in and remain inactive for extended period
2. Try to perform an action
**Expected Result**: Redirected to login if session expired

#### UC-8.2: Data Validation
**Objective**: Test input validation
**Steps**:
1. Try to create employee with invalid data:
   - Empty required fields
   - Invalid email format
   - Negative rates
   - Future start dates beyond reasonable limits
**Expected Result**: Appropriate validation errors displayed

#### UC-8.3: Network Error Handling
**Objective**: Test offline/network error scenarios
**Steps**:
1. Disconnect from internet
2. Try to perform actions
**Expected Result**: Appropriate error messages displayed

### 9. Performance Testing

#### UC-9.1: Large Dataset Handling
**Objective**: Test system with current data volume
**Steps**:
1. Navigate through employee list with 161 employees
2. Perform searches and filters
3. Generate reports
**Expected Result**: System responds within acceptable timeframes (< 3 seconds for most operations)

#### UC-9.2: Concurrent Users
**Objective**: Test multiple user sessions
**Steps**:
1. Open application in multiple browser tabs/windows
2. Log in with different users
3. Perform simultaneous operations
**Expected Result**: System handles concurrent access without conflicts

### 10. Browser Compatibility

#### UC-10.1: Cross-Browser Testing
**Objective**: Verify functionality across browsers
**Steps**:
1. Test in Chrome, Firefox, Safari, Edge
2. Verify all features work consistently
**Expected Result**: Consistent functionality across modern browsers

#### UC-10.2: Responsive Design
**Objective**: Test mobile/tablet compatibility
**Steps**:
1. Access application on mobile device or resize browser
2. Test navigation and functionality
**Expected Result**: UI adapts appropriately to different screen sizes

## Test Data

### Sample Employee Data for Manual Testing
```
Name: "Sarah Johnson"
Role: "Product Manager"
Rate: "95.00"
Cost Centre: "Product"
Team: "Core Platform"
C-ID: "PROD001"
Status: "Active"
Band: "L4"
SOW ID: "SOW-2025-002"
Shift: "Day"
Comments: "Leading Q1 initiatives"
```

### CSV Import Test File
Use the provided file: `attached_assets/Billing-Table-Sample_Rand-v2om_1754209024555.csv`

## Expected Outcomes Summary

- **Authentication**: Secure login with role-based access control
- **Employee Management**: Full CRUD operations with data validation
- **Import/Export**: Seamless CSV operations with proper formatting
- **Reporting**: Comprehensive analytics with interactive visualizations
- **Performance**: Responsive system handling current data volume
- **Security**: Proper session management and data protection

## Notes for Testers

1. Always test with both admin and finance user roles
2. Verify data persistence after page refreshes
3. Check that changes are reflected in related sections (e.g., adding employee updates dashboard stats)
4. Test error scenarios as thoroughly as success scenarios
5. Pay attention to currency formatting in exports and displays
6. Verify that soft deletes don't affect billing calculations
7. Test sparkline interactions and tooltip accuracy