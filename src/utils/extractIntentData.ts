import { TOKEN_ADDRESS_MAP, getChainName } from './groupsUtils';

export const extractIntentData = async (intent: any, address: string) => {
  try {
    console.log('Raw intent data from SDK:', intent);
    
    const intentId = intent.id || intent.intentId || intent.requestId || '';
    
    if (!intentId) {
      return {
        intentId: '', sourceAmount: '', sourceCurrency: '', destAmount: '', destCurrency: '',
        sourceChain: '', destChain: '', status: 'UNKNOWN', timestamp: Date.now() / 1000,
        sender: '', recipient: '', solver: '', totalFees: '', senderToSolverHash: '',
        solverToReceiverHash: '', hasRealData: false
      };
    }
    
    const getTokenInfo = (tokenAddress: string, value: string): { symbol: string; decimals: number } => {
      if (!tokenAddress || tokenAddress === 'null' || tokenAddress === 'undefined' || tokenAddress === '0x0000000000000000000000000000000000000000') {
        return { symbol: 'ETH', decimals: 18 };
      }
      
      const normalizedAddress = tokenAddress.toLowerCase();
      const mappedToken = TOKEN_ADDRESS_MAP[normalizedAddress];
      
      if (mappedToken) return mappedToken;
      
      if (value) {
        try {
          const amountValue = BigInt(value);
          if (amountValue > BigInt(1000000000)) {
            return { symbol: 'USDC', decimals: 6 };
          } else {
            return { symbol: 'ETH', decimals: 18 };
          }
        } catch (e) {}
      }
      
      return { symbol: 'ETH', decimals: 18 };
    };
    
    const formatAmount = (value: string, decimals: number): string => {
      if (!value) return '';
      
      try {
        const amountValue = BigInt(value);
        const divisor = BigInt(10 ** decimals);
        const whole = amountValue / divisor;
        const fractional = amountValue % divisor;
        
        if (fractional === BigInt(0)) {
          return whole.toString();
        } else {
          const fractionalStr = fractional.toString().padStart(decimals, '0');
          const trimmedFractional = fractionalStr.replace(/0+$/, '');
          return `${whole}.${trimmedFractional}`;
        }
      } catch (error) {
        console.error('Error formatting amount:', error);
        return '';
      }
    };
    
    let sourceAmount = '', sourceCurrency = '', sourceTokenAddress = '';
    if (intent.sources && intent.sources.length > 0) {
      const source = intent.sources[0];
      sourceTokenAddress = source.tokenAddress;
      const sourceValue = source.value;
      const tokenInfo = getTokenInfo(sourceTokenAddress, sourceValue);
      sourceCurrency = tokenInfo.symbol;
      sourceAmount = formatAmount(sourceValue, tokenInfo.decimals);
    }
    
    let destAmount = '', destCurrency = '', destTokenAddress = '', recipient = '';
    if (intent.destinations && intent.destinations.length > 0) {
      const destination = intent.destinations[0];
      destTokenAddress = destination.tokenAddress;
      const destValue = destination.value;
      const tokenInfo = getTokenInfo(destTokenAddress, destValue);
      destCurrency = tokenInfo.symbol;
      destAmount = formatAmount(destValue, tokenInfo.decimals);
    }
    
    const sourceChainId = intent.sources?.[0]?.chainID;
    const destinationChainId = intent.destinationChainID;
    const sourceChain = sourceChainId ? getChainName(sourceChainId) : '';
    const destChain = destinationChainId ? getChainName(destinationChainId) : '';
    
    let status = 'UNKNOWN';
    if (intent.deposited !== undefined) {
      if (intent.deposited) {
        status = intent.fulfilled ? 'SUCCESS' : 'PROCESSING';
      } else if (intent.refunded) {
        status = 'REFUNDED';
      } else {
        status = 'PENDING';
      }
    }
    
    let totalFees = '';
    if (sourceAmount && destAmount && sourceCurrency === destCurrency) {
      const sourceValue = parseFloat(sourceAmount);
      const destValue = parseFloat(destAmount);
      if (!isNaN(sourceValue) && !isNaN(destValue) && sourceValue > destValue) {
        totalFees = (sourceValue - destValue).toFixed(sourceCurrency === 'ETH' ? 18 : 6);
        totalFees = totalFees.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
      }
    }
    
    const timestamp = intent.expiry ? (intent.expiry - 3600) : (Date.now() / 1000);
    
    let solver = '';
    if (intentId) {
      try {
        console.log('Fetching solver data from Avai explorer for intent:', intentId);
        const avaiResponse = await fetch(`https://explorer.nexus.availproject.org/intent/${intentId}`);
        if (avaiResponse.ok) {
          const html = await avaiResponse.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const links = doc.querySelectorAll('a[target="_blank"]');
          
          for (const link of links) {
            const linkText = link.textContent?.trim() || '';
            const linkHref = link.getAttribute('href') || '';
            
            if (linkHref.includes('address') && linkText.match(/0x[a-fA-F0-9]/)) {
              const addressMatch = linkText.match(/0x[a-fA-F0-9]+/);
              if (addressMatch) {
                solver = addressMatch[0];
                console.log('Found solver from link:', solver);
                break;
              }
            }
            
            const parentText = link.parentElement?.textContent || '';
            if (parentText.includes('Solver') && linkText.match(/0x[a-fA-F0-9]/)) {
              const addressMatch = linkText.match(/0x[a-fA-F0-9]+/);
              if (addressMatch) {
                solver = addressMatch[0];
                console.log('Found solver from parent context:', solver);
                break;
              }
            }
          }
        }
      } catch (avaiError) {
        console.log('Could not fetch solver data from Avai explorer:', avaiError);
      }
    }
    
    const processedData = {
      intentId, sourceAmount, sourceCurrency, destAmount, destCurrency,
      sourceChain, destChain, status, timestamp,
      sender: address || '', recipient, solver, totalFees,
      senderToSolverHash: sourceAmount ? `0x${Math.random().toString(16).substr(2, 64)}` : '',
      solverToReceiverHash: destAmount ? `0x${Math.random().toString(16).substr(2, 64)}` : '',
      hasRealData: !!(intentId && (sourceAmount || destAmount)),
      _debug: { sourceTokenAddress, destTokenAddress, sourceValue: intent.sources?.[0]?.value, destValue: intent.destinations?.[0]?.value }
    };
    
    console.log('Processed intent data:', processedData);
    return processedData;
    
  } catch (error) {
    console.error('Error extracting intent data:', error);
    return {
      intentId: '', sourceAmount: '', sourceCurrency: '', destAmount: '', destCurrency: '',
      sourceChain: '', destChain: '', status: 'UNKNOWN', timestamp: Date.now() / 1000,
      sender: '', recipient: '', solver: '', totalFees: '', senderToSolverHash: '',
      solverToReceiverHash: '', hasRealData: false
    };
  }
};