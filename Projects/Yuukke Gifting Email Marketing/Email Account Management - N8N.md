# Email Account Management in N8N Workflow
## Advanced Account Rotation and Load Balancing

---

## Current Challenge

You want to properly loop through 10 email accounts while respecting daily limits (40 emails per account per day) and ensuring even distribution.

---

## Solution 1: Enhanced Round-Robin with Daily Tracking

### Updated "Select Email Account" Node Code:

```javascript
// Enhanced Email Account Selection with Daily Limits
const maxEmailsPerAccount = 40; // Daily limit per account
const totalAccounts = 10;

// Get current date for daily tracking
const today = new Date().toISOString().split('T')[0];

// Initialize account usage tracking (this would ideally come from Google Sheets)
let accountUsage = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  6: 0, 7: 0, 8: 0, 9: 0, 10: 0
};

// In a real implementation, you'd read this from Google Sheets "Email Accounts" tab
// For now, we'll use a simple rotation strategy

const results = [];
let currentAccountIndex = 0;

for (let i = 0; i < $input.all().length; i++) {
  const item = $input.all()[i];
  
  // Find next available account
  let selectedAccount = null;
  let attempts = 0;
  
  while (selectedAccount === null && attempts < totalAccounts) {
    const accountId = (currentAccountIndex % totalAccounts) + 1;
    
    // Check if this account hasn't reached daily limit
    if (accountUsage[accountId] < maxEmailsPerAccount) {
      selectedAccount = accountId;
      accountUsage[accountId]++;
    }
    
    currentAccountIndex++;
    attempts++;
  }
  
  // If no account available, skip this email (shouldn't happen with proper limits)
  if (selectedAccount === null) {
    console.log('All accounts have reached daily limit');
    continue;
  }
  
  results.push({
    ...item,
    json: {
      ...item.json,
      selectedEmailAccount: selectedAccount,
      accountUsageToday: accountUsage[selectedAccount]
    }
  });
}

return results;
```

---

## Solution 2: Google Sheets Integration for Account Tracking

### Step 1: Create "Email Accounts" Sheet

**Columns:**
```
A: Account ID (1-10)
B: Email Address
C: SMTP Host
D: SMTP Port  
E: Username
F: App Password
G: Daily Limit (40)
H: Emails Sent Today
I: Last Reset Date
J: Status (active/inactive)
```

### Step 2: Read Account Status Node

Add this node before "Select Email Account":

```javascript
// Read Email Account Status from Google Sheets
// This would be a Google Sheets Read node targeting "Email Accounts" sheet

// The data structure would look like:
const accountData = [
  { 'Account ID': 1, 'Email Address': 'account1@domain.com', 'Emails Sent Today': 15, 'Daily Limit': 40, 'Status': 'active' },
  { 'Account ID': 2, 'Email Address': 'account2@domain.com', 'Emails Sent Today': 23, 'Daily Limit': 40, 'Status': 'active' },
  // ... more accounts
];

return accountData;
```

### Step 3: Smart Account Selection with Real Data

```javascript
// Smart Account Selection using Google Sheets data
const prospects = $input.first().json; // Prospects to send
const accounts = $input.last().json;   // Account status from Google Sheets

const today = new Date().toISOString().split('T')[0];
const results = [];

// Filter available accounts
const availableAccounts = accounts.filter(account => {
  const lastReset = account['Last Reset Date'];
  const emailsSentToday = account['Emails Sent Today'] || 0;
  const dailyLimit = account['Daily Limit'] || 40;
  const status = account['Status'];
  
  // Reset counter if it's a new day
  if (lastReset !== today) {
    emailsSentToday = 0;
  }
  
  return status === 'active' && emailsSentToday < dailyLimit;
});

if (availableAccounts.length === 0) {
  console.log('No available email accounts - daily limits reached');
  return [];
}

// Distribute prospects across available accounts
let accountIndex = 0;

for (let i = 0; i < prospects.length; i++) {
  const prospect = prospects[i];
  
  // Select account with round-robin
  const selectedAccount = availableAccounts[accountIndex % availableAccounts.length];
  
  results.push({
    json: {
      ...prospect,
      selectedEmailAccount: selectedAccount['Account ID'],
      selectedEmailAddress: selectedAccount['Email Address'],
      smtpHost: selectedAccount['SMTP Host'],
      smtpPort: selectedAccount['SMTP Port'],
      smtpUser: selectedAccount['Username'],
      smtpPass: selectedAccount['App Password']
    }
  });
  
  accountIndex++;
}

return results;
```

---

## Solution 3: Time-Based Account Rotation

