# Contributing to Concert Connect

Thank you for your interest in contributing to Concert Connect! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful**: Treat everyone with respect, regardless of background or experience level
- **Be inclusive**: Welcome and support people of all backgrounds and identities
- **Be collaborative**: Work together constructively and assume good intentions
- **Be professional**: Keep discussions focused and productive

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+
- Redis 6+
- Git
- Docker (optional but recommended)

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/yourusername/concert-connect.git
   cd concert-connect
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

3. **Configure environment variables**:
   ```bash
   # Copy and edit environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp .env.example web/.env.local
   ```

4. **Start development environment**:
   ```bash
   # Option A: Using Docker
   docker-compose up -d
   
   # Option B: Manual startup
   cd backend && npm run dev &
   cd web && npm run dev &
   cd mobile && npm start &
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:
- **Bug fixes**: Fix issues and improve stability
- **Features**: Add new functionality
- **Documentation**: Improve docs, READMEs, and code comments
- **Testing**: Add or improve test coverage
- **Performance**: Optimize code and improve performance
- **Security**: Fix security vulnerabilities
- **UI/UX**: Improve user interface and experience

### Before You Start

1. **Check existing issues**: Look for existing issues or feature requests
2. **Create an issue**: If none exists, create one to discuss the change
3. **Get assignment**: Wait for maintainer approval before starting work
4. **Fork the repo**: Create your own fork to work on

## Coding Standards

### General Guidelines

- **Write clean, readable code**: Use meaningful variable and function names
- **Follow existing patterns**: Maintain consistency with existing codebase
- **Add comments**: Explain complex logic and business rules
- **Keep functions small**: Aim for single responsibility principle
- **Handle errors gracefully**: Implement proper error handling

### TypeScript/JavaScript

```typescript
// Use TypeScript interfaces and types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Use async/await over Promises
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await userService.getById(id);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    throw new Error('User not found');
  }
}

// Use descriptive function names
function calculateEventRecommendationScore(event: Event, user: User): number {
  // Implementation here
}
```

### React/React Native

```tsx
// Use functional components with hooks
function EventCard({ event, onPress }: EventCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use useCallback for event handlers
  const handlePress = useCallback(() => {
    onPress(event.id);
  }, [event.id, onPress]);
  
  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Component JSX */}
    </TouchableOpacity>
  );
}

// Use TypeScript props interfaces
interface EventCardProps {
  event: Event;
  onPress: (eventId: string) => void;
}
```

### CSS/Styling

```css
/* Use meaningful class names */
.event-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Use CSS custom properties for consistency */
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```bash
feat(auth): add social login with Google OAuth
fix(events): resolve timezone display issue in event cards
docs(api): update endpoint documentation
test(user): add unit tests for profile service
chore(deps): update dependencies to latest versions
```

## Pull Request Process

### Before Creating a PR

1. **Sync with main**: Rebase your branch on the latest main
2. **Run tests**: Ensure all tests pass locally
3. **Run linting**: Fix any linting errors
4. **Update docs**: Update documentation if needed

### PR Checklist

- [ ] Branch is up to date with main
- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation updated (if applicable)
- [ ] Self-review completed
- [ ] Screenshots added (for UI changes)

### PR Guidelines

- **Use descriptive titles**: Clearly describe what the PR does
- **Reference issues**: Link to related issues using "Fixes #123"
- **Keep PRs focused**: One feature/fix per PR
- **Add tests**: Include tests for new functionality
- **Update docs**: Keep documentation in sync

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues**: Check if the issue already exists
2. **Use latest version**: Ensure you're using the latest version
3. **Provide context**: Include relevant details and reproduction steps

### Issue Types

- **Bug Report**: Use the bug report template
- **Feature Request**: Use the feature request template
- **Documentation**: For documentation improvements
- **Question**: For questions about usage or implementation

## Testing

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Web tests
cd web && npm test

# Mobile tests
cd mobile && npm test

# All tests
npm run test
```

### Test Guidelines

- **Write tests for new features**: All new functionality should have tests
- **Update tests for changes**: Modify existing tests when changing functionality
- **Use descriptive test names**: Make test purposes clear
- **Test edge cases**: Consider boundary conditions and error cases

### Test Structure

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID provided', async () => {
      // Test implementation
    });
    
    it('should throw error when user not found', async () => {
      // Test implementation
    });
  });
});
```

## Documentation

### Code Documentation

- **Add JSDoc comments**: Document public functions and classes
- **Explain business logic**: Comment complex algorithms and business rules
- **Keep comments current**: Update comments when code changes

### README Updates

- Update feature lists when adding new functionality
- Add new environment variables to setup instructions
- Update API documentation for new endpoints

## Release Process

Releases are handled by maintainers:

1. **Version bump**: Update package.json versions
2. **Changelog**: Update CHANGELOG.md
3. **Tag release**: Create git tag
4. **Deploy**: Deploy to production environments

## Questions and Support

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: [support@concertconnect.com] for private inquiries

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Annual contributor appreciation

Thank you for contributing to Concert Connect! 🎵