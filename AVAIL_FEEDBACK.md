# AVAIL Framework Feedback

This document contains feedback, issues, and suggestions for the AVAIL team based on our experience building PayStream - a Web3 payment management system.

## Project Overview

**Project**: PayStream - Web3 Payment Management System  
**Use Case**: Employer-employee payment processing with cross-chain capabilities  
**Framework**: AVAIL Framework with Nexus SDK integration  

### 1. Documentation Questions

**Issue**: Question on Allowances and order of operations 
```
How Allowances Work?
Here is how the allowances enables chain abstracted transactions:

User approves the protocol to access funds from two or more source chains.
Protocol unifies user balance across these chains.
Unified funds go into protocol vaults.
The protocol presents the user with an intent to transact on the destination along with amount and fee details.
```

When you say `unified funds go into protocol vaults` does the users wallet get emptied of a token type and put into protocol vaults?  Or is it just the amount of the transaction?  I was a bit confused because the default allowance is unlimited, I assume its just the transaction amount but wasn't 100% sure here.

Do you have an easy way for users to revoke all allowances in the event of a security issue?  Or should each app provide that capability?







### 2. Intent Explorer Integration

**Issue**: Intent Explorer is a website, not an API
- **Impact**: Had to implement HTML scraping instead of clean API integration
- **Current Workaround**: Using DOMParser and regex to extract transaction data
- **Suggestion**: Consider providing a REST API for intent data access
- **Priority**: Medium

### 3. Transaction Status Tracking

**Issue**: Difficulty tracking transaction status across different chains
- **Impact**: Inconsistent user experience
- **Suggestion**: Provide standardized status tracking APIs
- **Priority**: High
