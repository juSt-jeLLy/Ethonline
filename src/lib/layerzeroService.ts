// LayerZero Stargate service for cross-chain PYUSD transfers
export class LayerZeroService {
  private static readonly STARGATE_API_BASE = 'https://stargate.finance/api/v1';
  
  // PYUSD token addresses
  private static readonly PYUSD_ETH = '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8'; // PYUSD on Ethereum
  private static readonly PYUSD_SOL = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'; // PYUSD on Solana
  
  // Solana destination address from environment variable
  // Set VITE_SOLANA_DESTINATION in your .env file to override the default
  private static readonly SOLANA_DESTINATION = import.meta.env.VITE_SOLANA_DESTINATION;

  // Get a quote for LayerZero Stargate transfer
  static async getStargateQuote(
    srcAddress: string, 
    amount: string, 
    dstAddress: string = this.SOLANA_DESTINATION
  ) {
    try {
      console.log('🔍 === STARGATE QUOTE REQUEST ===');
      console.log('📋 Quote parameters:', { 
        srcAddress, 
        amount, 
        dstAddress,
        srcToken: this.PYUSD_ETH,
        dstToken: this.PYUSD_SOL,
        srcChainKey: 'ethereum',
        dstChainKey: 'solana'
      });
      
      // Calculate minimum destination amount (2% slippage tolerance)
      const amountNum = parseFloat(amount);
      const dstAmountMin = Math.floor(amountNum * 0.98).toString();
      
      console.log('💰 Amount calculations:', {
        originalAmount: amount,
        amountNum: amountNum,
        dstAmountMin: dstAmountMin,
        slippageTolerance: '2%'
      });
      
      const queryParams = {
        srcToken: this.PYUSD_ETH,
        dstToken: this.PYUSD_SOL,
        srcChainKey: 'ethereum',
        dstChainKey: 'solana',
        srcAddress: srcAddress,
        dstAddress: dstAddress,
        srcAmount: amount,
        dstAmountMin: dstAmountMin
      };
      
      console.log('📡 Query parameters:', queryParams);
      
      const quoteUrl = `${this.STARGATE_API_BASE}/quotes?` + new URLSearchParams(queryParams);

      console.log('🌐 Full quote URL:', quoteUrl);
      console.log('📡 Making request to Stargate API...');
      
      const response = await fetch(quoteUrl);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Stargate quote API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Stargate quote successful!');
      console.log('📋 Quote data structure:', {
        hasData: !!data,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : 'no data',
        fullData: data
      });
      
      // Check if the response has the expected structure
      console.log('🔍 Analyzing Stargate response structure...');
      if (data && typeof data === 'object') {
        console.log('📋 Response analysis:', {
          isArray: Array.isArray(data),
          hasTransaction: !!data.transaction,
          hasTx: !!data.tx,
          hasData: !!data.data,
          hasTo: !!data.to,
          hasValue: !!data.value,
          hasGasLimit: !!data.gasLimit,
          allKeys: Object.keys(data)
        });
        
        // Check for nested transaction data
        if (data.transaction) {
          console.log('📋 Transaction object keys:', Object.keys(data.transaction));
        }
        if (data.tx) {
          console.log('📋 TX object keys:', Object.keys(data.tx));
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('💥 === STARGATE QUOTE ERROR ===');
      console.error('💥 Error getting Stargate quote:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { success: false, error: error.message };
    }
  }

  // Execute the LayerZero Stargate transfer
  static async executeStargateTransfer(
    quoteData: any, 
    walletClient: any
  ) {
    try {
      console.log('⚡ === EXECUTING STARGATE TRANSFER ===');
      console.log('📋 Quote data received:', {
        hasData: !!quoteData,
        dataType: typeof quoteData,
        dataKeys: quoteData ? Object.keys(quoteData) : 'no data',
        fullData: quoteData
      });
      
      // For Stargate, we need to use the returned transaction data directly
      // The quote should contain the transaction parameters
      console.log('⚡ Stargate transaction data:', {
        to: quoteData.to,
        data: quoteData.data,
        value: quoteData.value,
        gasLimit: quoteData.gasLimit
      });
      
      console.log('⚡ Executing Stargate transaction...');
      console.log('⚡ Using wallet client for raw transaction');
      
      // Check what fields are actually available in the quote data
      console.log('⚡ Available quote data fields:', Object.keys(quoteData));
      console.log('⚡ Quote data values:', {
        to: quoteData.to,
        data: quoteData.data,
        value: quoteData.value,
        gasLimit: quoteData.gasLimit,
        hasTo: !!quoteData.to,
        hasData: !!quoteData.data,
        dataLength: quoteData.data ? quoteData.data.length : 0
      });
      
      // Try to extract transaction data from different possible structures
      let txData = quoteData;
      
      // Check if transaction data is nested in quotes array
      if (quoteData.quotes && Array.isArray(quoteData.quotes) && quoteData.quotes.length > 0) {
        console.log('📋 Found quotes array with', quoteData.quotes.length, 'quotes');
        console.log('📋 First quote structure:', quoteData.quotes[0]);
        console.log('📋 First quote keys:', Object.keys(quoteData.quotes[0]));
        
        // Check if the quote has steps with transaction data
        if (quoteData.quotes[0].steps && Array.isArray(quoteData.quotes[0].steps) && quoteData.quotes[0].steps.length > 0) {
          console.log('📋 Found steps array with', quoteData.quotes[0].steps.length, 'steps');
          console.log('📋 First step structure:', quoteData.quotes[0].steps[0]);
          console.log('📋 First step keys:', Object.keys(quoteData.quotes[0].steps[0]));
          
          // Check if the step has transaction data
          if (quoteData.quotes[0].steps[0].transaction) {
            console.log('📋 Found transaction in step:', quoteData.quotes[0].steps[0].transaction);
            console.log('📋 Transaction keys:', Object.keys(quoteData.quotes[0].steps[0].transaction));
            console.log('📋 Transaction values:', {
              to: quoteData.quotes[0].steps[0].transaction.to,
              data: quoteData.quotes[0].steps[0].transaction.data,
              value: quoteData.quotes[0].steps[0].transaction.value,
              from: quoteData.quotes[0].steps[0].transaction.from,
              hasTo: !!quoteData.quotes[0].steps[0].transaction.to,
              hasData: !!quoteData.quotes[0].steps[0].transaction.data
            });
            txData = quoteData.quotes[0].steps[0].transaction;
          } else {
            console.log('📋 No transaction found in step');
            txData = quoteData.quotes[0];
          }
        } else {
          console.log('📋 No steps found in quote');
          txData = quoteData.quotes[0];
        }
      } else if (quoteData.transaction) {
        console.log('📋 Found nested transaction object');
        txData = quoteData.transaction;
      } else if (quoteData.tx) {
        console.log('📋 Found nested tx object');
        txData = quoteData.tx;
      }
      
      console.log('⚡ Final transaction data:', {
        to: txData.to,
        data: txData.data,
        value: txData.value,
        gasLimit: txData.gasLimit,
        hasTo: !!txData.to,
        hasData: !!txData.data
      });
      
      // For Stargate, we need to send a raw transaction
      // The quote data should contain the transaction parameters
      if (!txData.to || !txData.data) {
        console.error('❌ Missing required fields in transaction data:', {
          hasTo: !!txData.to,
          hasData: !!txData.data,
          originalQuoteData: quoteData,
          extractedTxData: txData
        });
        throw new Error('Invalid quote data: missing to or data fields');
      }
      
      console.log('⚡ Attempting to send raw transaction...');
      console.log('⚡ Wallet client type:', typeof walletClient);
      console.log('⚡ Wallet client methods:', walletClient ? Object.getOwnPropertyNames(walletClient) : 'no client');
      
      // Use the wallet client's sendTransaction method for raw transactions
      const txHash = await walletClient.sendTransaction({
        to: txData.to,
        data: txData.data,
        value: txData.value || '0',
        gasLimit: txData.gasLimit || 500000,
      });

      console.log('✅ Stargate transfer transaction sent successfully!');
      console.log('🎉 Transaction hash:', txHash);
      console.log('📋 Transaction details:', {
        hash: txHash,
        type: typeof txHash,
        hasHash: !!txHash
      });
      
      return { success: true, txHash: txHash };
    } catch (error) {
      console.error('💥 === STARGATE TRANSFER EXECUTION ERROR ===');
      console.error('💥 Error executing Stargate transfer:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      return { success: false, error: error.message };
    }
  }

  // Validate Solana address format
  static isValidSolanaAddress(address: string): boolean {
    // Basic Solana address validation (base58, 32-44 characters)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  // Format amount for PYUSD (6 decimals)
  static formatPYUSDAmount(amount: number): string {
    // PYUSD has 6 decimals
    return (amount * 1000000).toString();
  }

  // Parse amount from PYUSD units
  static parsePYUSDAmount(amount: string): number {
    // PYUSD has 6 decimals
    return parseInt(amount) / 1000000;
  }
}
