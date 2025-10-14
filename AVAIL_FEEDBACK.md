# AVAIL Framework Feedback

This document contains feedback, issues, and suggestions for the AVAIL team based on our experience building PayStream - a Web3 payment management system.

## Project Overview

**Project**: PayStream - Web3 Payment Management System  
**Use Case**: Employer-employee payment processing with cross-chain capabilities  
**Framework**: AVAIL Framework with Nexus SDK integration  

### Documentation Questions

**Issue 1**: Question on Allowances and order of operations 
```
How Allowances Work?
Here is how the allowances enables chain abstracted transactions:

User approves the protocol to access funds from two or more source chains.
Protocol unifies user balance across these chains.
Unified funds go into protocol vaults.
The protocol presents the user with an intent to transact on the destination along with amount and fee details.
```

When you say `unified funds go into protocol vaults` does the users wallet get emptied of a token type and put into protocol vaults?  Or is it just the amount of the transaction?  I was a bit confused because the default allowance is unlimited, I assume its just the transaction amount but wasn't 100% sure here.

**Issue 1.1**
Do you have an easy way for users to revoke all allowances in the event of a security issue?  Or should each app provide that capability?


**Issue 2**: Traceability and Error Handling of Transactions
It would be nice to be able to see a transaction end to end, right now its a bit cloudy on what happens with a TX - after simulation is it garanteed the liqudity is still there?

Are there any cases where the user funds are taken but then the solvers can't make it work for the destinatinon payment, is the $ then sent back to the user?


