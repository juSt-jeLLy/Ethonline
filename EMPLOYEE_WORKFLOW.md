# Employee Workflow: Profile → Employment → Wallet

## Updated Flow

### 1. **Employee Fills Out Profile** (Employee Page)
```typescript
// Employee saves their basic info
await ProfileService.saveEmployeeProfile({
  userId: "employee-123",
  first_name: "John",
  last_name: "Doe", 
  email: "john@example.com",
  wallet_address: "0x123...", // Stored but not linked to employment yet
  preferred_chain: "ethereum",
  preferred_token: "usdc"
})
```

**What happens:**
- ✅ Saves to `employees` table
- ✅ Checks if employment relationship exists
- ✅ If employment exists → saves wallet to `wallets` table
- ✅ If employment doesn't exist → just saves employee data (wallet will be saved later)

### 2. **Admin Adds Employee to Company** (Admin Page)
```typescript
// Admin creates employment relationship
await ProfileService.addEmployeeToCompany(
  "employer-456", // Admin's company
  "employee-123", // Employee ID
  {
    role: "Developer",
    payment_amount: 5000000000000000000, // 5 ETH in wei
    chain: "ethereum",
    token: "usdc"
  }
)
```

**What happens:**
- ✅ Creates record in `employments` table
- ✅ Links employer to employee
- ✅ Sets employment status to 'active'
- ✅ Creates basic wallet entry (if employee has preferences)

### 3. **Employee Updates Profile** (After Employment)
```typescript
// Employee can now update their profile with wallet info
await ProfileService.saveEmployeeProfile({
  userId: "employee-123",
  // ... other fields
  wallet_address: "0x123...", // Now gets saved to wallets table
  preferred_chain: "ethereum",
  preferred_token: "usdc"
})
```

**What happens:**
- ✅ Updates `employees` table
- ✅ Finds existing employment relationship
- ✅ Updates `wallets` table with wallet information

## Database State Progression

### **After Step 1 (Employee Profile Only)**
```sql
-- employees table
id: "employee-123"
first_name: "John"
last_name: "Doe"
email: "john@example.com"

-- employments table
-- (empty - no relationship yet)

-- wallets table  
-- (empty - no employment relationship)
```

### **After Step 2 (Admin Adds Employee)**
```sql
-- employees table
id: "employee-123"
first_name: "John"
last_name: "Doe"
email: "john@example.com"

-- employments table
id: "employment-789"
employer_id: "employer-456"
employee_id: "employee-123"
status: "active"
role: "Developer"

-- wallets table
id: "wallet-101"
employment_id: "employment-789"
chain: "ethereum"
token: "usdc"
account_address: "" -- Empty until employee provides
is_default: true
```

### **After Step 3 (Employee Updates with Wallet)**
```sql
-- employees table
id: "employee-123"
first_name: "John"
last_name: "Doe"
email: "john@example.com"

-- employments table
id: "employment-789"
employer_id: "employer-456"
employee_id: "employee-123"
status: "active"
role: "Developer"

-- wallets table
id: "wallet-101"
employment_id: "employment-789"
chain: "ethereum"
token: "usdc"
account_address: "0x123..." -- Now filled!
is_default: true
```

## Key Benefits

✅ **Flexible Flow** - Employee can create profile before being hired
✅ **Admin Control** - Admin controls when employment relationship is created
✅ **Wallet Management** - Wallet info only saved when employment exists
✅ **Data Integrity** - All relationships properly maintained
✅ **Scalable** - Works for multiple employees per company

## Implementation Notes

- **Employee profile** can be created independently
- **Employment relationship** is created by admin
- **Wallet information** is only saved when employment exists
- **All operations** use `upsert` for idempotency
- **Error handling** is comprehensive at each step

This approach gives you full control over the employee onboarding process! 🚀
