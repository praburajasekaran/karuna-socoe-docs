# Karuna Stories of Compassion Exam System - Final Project Specification

## Project Overview
**Project Name**: Karuna Stories of Compassion Exam System  
**Client**: Karuna International  
**Duration**: 8-9 weeks  
**Total Budget**: ₹1,40,000 (₹1,20,000 development + ₹20,000 support)  
**Scale**: 50 schools, 15,000+ students  

## Final Decisions Made ✅

### Core Features
- ✅ **Auto-save functionality**: Include with resume capability
- ✅ **Email system**: 6-email comprehensive workflow
- ✅ **Timeline**: 8-9 weeks development 
- ✅ **Technology**: Simplified hybrid (WordPress admin + Node.js exam API)
- ✅ **Pricing**: ₹1,20,000 development + ₹20,000 support

### Technical Architecture
- **Admin Interface**: WordPress with custom plugin (school management, reports, certificates)
- **Exam API**: Node.js microservice (high-performance exam delivery for 500 concurrent users)
- **Database**: MySQL 8.0 + Redis cache (shared between systems)
- **File Storage**: Google Drive integration

## Core Requirements

### Student Portal
- **Login**: KC Number + Name + Roll Number verification
- **Exam Interface**: 30 MCQ questions with randomized order
- **Auto-save**: Every 30 seconds + on answer changes
- **Resume**: Continue from where left off
- **Results**: Available after 7-day exam window closes

### Admin Dashboard
- **School Management**: Add/edit school information
- **Student Registration**: Excel upload for bulk registration
- **Question Management**: Create/edit 30 MCQ questions
- **Analytics**: Comprehensive reporting and statistics

### Automated Processes
- **Label Generation**: A4 printable labels (16 per sheet) sent to school email
- **Certificate Generation**: PDF certificates with Google Drive storage
- **Score Calculation**: Automatic scoring and pass/fail determination

## Email Workflow System (6 Emails)

### Pre-Exam
1. **Label Delivery**: PDF labels with login credentials

### During Exam (7-day window)
2. **Exam Start**: Day 1 notification
3. **Mid-Progress**: Day 4 progress update
4. **Final Reminder**: Day 7 last chance

### Post-Exam
5. **Results Available**: Day 8 results notification
6. **Certificate Delivery**: Day 10 certificate access

## Auto-Save & Resume Features

### Auto-Save Capabilities
- **Real-time saving**: Every 30 seconds
- **Answer changes**: Immediate save on selection
- **Offline support**: Local storage when disconnected
- **Connection monitoring**: Visual indicators

### Resume Functionality
- **Session recovery**: Continue from exact position
- **Progress restoration**: All answers preserved
- **Connection resilience**: Works with unstable internet
- **Mobile support**: Full mobile compatibility

## Development Timeline (8-9 Weeks)

### Week 1-2: WordPress Admin Plugin (₹30,000)
- School management interface
- Student management with Excel upload
- Question bank management
- Basic reporting interface

### Week 3-4: Node.js Exam API (₹35,000)
- Authentication system
- Exam delivery API
- Auto-save functionality
- Session management

### Week 5-6: Integration & Security (₹25,000)
- WordPress-Node.js integration
- Security implementation
- Data encryption
- API authentication

### Week 7: Testing & Optimization (₹15,000)
- Unit and integration testing
- Load testing with 500 users
- Performance optimization
- Security testing

### Week 8-9: Deployment & Go-Live (₹15,000)
- Docker containerization
- Production deployment
- Performance tuning
- Final testing and launch

## Cost Breakdown

### Development Cost: ₹1,20,000
- **Week 1-2**: ₹30,000 (WordPress Admin Plugin)
- **Week 3-4**: ₹35,000 (Node.js Exam API)
- **Week 5-6**: ₹25,000 (Integration & Security)
- **Week 7**: ₹15,000 (Testing & Optimization)
- **Week 8-9**: ₹15,000 (Deployment & Go-Live)

### Support Cost: ₹20,000
- **Exam period support**: 7-day coverage
- **Response time**: 1-2 hours
- **Coverage**: 7 AM - 10 PM IST

### Total Project Cost: ₹1,40,000

## Technical Specifications

### Simplified Hybrid Architecture
```
WordPress Admin Plugin:
├── School Management Interface
├── Student Management (Excel upload)
├── Question Bank Management
├── Report Generation & Analytics
├── Certificate Generation
└── Email Workflow System

Node.js Exam Microservice:
├── Student Authentication
├── Exam Session Management
├── Question Delivery API
├── Auto-Save & Resume System
├── Answer Collection
└── Performance Optimization

Shared Infrastructure:
├── MySQL Database (shared)
├── Redis Cache (sessions & auto-save)
└── Google Drive Integration
```

### Database Schema
- **WordPress Tables**: Schools, students, questions (managed by WordPress)
- **Exam Tables**: Sessions, answers, auto-save data (managed by Node.js)
- **Shared Tables**: Student data, question bank (shared between systems)

### API Endpoints
- **WordPress Admin**: School management, student upload, reports, certificates
- **Node.js Exam API**: Student authentication, exam delivery, auto-save, session management
- **Integration Bridge**: Data synchronization between WordPress and Node.js

## Success Metrics

### Performance Targets
- **System Uptime**: 99.9% during exam period
- **Response Time**: < 2 seconds for exam loading
- **Concurrent Users**: Support 15,000+ simultaneous users
- **Auto-Save Success**: 100% data preservation
- **Resume Success**: >99% successful exam resumptions

### User Satisfaction
- **School Feedback**: Positive feedback from all schools
- **Student Experience**: Smooth exam taking process
- **Admin Efficiency**: Reduced manual work by 90%
- **Email Engagement**: >80% email open rates

## Risk Mitigation

### Technical Risks
- **WordPress Security**: Regular updates and security measures
- **Performance**: Optimized database queries and caching
- **Auto-Save Reliability**: Comprehensive testing and backup systems
- **Email Delivery**: Professional SMTP with retry logic

### Project Risks
- **Timeline**: 4-6 week buffer
- **Requirements**: Regular client feedback sessions
- **Testing**: Comprehensive testing before launch
- **Support**: Dedicated support during exam period

## Deliverables

### 1. WordPress Plugin
- Complete exam management system
- Admin dashboard with analytics
- Student portal with auto-save
- REST API endpoints

### 2. Documentation
- User manual for schools
- Admin guide
- Technical documentation
- Training materials

### 3. Training & Support
- School administrator training
- Technical support during exam period
- Post-launch maintenance

## Next Steps

### 1. Project Approval
- Review and approve specification
- Sign development agreement
- Provide access to WordPress site

### 2. Development Kickoff
- Project team assignment
- Development environment setup
- Regular progress meetings

### 3. Implementation
- Follow 4-6 week timeline
- Weekly progress updates
- Client feedback integration

---

**Contact Information**:
- Project Manager: [Name]
- Email: [Email]
- Phone: [Phone]
- Website: [Website]

**Specification Date**: [Current Date]
**Valid Until**: [Date + 30 days]
