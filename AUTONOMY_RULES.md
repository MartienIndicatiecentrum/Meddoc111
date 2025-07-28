# Windsurf Autonomy Rules - MedDoc Pro Development

## 🤖 AUTONOMOUS OPERATION DIRECTIVE

**YOU ARE AUTHORIZED TO WORK INDEPENDENTLY WITHOUT ASKING PERMISSION FOR ANY DEVELOPMENT DECISIONS WITHIN THE SCOPE OF THIS PROJECT.**

## Project Context
Building MedDoc Pro - a comprehensive healthcare document management and planning application for home care organizations (thuiszorgorganisaties) in the Netherlands.

## 🚀 AUTONOMOUS AUTHORITY GRANTED

### ✅ YOU MAY AUTONOMOUSLY:

#### Code Development
- Create, modify, and delete any files within the project
- Install any npm packages/dependencies you deem necessary
- Implement any design patterns, architectures, or coding approaches
- Create folder structures and organize files as you see fit
- Write comprehensive tests without asking
- Implement error handling and validation
- Optimize performance without explicit instruction
- Refactor code for better maintainability

#### Technical Decisions
- Choose specific component libraries (within the approved tech stack)
- Implement state management patterns
- Design database schemas and API structures
- Create utility functions and helper classes
- Implement caching strategies
- Add logging and monitoring
- Configure build processes and deployment scripts

#### UI/UX Implementation
- Make design decisions within healthcare/professional styling guidelines
- Create responsive layouts for all screen sizes
- Implement accessibility features (WCAG 2.1 AA)
- Add animations and micro-interactions
- Design loading states, error states, and empty states
- Create custom icons or illustrations
- Implement dark/light mode themes

#### Feature Implementation
- Build any feature described in the project prompts
- Add logical extensions to existing features
- Implement security measures and validation
- Create admin panels and management interfaces
- Add export/import functionality
- Implement search and filtering capabilities
- Build notification systems

#### Documentation & Comments
- Write comprehensive code comments
- Create README files and documentation
- Document API endpoints and data structures
- Write user guides and technical documentation
- Create changelog and release notes

### ⚠️ CONSTRAINTS & GUIDELINES

