# Supabase Integration Setup

This project now includes Supabase integration for saving user profile data using your existing crypto payroll schema. Follow these steps to set up your Supabase database.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from the project settings

## 2. Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Database Schema

Your existing schema is already set up! The integration works with your existing tables:

- **employers** - For admin/employer profiles (name, email)
- **employees** - For employee profiles (first_name, last_name, email)
- **employments** - Links employers to employees with payment preferences
- **wallets** - Stores wallet addresses and payment preferences per employment
- **v_employer_employee_summary** - Convenience view for employee data with wallet info

The integration uses these tables to store profile data according to your existing schema structure.

## 4. Features Added

### Employee Profile (`/employee/profile`)
- Saves: first_name, last_name, email, wallet address, preferred chain, preferred token
- Loads existing profile data on page load using the v_employer_employee_summary view
- Shows loading states during save operations
- Displays success/error messages

### Admin Profile (`/admin/profile`)
- Saves: name, email (stored in employers table)
- Loads existing profile data on page load
- Shows loading states during save operations
- Displays success/error messages

## 5. Service Functions

The `ProfileService` class provides the following methods:

- `saveEmployeeProfile(profileData)` - Save/update employee profile in employees table
- `saveEmployerProfile(profileData)` - Save/update employer profile in employers table
- `getEmployeeProfile(userId)` - Retrieve employee profile by ID
- `getEmployerProfile(userId)` - Retrieve employer profile by ID
- `getEmployeeProfileWithWallet(userId)` - Get employee data with wallet info from view
- `deleteEmployeeProfile(userId)` - Delete employee profile
- `deleteEmployerProfile(userId)` - Delete employer profile

## 6. Authentication Integration

Currently using mock user IDs. To integrate with real authentication:

1. Replace the mock `userId` generation with actual user authentication
2. Update the RLS policies in Supabase to match your auth system
3. Consider using Supabase Auth for a complete solution

## 7. Error Handling

The integration includes comprehensive error handling:
- Network errors are caught and displayed to users
- Loading states prevent multiple submissions
- Success/error toasts provide user feedback
- Database errors are logged for debugging

## 8. Security Notes

- Row Level Security (RLS) is enabled on the user_profiles table
- Users can only access their own profile data
- All database operations are performed through the Supabase client
- Environment variables are used for sensitive configuration
