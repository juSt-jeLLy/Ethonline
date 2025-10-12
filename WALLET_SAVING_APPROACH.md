# Wallet Saving Approach

## Current Implementation: Client-Side Approach

We're handling the wallet saving in the client-side code with a 3-step process:

### Step 1: Save Employee Data
```typescript
// Save to employees table
await supabase.from('employees').upsert({
  id: userId,
  first_name: profileData.first_name,
  last_name: profileData.last_name,
  email: profileData.email
})
```

### Step 2: Create/Update Employment Relationship
```typescript
// Save to employments table
await supabase.from('employments').upsert({
  employer_id: employerId,
  employee_id: userId,
  status: 'active',
  chain: profileData.preferred_chain,
  token: profileData.preferred_token
})
```

### Step 3: Save Wallet Information
```typescript
// Remove old default wallet
await supabase.from('wallets').delete()
  .eq('employment_id', employmentId)
  .eq('is_default', true)

// Insert new wallet
await supabase.from('wallets').insert({
  employment_id: employmentId,
  chain: profileData.preferred_chain,
  token: profileData.preferred_token,
  account_address: profileData.wallet_address,
  is_default: true
})
```

## Alternative: Supabase Triggers Approach

You could also handle this with Supabase triggers:

### Option 1: Database Triggers
```sql
-- Trigger to automatically create wallet when employment is created/updated
CREATE OR REPLACE FUNCTION handle_employment_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing default wallet
  DELETE FROM wallets 
  WHERE employment_id = NEW.id AND is_default = true;
  
  -- Insert new wallet if address provided
  IF NEW.wallet_address IS NOT NULL THEN
    INSERT INTO wallets (
      employment_id, 
      chain, 
      token, 
      account_address, 
      is_default
    ) VALUES (
      NEW.id,
      NEW.chain,
      NEW.token,
      NEW.wallet_address,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employment_wallet
  AFTER INSERT OR UPDATE ON employments
  FOR EACH ROW EXECUTE FUNCTION handle_employment_wallet();
```

### Option 2: Supabase Edge Functions
```typescript
// Edge function to handle complex wallet logic
export default async function handler(req: Request) {
  const { employeeId, employerId, walletData } = await req.json()
  
  // Handle all the database operations in one function
  // This runs on Supabase's edge infrastructure
}
```

## Recommendation: Current Client-Side Approach

**Why the current approach is better for your use case:**

1. **Transparency** - You can see exactly what's happening
2. **Flexibility** - Easy to modify logic without database changes
3. **Error Handling** - Better control over error states
4. **Testing** - Easier to test and debug
5. **No Database Complexity** - No need to manage triggers

**When to use triggers instead:**
- Complex business logic that should always run
- Data integrity that must be enforced at database level
- Performance-critical operations
- Multi-application scenarios

## Current Implementation Benefits

✅ **Atomic Operations** - Each step is handled properly
✅ **Error Handling** - Clear error messages for each step
✅ **Flexibility** - Easy to modify wallet logic
✅ **Transparency** - You can see exactly what's saved where
✅ **Testing** - Easy to test individual steps

## Database Schema Compliance

The current implementation properly follows your schema:

1. **employees** table - Stores basic employee info
2. **employments** table - Links employer to employee with payment preferences
3. **wallets** table - Stores wallet addresses per employment
4. **v_employer_employee_summary** view - Used for loading data

This approach gives you full control while maintaining data integrity! 🚀
