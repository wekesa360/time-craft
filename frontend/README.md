# TimeCraft Frontend

A comprehensive productivity application built with React, TypeScript, and modern web technologies. TimeCraft combines task management, health tracking, calendar management, and social features in one unified platform.

## 🚀 Features

### Core Functionality
- **Task Management**: Eisenhower Matrix-based task organization
- **Health Tracking**: Exercise, nutrition, and mood monitoring
- **Calendar Management**: AI-powered scheduling and meeting management
- **Focus Sessions**: Pomodoro timers and productivity tracking
- **Gamification**: Badge system and social challenges
- **Voice Interface**: Voice commands and dictation
- **Analytics**: Comprehensive productivity insights

### Advanced Features
- **Admin Dashboard**: System metrics, user management, feature flags
- **Multi-language Support**: Full German localization with cultural adaptations
- **Dark/Light Themes**: Dynamic theme switching with system preference detection
- **Accessibility**: WCAG 2.1 AA compliance with screen reader support
- **Offline Support**: Service worker integration and offline queue system
- **Real-time Updates**: Server-sent events for live notifications

## 🛠 Technology Stack

### Core Technologies
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety and modern language features
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS 4**: Utility-first styling with custom design system

### State Management & Data Fetching
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management with caching
- **React Hook Form**: Performant forms with validation
- **Zod**: Runtime type validation

### UI & UX
- **Framer Motion**: Advanced animations and micro-interactions
- **Headless UI**: Unstyled, accessible UI components
- **Lucide React**: Beautiful SVG icons
- **React Hot Toast**: Elegant notifications

### Development & Testing
- **Vitest**: Fast unit and integration testing
- **Testing Library**: Component testing utilities
- **MSW**: API mocking for development and testing
- **ESLint + TypeScript**: Code quality and consistency

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   ├── accessibility/   # Accessibility providers
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   ├── error/           # Error handling components
│   └── onboarding/      # User onboarding flow
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── utils/               # Utility functions
├── api/                 # API integration
├── i18n/                # Internationalization
├── test/                # Test utilities
└── types/               # TypeScript type definitions
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+ or yarn 3+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd time-craft/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:8787
VITE_APP_NAME=TimeCraft
VITE_ENABLE_DEV_TOOLS=true
```

## 📱 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Testing
```bash
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run test:accessibility # Run accessibility tests
npm run test:integration   # Run integration tests
npm run test:all     # Run all test suites
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript compiler
```

## 🎨 Design System

### Color System
- **Primary**: Blue tones for main actions and branding
- **Secondary**: Gray tones for supporting elements
- **Semantic**: Green (success), Red (error), Yellow (warning), Blue (info)
- **Dark Mode**: Full dark theme support with proper contrast ratios

### Typography
- **Headings**: Inter font family with responsive sizing
- **Body Text**: Optimized for readability across devices
- **Code**: Monospace font for technical content

### Spacing & Layout
- **8px Grid**: Consistent spacing system
- **Responsive Breakpoints**: Mobile-first approach
- **Container Sizes**: Optimized for different screen sizes

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and announcements
- **Color Contrast**: Meets accessibility contrast requirements
- **Focus Management**: Visible focus indicators and logical tab order

### German-Specific Features
- **Keyboard Shortcuts**: German keyboard layout support
- **Cultural Adaptations**: Date/number formats, currency display
- **Language Switching**: Seamless language transitions

## 🌐 Internationalization (i18n)

### Supported Languages
- **English**: Default language
- **German**: Complete localization with cultural adaptations

### Features
- **Dynamic Loading**: Languages loaded on demand
- **Fallback System**: Graceful degradation to default language
- **Cultural Formatting**: Locale-specific dates, numbers, currency
- **RTL Support**: Ready for right-to-left languages

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with refresh tokens
- **Role-based Access**: Admin, Student, User roles
- **Route Protection**: Secure route guards
- **Session Management**: Automatic token refresh

### Data Security
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized content rendering
- **CSRF Protection**: Cross-site request forgery prevention
- **Content Security Policy**: Ready for CSP implementation

## 📊 Performance Optimizations

### Bundle Optimization
- **Code Splitting**: Route-based and vendor splitting
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: Components and routes loaded on demand
- **Asset Optimization**: Images, fonts, and CSS optimization

### Runtime Performance
- **React Query Caching**: Intelligent data caching
- **Virtual Scrolling**: Efficient large list rendering
- **Memoization**: Optimized re-renders
- **Web Vitals Monitoring**: Core performance metrics tracking

## 🧪 Testing Strategy

### Unit Testing
- **Component Tests**: Individual component functionality
- **Hook Tests**: Custom hook behavior
- **Utility Tests**: Pure function testing

### Integration Testing
- **User Workflows**: End-to-end user scenarios
- **API Integration**: Mock API interactions
- **Accessibility Testing**: Automated a11y checks

### E2E Testing
- **Critical Paths**: Complete user journeys
- **Cross-browser Testing**: Browser compatibility
- **Performance Testing**: Load time and responsiveness

## 🚀 Deployment

### Build Process
```bash
# Production build
npm run build

# Analyze bundle size
npm run build:analyze

# Preview production build
npm run preview
```

### Environment Variables
- **VITE_API_BASE_URL**: Backend API URL
- **VITE_APP_NAME**: Application name
- **VITE_SENTRY_DSN**: Error tracking (optional)
- **VITE_ANALYTICS_ID**: Analytics tracking (optional)

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Error Boundaries**: Global error handling
- **Performance API**: Real-time metrics collection
- **Bundle Analysis**: Build size monitoring

## 📚 Documentation

- **[Production Optimizations](./PRODUCTION_OPTIMIZATIONS.md)**: Detailed optimization guide
- **[Component Library](./docs/components.md)**: Component documentation
- **[API Integration](./docs/api.md)**: Backend integration guide
- **[Accessibility Guide](./docs/accessibility.md)**: A11y implementation details

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run quality checks (`npm run lint`, `npm run test`)
4. Submit pull request with description

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code style
- **Prettier**: Consistent formatting
- **Conventional Commits**: Structured commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and API docs
- **Community**: Discussion forums and chat

### Known Issues
- Some test files have syntax errors (in progress)
- Linting rules need refinement for production code
- Error reporting integration pending

---

**TimeCraft Frontend** - Built with ❤️ using modern web technologies for optimal user experience and developer productivity.