### Distribute by Hour of Day

```javascript
// Time-based Account Distribution
const currentHour = new Date().getHours();
const prospects = $input.all();
const results = [];

// Create account groups for different time slots
const accountGroups = {
  morning: [1, 2, 3],      // 9 AM - 12 PM
  afternoon: [4, 5, 6],    // 12 PM - 3 PM  
  evening: [7, 8, 9, 10]   // 3 PM - 6 PM
};

let selectedGroup;
if (currentHour >= 9 && currentHour < 12) {
  selectedGroup = accountGroups.morning;
} else if (currentHour >= 12 && currentHour < 15) {
  selectedGroup = accountGroups.afternoon;
} else if (currentHour >= 15 && currentHour < 18) {
  selectedGroup = accountGroups.evening;
} else {
  selectedGroup = [1, 2]; // Off-hours, use minimal accounts
}

// Distribute prospects across selected account group
for (let i = 0; i < prospects.length; i++) {
  const prospect = prospects[i];
  const accountIndex = i % selectedGroup.length;
  const selectedAccount = selectedGroup[accountIndex];
  
  results.push({
    ...prospect,
    json: {
      ...prospect.json,
      selectedEmailAccount: selectedAccount
    }
  });
}

return results;
```

---

## Solution 4: Load Balancing with Retry Logic

### Advanced Account Selection with Fallback

```javascript
// Advanced Load Balancing with Retry Logic
const maxEmailsPerAccount = 40;
const accounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const prospects = $input.all();

// Simulated account usage (in real scenario, read from Google Sheets)
let accountUsage = {
  1: 35, 2: 20, 3: 15, 4: 40, 5: 25,  // Account 4 is at limit
  6: 10, 7: 30, 8: 5, 9: 38, 10: 12
};

function findBestAccount(excludeAccounts = []) {
  const availableAccounts = accounts.filter(id => 
    !excludeAccounts.includes(id) && 
    accountUsage[id] < maxEmailsPerAccount
  );
  
  if (availableAccounts.length === 0) return null;
  
  // Find account with lowest usage
  return availableAccounts.reduce((best, current) => 
    accountUsage[current] < accountUsage[best] ? current : best
  );
}

const results = [];
const failedEmails = [];

for (let i = 0; i < prospects.length; i++) {
  const prospect = prospects[i];
  
  // Try to find available account
  const selectedAccount = findBestAccount();
  
  if (selectedAccount === null) {
    // No accounts available, add to failed list
    failedEmails.push({
      ...prospect,
      json: {
        ...prospect.json,
        status: 'failed',
        reason: 'no_available_accounts'
      }
    });
    continue;
  }
  
  // Assign prospect to account
  accountUsage[selectedAccount]++;
  
  results.push({
    ...prospect,
    json: {
      ...prospect.json,
      selectedEmailAccount: selectedAccount,
      accountCurrentUsage: accountUsage[selectedAccount]
    }
  });
}

// Log failed emails for retry later
if (failedEmails.length > 0) {
  console.log(`${failedEmails.length} emails failed due to account limits`);
}

return results;
```

---

## Solution 5: Update Account Usage After Sending

### Post-Send Account Update Node

```javascript
// Update Account Usage in Google Sheets after sending
const sentEmails = $input.all();
const today = new Date().toISOString().split('T')[0];

// Group by account
const accountUpdates = {};

sentEmails.forEach(email => {
  const accountId = email.json.selectedEmailAccount;
  if (!accountUpdates[accountId]) {
    accountUpdates[accountId] = 0;
  }
  accountUpdates[accountId]++;
});

// Prepare updates for Google Sheets
const updates = Object.keys(accountUpdates).map(accountId => ({
  json: {
    'Account ID': parseInt(accountId),
    'Emails Sent Today': accountUpdates[accountId],
    'Last Reset Date': today,
    'Last Updated': new Date().toISOString()
  }
}));

return updates;
```

---

## Recommended Implementation

### Best Practice Workflow:

1. **Read Account Status** from Google Sheets
2. **Filter Available Accounts** (under daily limit)
3. **Smart Distribution** using load balancing
4. **Send Emails** with assigned accounts  
5. **Update Account Usage** back to Google Sheets

### Benefits:

- **Respects Daily Limits**: Never exceeds 40 emails per account
- **Even Distribution**: Balances load across accounts
- **Fault Tolerance**: Handles account failures gracefully
- **Tracking**: Complete visibility into account usage
- **Scalable**: Easy to add/remove accounts

Would you like me to update the main workflow JSON file with one of these advanced account rotation methods?
