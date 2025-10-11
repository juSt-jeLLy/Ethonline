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

  // Save or update employee profile (basic info only - no employment relationship yet)
  static async saveEmployeeProfile(profileData: EmployeeProfileData & { userId: string }) {
    try {
      // Step 1: Save/update the employee record only
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .upsert({
          id: profileData.userId,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()

      if (employeeError) {
        throw employeeError
      }

      // Step 2: Check if employment relationship exists
      const { data: employmentData, error: employmentError } = await supabase
        .from('employments')
        .select('id')
        .eq('employee_id', profileData.userId)
        .maybeSingle()

      if (employmentError) {
        throw employmentError
      }

      // Step 3: Save wallet information only if employment exists
      if (profileData.wallet_address && employmentData?.id) {
        // First, remove any existing default wallets for this employment
        await supabase
          .from('wallets')
          .delete()
          .eq('employment_id', employmentData.id)
          .eq('is_default', true)

        // Then, insert the new wallet
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .insert({
            employment_id: employmentData.id,
            chain: profileData.preferred_chain || 'ethereum',
            token: profileData.preferred_token || 'usdc',
            account_address: profileData.wallet_address,
            is_default: true
          })
          .select()

        if (walletError) {
          throw walletError
        }
      } else if (profileData.wallet_address && !employmentData?.id) {
        // Employment doesn't exist yet - just save the employee data
        console.log('Employment relationship not found - wallet will be saved when admin adds employee')
      }

      return { success: true, data: employeeData }
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
    base_salary_atomic?: number
    hourly_rate_atomic?: number
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
          base_salary_atomic: employmentData.base_salary_atomic,
          hourly_rate_atomic: employmentData.hourly_rate_atomic,
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

      // Now check if employee has wallet preferences and create wallet
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single()

      if (employeeError) {
        throw employeeError
      }

      // If employee has wallet preferences, create wallet
      if (employeeData && employment?.[0]?.id) {
        // Check if employee has wallet info stored somewhere (you might need to adjust this)
        // For now, we'll just create a basic wallet entry
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .insert({
            employment_id: employment[0].id,
            chain: employmentData.chain || 'ethereum',
            token: employmentData.token || 'usdc',
            account_address: '', // Will be filled when employee provides wallet
            is_default: true
          })
          .select()

        if (walletError) {
          console.log('Wallet creation failed (this is OK if employee hasn\'t provided wallet yet):', walletError)
        }
      }

      return { success: true, data: employment }
    } catch (error) {
      console.error('Error adding employee to company:', error)
      return { success: false, error: error.message }
    }
  }
}
