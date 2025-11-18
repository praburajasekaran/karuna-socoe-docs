# Google Sheets Template for Diwali Email Campaign
## Required Sheet Structure for N8N Workflow

---

## Sheet 1: "Prospects" (Your Apollo.io data goes here)

### Column Headers (Row 1):
```
A: Email
B: First Name  
C: Last Name
D: Company Name
E: Job Title
F: Industry
G: Company Size
H: Location/City
I: Phone
J: LinkedIn URL
K: Company Website
L: Status
M: Email Sent Date
N: Response Date
O: Response Type
P: Follow-up Status
Q: Notes
R: Email Account Used
```

### Sample Data (Rows 2+):
```
john.doe@techcorp.com | John | Doe | TechCorp Solutions | Founder | Technology | 50-100 | Mumbai | +91-9876543210 | linkedin.com/in/johndoe | techcorp.com | pending | | | | | |
```

---

## Sheet 2: "Email Accounts" (Configure your 10 email accounts)

### Column Headers (Row 1):
```
A: Account ID
B: Email Address
C: SMTP Host
D: SMTP Port
E: Username
F: App Password
G: Daily Limit
H: Emails Sent Today
I: Last Reset Date
J: Status
```

### Sample Data (Rows 2-11):
```
1 | account1@yourdomain.com | smtp.gmail.com | 587 | account1@yourdomain.com | your_app_password_1 | 40 | 0 | 2025-09-16 | active
2 | account2@yourdomain.com | smtp.gmail.com | 587 | account2@yourdomain.com | your_app_password_2 | 40 | 0 | 2025-09-16 | active
3 | account3@yourdomain.com | smtp.gmail.com | 587 | account3@yourdomain.com | your_app_password_3 | 40 | 0 | 2025-09-16 | active
4 | account4@yourdomain.com | smtp.gmail.com | 587 | account4@yourdomain.com | your_app_password_4 | 40 | 0 | 2025-09-16 | active
5 | account5@yourdomain.com | smtp.gmail.com | 587 | account5@yourdomain.com | your_app_password_5 | 40 | 0 | 2025-09-16 | active
6 | account6@yourdomain.com | smtp.gmail.com | 587 | account6@yourdomain.com | your_app_password_6 | 40 | 0 | 2025-09-16 | active
7 | account7@yourdomain.com | smtp.gmail.com | 587 | account7@yourdomain.com | your_app_password_7 | 40 | 0 | 2025-09-16 | active
8 | account8@yourdomain.com | smtp.gmail.com | 587 | account8@yourdomain.com | your_app_password_8 | 40 | 0 | 2025-09-16 | active
9 | account9@yourdomain.com | smtp.gmail.com | 587 | account9@yourdomain.com | your_app_password_9 | 40 | 0 | 2025-09-16 | active
10 | account10@yourdomain.com | smtp.gmail.com | 587 | account10@yourdomain.com | your_app_password_10 | 40 | 0 | 2025-09-16 | active
```

---

## Sheet 3: "Campaign Stats" (Auto-populated by N8N)

### Column Headers (Row 1):
```
A: Date
B: Emails Sent
C: Bounces
D: Responses
E: Positive Responses
F: Follow-ups Sent
G: Timestamp
```

### Sample Data (Auto-generated):
```
2025-09-16 | 40 | 2 | 3 | 2 | 0 | 2025-09-16T10:30:00.000Z
2025-09-17 | 40 | 1 | 5 | 3 | 2 | 2025-09-17T10:30:00.000Z
```

---

## Setup Instructions

### Step 1: Create Google Sheet
1. Go to Google Sheets
2. Create a new spreadsheet
3. Name it "Yuukke Diwali Email Campaign"
4. Create the 3 sheets as shown above

### Step 2: Import Apollo.io Data
1. Export your Apollo.io data as CSV
2. Import into the "Prospects" sheet
3. Make sure column headers match exactly
4. Set all "Status" values to "pending"

### Step 3: Configure Email Accounts
1. Create 10 Gmail accounts (or use existing ones)
2. Enable 2-factor authentication on each
3. Generate app passwords for each account
4. Fill in the "Email Accounts" sheet with your credentials

### Step 4: Set Permissions
1. Share the Google Sheet with your N8N service account
2. Give "Editor" permissions
3. Copy the Google Sheet ID from the URL

### Step 5: Update N8N Workflow
1. Replace "YOUR_GOOGLE_SHEET_ID" in the workflow with your actual Sheet ID
2. Import the updated workflow into N8N
3. Test with a few prospects first

---

## Advanced Features

### Load Balancing
The workflow automatically:
- Selects accounts with lowest usage first
- Respects daily limits (40 emails per account)
- Resets counters daily
- Handles account failures gracefully

### Real-time Tracking
Monitor your campaign through:
- **Prospects Sheet**: See status of each email sent
- **Email Accounts Sheet**: Track usage per account
- **Campaign Stats Sheet**: Daily performance metrics

### Follow-up Management
The system automatically:
- Sends follow-ups after 2 days
- Tracks response types
- Manages follow-up status
- Prevents duplicate sends

---

## Monitoring Dashboard

### Daily Checklist
- [ ] Check Campaign Stats for daily performance
- [ ] Review Email Accounts usage
- [ ] Monitor bounce rates
- [ ] Respond to inquiries in Prospects sheet

### Weekly Review
- [ ] Analyze response rates by industry
- [ ] Optimize email templates based on performance
- [ ] Clean bounced emails from prospects list
- [ ] Update follow-up sequences

---

## Troubleshooting

### Common Issues
1. **"No available accounts"**: Check if daily limits reached
2. **Authentication errors**: Verify app passwords
3. **Sheet not updating**: Check N8N permissions
4. **Emails not sending**: Verify SMTP settings

### Account Management
- Rotate accounts if one gets flagged
- Monitor sending reputation
- Keep backup accounts ready
- Use different domains if possible

This Google Sheets structure will give you complete control over your email campaign with real-time tracking and intelligent account management!