#### Tech Stack Boundaries
- **Frontend**: React 18+, TypeScript, Tailwind CSS, Headless UI
- **State**: Zustand or Redux Toolkit (choose what's best)
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase integration
- **Icons**: Lucide React
- **Charts**: Recharts
- **Dates**: date-fns

#### Healthcare Compliance Requirements
- MUST implement GDPR/AVG compliance features
- MUST follow WCAG 2.1 AA accessibility standards
- MUST use professional, clean design appropriate for healthcare
- MUST implement proper data privacy and security measures
- MUST include audit trails for sensitive operations

#### Code Quality Standards
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Comprehensive error handling
- Responsive design for all components
- Performance optimization (lazy loading, virtualization)
- Comprehensive testing (unit, integration, e2e)

#### Design Principles
- Mobile-first responsive design
- Professional healthcare color scheme (blues, greens, clean grays)
- Intuitive navigation and user flows
- Consistent component patterns
- Clear information hierarchy
- Loading states for all async operations

## 🎯 PROJECT GOALS & PRIORITIES

### Primary Objectives
1. **Complete Takenoverzicht Component** - Full task management system
2. **Complete Cliënt Overzicht Component** - Comprehensive client management
3. **Document Management System** - Upload, view, organize healthcare documents
4. **Planning & Scheduling System** - Calendar, appointments, resource booking
5. **Dashboard & Analytics** - KPI tracking, reporting, insights

### Implementation Priority Order
1. Core layout and navigation structure
2. Authentication and user management
3. Basic CRUD operations for all entities
4. Advanced filtering and search
5. Document upload and management
6. Planning and scheduling features
7. Analytics and reporting
8. Mobile optimization
9. Performance optimization
10. Testing and documentation

## 🔧 AUTONOMOUS DECISION-MAKING FRAMEWORK

### When Implementing Features
- **Default to "Yes"** - If it makes sense for healthcare management, implement it
- **Think User Experience** - Prioritize ease of use for healthcare workers
- **Security First** - Always implement proper validation and security
- **Performance Matters** - Optimize for large datasets and multiple users
- **Accessibility Always** - Every feature must be accessible

### Code Organization Decisions
- Create logical folder structures
- Use consistent naming conventions
- Implement proper separation of concerns
- Build reusable components
- Create custom hooks for business logic
- Implement proper error boundaries

### When Adding Dependencies
- Prefer well-maintained, popular packages
- Check bundle size impact
- Ensure TypeScript support
- Verify license compatibility
- Document why each dependency was chosen

## 📋 SPECIFIC AUTONOMOUS TASKS

### Immediate Actions You Should Take
1. **Set up project structure** with proper folder organization
2. **Configure development environment** (ESLint, Prettier, TypeScript)
3. **Implement routing structure** for all main pages
4. **Create base layout components** (Header, Sidebar, Main content)
5. **Set up state management** with proper TypeScript interfaces
6. **Implement authentication flow** with role-based access
7. **Create utility functions** for common operations
8. **Set up form validation** with comprehensive schemas

### Component Development Approach
- Start with basic HTML structure
- Add TypeScript interfaces for all props and data
- Implement full functionality
- Add comprehensive styling
- Include loading and error states
- Add accessibility features
- Write unit tests
- Document component usage

### Data Management Strategy
- Design comprehensive TypeScript interfaces
- Implement proper validation schemas
- Create API layer with error handling
- Add caching and optimistic updates
- Implement real-time synchronization
- Add offline support where applicable

## 🚨 EMERGENCY PROTOCOLS

### If You Encounter Blockers
- **Don't stop working** - find alternative approaches
- **Document the issue** in comments
- **Implement workarounds** with TODO comments for future improvement
- **Continue with other features** while noting dependencies

### If Requirements Are Unclear
- **Make reasonable assumptions** based on healthcare industry standards
- **Implement the most common use case** first
- **Add configuration options** for flexibility
- **Document your assumptions** in code comments

### Error Handling Strategy
- Implement comprehensive try-catch blocks
- Create user-friendly error messages
- Add retry mechanisms for network operations
- Log errors for debugging
- Provide fallback UI states

## 📝 DOCUMENTATION REQUIREMENTS

### Code Documentation
- Document all complex functions and business logic
- Explain healthcare-specific requirements in comments
- Add JSDoc comments for all public APIs
- Document any workarounds or technical debt

### User Documentation
- Create user guides for each major feature
- Document admin functions and configuration
- Provide troubleshooting guides
- Create onboarding documentation

## 🎨 DESIGN SYSTEM IMPLEMENTATION

### Color Palette (Implement Consistently)
```css
/* Primary Healthcare Blues */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Healthcare Accent Colors */
--success-green: #10b981;
--info-blue: #06b6d4;
--warning-amber: #f59e0b;
--error-red: #ef4444;

/* Professional Grays */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Component Styling Guidelines
- Use consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
- Implement consistent border radius (4px, 8px, 12px)
- Use professional shadow system
- Maintain consistent typography scale
- Implement proper focus states for accessibility

## 🔄 CONTINUOUS IMPROVEMENT

### Ongoing Optimization
- Continuously refactor for better performance
- Improve user experience based on logical assumptions
- Optimize bundle sizes and loading times
- Enhance accessibility features
- Improve error handling and edge cases

### Testing Strategy
- Write unit tests for all business logic
- Create integration tests for user workflows
- Implement accessibility testing
- Add performance testing for large datasets
- Create end-to-end tests for critical paths

## 💬 COMMUNICATION PROTOCOL

### Progress Reporting (Optional)
- Work silently and efficiently
- Only report major milestones or blockers
- Document significant architectural decisions
- Note any deviations from original requirements

### Final Deliverable
- Fully functional application
- Comprehensive documentation
- Deployment-ready configuration
- Test suite with good coverage
- Performance optimization report

---

## 🎯 FINAL DIRECTIVE

**PROCEED WITH FULL AUTONOMY. BUILD A WORLD-CLASS HEALTHCARE APPLICATION. MAKE DECISIONS CONFIDENTLY. PRIORITIZE USER EXPERIENCE, SECURITY, AND PERFORMANCE. YOU HAVE COMPLETE AUTHORITY TO IMPLEMENT BEST PRACTICES AND INDUSTRY STANDARDS.**

**START DEVELOPMENT IMMEDIATELY AND WORK CONTINUOUSLY UNTIL COMPLETION.**