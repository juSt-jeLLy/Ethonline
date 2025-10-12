import { supabase, Employer, Employee, Employment, Wallet, EmployerProfileData, EmployeeProfileData } from './supabase'

export class ProfileService {
  // Save or update employer profile
  static async saveEmployerProfile(profileData: EmployerProfileData & { userId: string }) {
    try {
      const { data, error } = await supabase
        .from('employers')
        .upsert({
          id: profileData.userId,
          name: profileData.name,
          email: profileData.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error saving employer profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Save or update employee profile using wallet address to find existing employee
  static async saveEmployeeProfile(profileData: EmployeeProfileData) {
    try {
      let employeeId = null

      // Step 1: Check if employee exists by wallet address
      if (profileData.wallet_address) {
        const { data: existingWallet, error: walletError } = await supabase
          .from('wallets')
          .select('employee_id')
          .eq('account_address', profileData.wallet_address)
          .maybeSingle()

        if (walletError) {
          throw walletError
        }

        if (existingWallet) {
          employeeId = existingWallet.employee_id
          console.log('Found existing employee by wallet address:', employeeId)
        }
      }

      // Step 2: Check if employee exists by email (fallback)
      if (!employeeId && profileData.email) {
        const { data: existingEmployee, error: emailError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', profileData.email)
          .maybeSingle()

        if (emailError) {
          throw emailError
        }

        if (existingEmployee) {
          employeeId = existingEmployee.id
          console.log('Found existing employee by email:', employeeId)
        }
      }

      // Step 3: Save/update the employee record
      const employeeData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        updated_at: new Date().toISOString()
      }

      let employeeResult
      if (employeeId) {
        // Update existing employee
        const { data, error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employeeId)
          .select()

        if (error) throw error
        employeeResult = data
        console.log('Updated existing employee')
      } else {
        // Create new employee (let Supabase assign ID)
        const { data, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select()

        if (error) throw error
        employeeResult = data
        employeeId = data[0].id
        console.log('Created new employee with ID:', employeeId)
      }

      // Step 4: Handle wallet entry (create or update)
      if (profileData.wallet_address) {
        // Check if this wallet address already exists for this employee
        const { data: existingWallet, error: checkError } = await supabase
          .from('wallets')
          .select('id, account_address, chain, token')
          .eq('employee_id', employeeId)
          .eq('account_address', profileData.wallet_address)
          .maybeSingle()

        if (checkError) {
          throw checkError
        }

        if (existingWallet) {
          // Update existing wallet with new preferences
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .update({
              chain: profileData.preferred_chain || existingWallet.chain || 'ethereum',
              token: profileData.preferred_token || existingWallet.token || 'usdc'
            })
            .eq('id', existingWallet.id)
            .select()

          if (walletError) {
            throw walletError
          }
          console.log('Updated existing wallet for employee:', employeeId)
        } else {
          // Create new wallet if this address doesn't exist for this employee
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .insert({
              employee_id: employeeId,
              chain: profileData.preferred_chain || 'ethereum',
              token: profileData.preferred_token || 'usdc',
              account_address: profileData.wallet_address,
              is_default: true
            })
            .select()

          if (walletError) {
            throw walletError
          }
          console.log('Created new wallet for employee:', employeeId)
        }
      } else {
        // Check if employee has any default wallet to update
        const { data: existingDefaultWallet, error: checkError } = await supabase
          .from('wallets')
          .select('id, chain, token')
          .eq('employee_id', employeeId)
          .eq('is_default', true)
          .maybeSingle()

        if (checkError) {
          throw checkError
        }

        if (existingDefaultWallet) {
          // Update existing default wallet preferences
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .update({
              chain: profileData.preferred_chain || existingDefaultWallet.chain || 'ethereum',
              token: profileData.preferred_token || existingDefaultWallet.token || 'usdc'
            })
            .eq('id', existingDefaultWallet.id)
            .select()

          if (walletError) {
            throw walletError
          }
          console.log('Updated existing default wallet preferences for employee:', employeeId)
        } else {
          // Create basic wallet entry even without address
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .insert({
              employee_id: employeeId,
              chain: profileData.preferred_chain || 'ethereum',
              token: profileData.preferred_token || 'usdc',
              account_address: '', // Empty address - can be filled later
              is_default: true
            })
            .select()

          if (walletError) {
            throw walletError
          }
          console.log('Created basic wallet entry for employee:', employeeId)
        }
      }

      return { success: true, data: employeeResult, employeeId }
    } catch (error) {
      console.error('Error saving employee profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Get employer profile by ID
  static async getEmployerProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching employer profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Get employee profile by ID
  static async getEmployeeProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching employee profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Get employee profile with wallet information
  static async getEmployeeProfileWithWallet(userId: string) {
    try {
      // Get employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (employeeError) {
        throw employeeError
      }

      // Get employment and wallet data using the view
      const { data: employmentData, error: employmentError } = await supabase
        .from('v_employer_employee_summary')
        .select('*')
        .eq('employee_id', userId)
        .eq('is_default', true)
        .maybeSingle()

      if (employmentError) {
        throw employmentError
      }

      return { 
        success: true, 
        data: {
          employee: employeeData,
          employment: employmentData
        }
      }
    } catch (error) {
      console.error('Error fetching employee profile with wallet:', error)
      return { success: false, error: error.message }
    }
  }

  // Find employee by wallet address
  static async findEmployeeByWallet(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          employees!inner(*)
        `)
        .eq('account_address', walletAddress)
        .eq('is_default', true)
        .maybeSingle()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error finding employee by wallet:', error)
      return { success: false, error: error.message }
    }
  }

  // Load employee profile with wallet data for form population
  static async loadEmployeeProfile(profileData: { wallet_address?: string, email?: string }) {
    try {
      console.log('=== ProfileService.loadEmployeeProfile DEBUG ===');
      console.log('Input profileData:', profileData);
      
      let employeeId = null
      let employeeData = null
      let walletData = null

      // Step 1: Check if wallet exists in wallets table first
      if (profileData.wallet_address) {
        console.log('🔍 Step 1: Checking wallets table for address:', profileData.wallet_address);
        console.log('🔍 Searching for account_address =', `"${profileData.wallet_address}"`);
        console.log('🔍 Searching for is_default =', true);
        
        const { data: walletResult, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('account_address', profileData.wallet_address)
          .eq('is_default', true)
          .maybeSingle()

        console.log('Wallets table search result:', { walletResult, walletError });
        
        // Let's also check what's actually in the wallets table
        console.log('🔍 DEBUG: Let me check what wallets exist in the database...');
        const { data: allWallets, error: allWalletsError } = await supabase
          .from('wallets')
          .select('*')
          .limit(10)
        
        console.log('All wallets in database (first 10):', { allWallets, allWalletsError });

        if (walletError) {
          throw walletError
        }

        if (walletResult) {
          walletData = walletResult
          employeeId = walletResult.employee_id
          console.log('✅ Found wallet in wallets table, employee_id:', employeeId)
          
          // Step 2: Now get employee data using the employee_id
          console.log('🔍 Step 2: Getting employee data for employee_id:', employeeId);
          
          const { data: employeeResult, error: employeeError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .maybeSingle()

          console.log('Employee table search result:', { employeeResult, employeeError });

          if (employeeError) {
            throw employeeError
          }

          if (employeeResult) {
            employeeData = employeeResult
            console.log('✅ Found employee data:', employeeData)
          } else {
            console.log('❌ No employee found for employee_id:', employeeId)
          }
        } else {
          console.log('❌ No wallet found in wallets table')
        }
      } else {
        console.log('⚠️ No wallet address provided for search')
      }

      // Step 3: If not found by wallet, try by email
      if (!employeeId && profileData.email) {
        console.log('🔍 Step 3: Searching by email:', profileData.email);
        console.log('🔍 Searching for email =', `"${profileData.email}"`);
        
        const { data: employeeResult, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('email', profileData.email)
          .maybeSingle()

        console.log('Email search result:', { employeeResult, employeeError });
        
        // Let's also check what's actually in the employees table
        console.log('🔍 DEBUG: Let me check what employees exist in the database...');
        const { data: allEmployees, error: allEmployeesError } = await supabase
          .from('employees')
          .select('*')
          .limit(10)
        
        console.log('All employees in database (first 10):', { allEmployees, allEmployeesError });

        if (employeeError) {
          throw employeeError
        }

        if (employeeResult) {
          employeeId = employeeResult.id
          employeeData = employeeResult
          console.log('✅ Found employee by email:', employeeId)

          // Get their default wallet
          console.log('🔍 Getting default wallet for employee:', employeeId);
          
          const { data: walletResult, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('is_default', true)
            .maybeSingle()

          console.log('Default wallet search result:', { walletResult, walletError });

          if (walletError) {
            throw walletError
          }

          walletData = walletResult
          if (walletData) {
            console.log('✅ Found default wallet for employee')
          } else {
            console.log('❌ No default wallet found for employee')
          }
        } else {
          console.log('❌ No employee found by email')
        }
      } else if (!employeeId) {
        console.log('⚠️ No email provided for search')
      }

      const result = { 
        success: true, 
        data: {
          employee: employeeData,
          wallet: walletData,
          employeeId
        }
      }
      
      console.log('Final result:', result);
      console.log('=== END ProfileService.loadEmployeeProfile DEBUG ===');
      
      return result
    } catch (error) {
      console.error('❌ Error loading employee profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete employer profile
  static async deleteEmployerProfile(userId: string) {
    try {
      const { error } = await supabase
        .from('employers')
        .delete()
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting employer profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete employee profile
  static async deleteEmployeeProfile(userId: string) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting employee profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin adds employee to company (creates employment relationship)
  static async addEmployeeToCompany(employerId: string, employeeId: string, employmentData: {
    role?: string
    payment_amount?: number
    payment_frequency?: string
    chain?: string
    token?: string
    token_contract?: string
    token_decimals?: number
  }) {
    try {
      // Create employment relationship
      const { data: employment, error: employmentError } = await supabase
        .from('employments')
        .upsert({
          employer_id: employerId,
          employee_id: employeeId,
          status: 'active',
          role: employmentData.role,
          payment_amount: employmentData.payment_amount,
          payment_frequency: employmentData.payment_frequency,
          chain: employmentData.chain,
          token: employmentData.token,
          token_contract: employmentData.token_contract,
          token_decimals: employmentData.token_decimals,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employer_id,employee_id'
        })
        .select()

      if (employmentError) {
        throw employmentError
      }

      // Check if employee already has a wallet linked directly to them
      const { data: existingWallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_default', true)
        .maybeSingle()

      if (walletError) {
        throw walletError
      }

      // If employee has a wallet, also link it to the employment
      if (existingWallet && employment?.[0]?.id) {
        const { data: updatedWallet, error: updateError } = await supabase
          .from('wallets')
          .update({
            employment_id: employment[0].id,
            chain: employmentData.chain || existingWallet.chain,
            token: employmentData.token || existingWallet.token
          })
          .eq('id', existingWallet.id)
          .select()

        if (updateError) {
          console.log('Failed to link existing wallet to employment:', updateError)
        } else {
          console.log('Linked existing wallet to employment')
        }
      }

      return { success: true, data: employment }
    } catch (error) {
      console.error('Error adding employee to company:', error)
      return { success: false, error: error.message }
    }
  }

  // Search employees by name or wallet address
  static async searchEmployees(query: string) {
    try {
      console.log('🔍 Searching for:', query);
      
      // Check if query contains wallet indicators (0x or .eth)
      const isWalletSearch = query.includes('0x') || query.includes('.eth');
      
      if (isWalletSearch) {
        // Search in wallets table
        console.log('🔍 Searching wallets table for:', query);
        
        const { data: walletResults, error: walletError } = await supabase
          .from('wallets')
          .select(`
            *,
            employees!inner(
              id,
              first_name,
              last_name,
              email
            )
          `)
          .ilike('account_address', `%${query}%`)
          .limit(10);

        if (walletError) {
          throw walletError;
        }

        console.log('Wallet search results:', walletResults);
        
        return {
          success: true,
          data: walletResults?.map(wallet => ({
            id: wallet.employees.id,
            first_name: wallet.employees.first_name,
            last_name: wallet.employees.last_name,
            email: wallet.employees.email,
            wallet_address: wallet.account_address,
            chain: wallet.chain,
            token: wallet.token
          })) || []
        };
      } else {
        // Search in employees table by name
        console.log('🔍 Searching employees table for name:', query);
        
        // Handle full name search (e.g., "John Doe")
        const nameParts = query.trim().split(' ');
        let searchQuery = '';
        
        let employeeResults;
        let employeeError;
        
        if (nameParts.length > 1) {
          // Full name search: "John Doe" -> search for first_name=John AND last_name=Doe
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          console.log('🔍 Full name search - First:', firstName, 'Last:', lastName);
          
          const { data, error } = await supabase
            .from('employees')
            .select(`
              *,
              wallets(
                account_address,
                chain,
                token,
                is_default
              )
            `)
            .ilike('first_name', `%${firstName}%`)
            .ilike('last_name', `%${lastName}%`)
            .limit(10);
            
          employeeResults = data;
          employeeError = error;
        } else {
          // Single name search: "John" -> search first_name OR last_name OR email
          console.log('🔍 Single name search for:', query);
          
          const { data, error } = await supabase
            .from('employees')
            .select(`
              *,
              wallets(
                account_address,
                chain,
                token,
                is_default
              )
            `)
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);
            
          employeeResults = data;
          employeeError = error;
        }

        if (employeeError) {
          throw employeeError;
        }

        console.log('Employee search results:', employeeResults);
        
        return {
          success: true,
          data: employeeResults?.map(employee => ({
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            wallet_address: employee.wallets?.[0]?.account_address || '',
            chain: employee.wallets?.[0]?.chain || '',
            token: employee.wallets?.[0]?.token || ''
          })) || []
        };
      }
    } catch (error) {
      console.error('Error searching employees:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get all companies
  static async getAllCompanies() {
    try {
      const { data, error } = await supabase
        .from('employers')
        .select('id, name, email')
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Create new company
  static async createCompany(companyData: { name: string, email: string }) {
    try {
      const { data, error } = await supabase
        .from('employers')
        .insert({
          name: companyData.name,
          email: companyData.email
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating company:', error);
      return { success: false, error: error.message };
    }
  }

  // Create payment group (employment relationships)
  static async createPaymentGroup(groupData: {
    employerId: string;
    groupName: string;
    employees: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      wallet_address: string;
      chain: string;
      token: string;
      payment: string;
    }>;
  }) {
    try {
      console.log('Creating payment group:', groupData);
      
      const employmentRecords = [];
      
      // Process each employee
      for (const employee of groupData.employees) {
        console.log('Processing employee:', employee);
        
        // Check if employee exists in database
        let employeeId = employee.id;
        
        // If employee ID is a temp ID (starts with 'temp-'), we need to create the employee
        if (employee.id.startsWith('temp-')) {
          console.log('Creating new employee:', employee.first_name, employee.last_name);
          
          // Create new employee
          const { data: newEmployee, error: employeeError } = await supabase
            .from('employees')
            .insert({
              first_name: employee.first_name,
              last_name: employee.last_name,
              email: employee.email || ''
            })
            .select()
            .single();

          if (employeeError) {
            console.error('Error creating employee:', employeeError);
            throw employeeError;
          }
          
          employeeId = newEmployee.id;
          console.log('Created employee with ID:', employeeId);
        } else {
          // Verify employee exists
          console.log('Checking existing employee with ID:', employee.id);
          const { data: existingEmployee, error: checkError } = await supabase
            .from('employees')
            .select('id, first_name, last_name, email')
            .eq('id', employee.id)
            .maybeSingle();

          if (checkError) {
            console.error('Error checking employee:', checkError);
            throw checkError;
          }

          if (!existingEmployee) {
            console.error('Employee not found:', employee.id);
            throw new Error(`Employee with ID ${employee.id} not found`);
          }
          
          console.log('Found existing employee:', existingEmployee);
        }

        // Create employment record
        const employmentRecord = {
          employer_id: groupData.employerId,
          employee_id: employeeId,
          status: 'active',
          role: 'employee',
          payment_amount: 0, // TODO: Parse payment amount
          payment_frequency: 'weekly',
          chain: employee.chain || 'ethereum',
          token: employee.token || 'usdc',
          token_contract: '',
          token_decimals: 18
        };

        employmentRecords.push(employmentRecord);
      }

      console.log('Creating employment records:', employmentRecords);
      console.log('Employment records count:', employmentRecords.length);

      // Insert all employment records
      const { data: employments, error: employmentError } = await supabase
        .from('employments')
        .insert(employmentRecords)
        .select();

      console.log('Employment insert result:', { employments, employmentError });

      if (employmentError) {
        console.error('Employment creation error:', employmentError);
        throw employmentError;
      }

      console.log('Created employment records:', employments);

      // Handle wallet linking
      for (let i = 0; i < groupData.employees.length; i++) {
        const employee = groupData.employees[i];
        const employment = employments[i];
        
        if (employee.wallet_address) {
          // Check if wallet exists for this employee
          const { data: existingWallet, error: walletError } = await supabase
            .from('wallets')
            .select('id')
            .eq('employee_id', employment.employee_id)
            .eq('account_address', employee.wallet_address)
            .maybeSingle();

          if (walletError) {
            console.error('Error checking wallet:', walletError);
            continue;
          }

          if (existingWallet) {
            // Update existing wallet to link to employment
            const { error: updateError } = await supabase
              .from('wallets')
              .update({ employment_id: employment.id })
              .eq('id', existingWallet.id);

            if (updateError) {
              console.error('Error updating wallet:', updateError);
            } else {
              console.log('Linked wallet to employment:', existingWallet.id);
            }
          } else {
            // Create new wallet entry linked to employment
            const { error: createError } = await supabase
              .from('wallets')
              .insert({
                employee_id: employment.employee_id,
                employment_id: employment.id,
                chain: employee.chain || 'ethereum',
                token: employee.token || 'usdc',
                account_address: employee.wallet_address,
                is_default: true
              });

            if (createError) {
              console.error('Error creating wallet:', createError);
            } else {
              console.log('Created new wallet for employment:', employment.id);
            }
          }
        }
      }

      return { success: true, data: employments };
    } catch (error) {
      console.error('Error creating payment group:', error);
      return { success: false, error: error.message };
    }
  }
}
