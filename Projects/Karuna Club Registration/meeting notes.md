# Database management workflow for school registration system

Tue, 09 Sept 25

### Database Duplicate School Prevention Strategy

- New “Karuna Club” registration reveals existing database issues
  - Same school already exists with different spelling variations
  - International School spelling inconsistencies: “mahaveer” vs “mahavir”, “intl” vs “intr”
- No automated way to detect duplicates when:
  - Phone numbers change
  - Email addresses differ
  - School names have spelling variations
- AI-based close spelling detection possible but not foolproof

### PIN Code-Based Verification System

- PIN codes identified as most reliable duplicate detection method
  - Schools rarely change location/PIN code
  - Multiple schools can share same PIN code but usually have different names
- Current database status:
  - 350 PIN codes missing (~12-15% of database)
  - Requires manual verification process
- Proposed workflow:
  - Enter PIN code first during registration
  - Display all schools in that PIN code
  - Manually verify if new registration matches existing school

### Manual Approval Workflow Design

- Online registration won’t auto-add to database
- Two-stage approval process:
  - Initial data completeness check
  - Duplicate verification before number allocation
- Required approval interface features:
  - PIN code search capability
  - School name search options
  - Duplicate detection tools
- School registration number only allocated after full approval

### System Requirements Summary

- Dual authorization and role-based access control
- Approval workflow with email notifications
- Comprehensive database management with:
  - Mandatory email addresses
  - Advanced search and filtering
  - Bulk import/export capabilities
  - Data cleansing for formatting consistency (capitalization, spelling uniformity)

---

Chat with meeting transcript: [https://notes.granola.ai/d/af0371c7-47b8-4493-9af3-3a328df73f38](https://notes.granola.ai/d/af0371c7-47b8-4493-9af3-3a328df73f38)