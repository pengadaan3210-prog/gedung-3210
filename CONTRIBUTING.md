# Contributing to Gedung 3210

Terima kasih telah tertarik untuk berkontribusi pada Gedung 3210! Panduan ini menjelaskan cara berkontribusi dengan cara yang terbaik.

## 📋 Daftar Isi

- [Code of Conduct](#code-of-conduct)
- [Tipe Kontribusi](#tipe-kontribusi)
- [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)
- [Commit Messages](#commit-messages)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)

## 🤝 Code of Conduct

Proyek ini berkomitmen untuk memberikan pengalaman yang ramah bagi semua orang. Kami mengharapkan semua kontributor untuk:

- Bersikap sopan dan hormat kepada kontributor lain
- Menerima kritik konstruktif dengan baik hati
- Fokus pada apa yang terbaik untuk komunitas
- Menunjukkan empati kepada pengguna lain

## 🎯 Tipe Kontribusi

### Bug Reports
Jika Anda menemukan bug, silakan buat GitHub Issue dengan:
- Judul yang deskriptif
- Langkah reproduksi yang jelas
- Screenshot atau video jika relevan
- Environment info (OS, Browser, Node version)

### Feature Requests
Untuk fitur baru:
- Jelaskan use case
- Berikan contoh / mock-up
- Jelaskan mengapa Anda merasa ini diperlukan

### Code Improvements
- Refactoring
- Performance improvements
- Documentation
- Test coverage

## 🔄 Pull Request Process

### 1. Fork Repository

```bash
git remote add upstream https://github.com/pengadaan3210-prog/gedung-3210.git
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming convention:
- `feature/` - Fitur baru
- `fix/` - Bug fix
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `perf/` - Performance improvement
- `test/` - Test coverage

### 3. Make Your Changes

- Lakukan perubahan yang fokus dan kecil
- Update tests sesuai kebutuhan
- Update dokumentasi jika perlu

### 4. Commit Your Changes

```bash
git commit -m "feat: add new feature"
```

Lihat [Commit Messages](#commit-messages) section.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

Template PR:
```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #(issue number)

## How Has This Been Tested?
Describe testing procedure

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

## 🛠️ Development Setup

### 1. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/gedung-3210.git
cd gedung-3210
```

### 2. Add Upstream Remote

```bash
git remote add upstream https://github.com/pengadaan3210-prog/gedung-3210.git
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create `.env` File

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Keep Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

## 📝 Commit Messages

Kami mengikuti Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Test changes
- **chore**: Dependencies, build config, etc

### Examples

```bash
git commit -m "feat(dashboard): add progress chart visualization"
git commit -m "fix(auth): resolve logout button issue"
git commit -m "docs: update installation instructions"
git commit -m "refactor(components): simplify button component logic"
```

## 🎨 Style Guidelines

### TypeScript/React

1. **Naming Conventions**
   ```typescript
   // Components - PascalCase
   const MyComponent = () => { ... }
   
   // Functions - camelCase
   const fetchUserData = () => { ... }
   
   // Constants - UPPER_SNAKE_CASE
   const MAX_RETRIES = 3
   
   // Types - PascalCase
   interface UserData { ... }
   type Status = 'loading' | 'success' | 'error'
   ```

2. **Component Structure**
   ```typescript
   // Imports - organized and grouped
   import React from 'react'
   import { API } from '@/services'
   import { Button } from '@/components/ui'
   
   // Types
   interface Props { ... }
   type Status = 'loading' | 'error'
   
   // Component
   const MyComponent = ({ prop1, prop2 }: Props) => { ... }
   
   // Exports
   export default MyComponent
   ```

3. **Props & Types**
   ```typescript
   // Always type your props
   interface CardProps {
     title: string
     description?: string
     onClick?: (id: string) => void
   }
   ```

4. **Comments**
   ```typescript
   // Use for complex logic
   const calculateProgressPercentage = (current: number, total: number) => {
     // Ensure total is not zero to avoid division by zero
     if (total === 0) return 0
     return Math.round((current / total) * 100)
   }
   ```

### CSS/Tailwind

1. Gunakan Tailwind utility classes
2. Hindari CSS custom yang tidak perlu
3. Organize classes: layout > sizing > spacing > styling

```tsx
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  ...
</div>
```

### Formatting

- Use ESLint: `npm run lint`
- 2 spaces indentation
- Semicolons required
- Single quotes for strings

## 🧪 Testing

### Run Tests

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
```

### Writing Tests

1. Test critical functionality
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('calculateProgress', () => {
  it('should calculate correct percentage', () => {
    // Arrange
    const current = 50
    const total = 100
    
    // Act
    const result = calculateProgress(current, total)
    
    // Assert
    expect(result).toBe(50)
  })
})
```

### Test Coverage

- Aim for >80% coverage on critical components
- Focus on behavior, not implementation details
- Test error cases and edge cases

## 📋 Checklist Sebelum Submit PR

- [ ] Code follows style guidelines
- [ ] Related issues linked
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No new warnings from linter
- [ ] Commits have clear messages
- [ ] Branch is up to date with main

## ❓ Questions?

Jika Anda memiliki pertanyaan:

1. Check existing [GitHub Issues](https://github.com/pengadaan3210-prog/gedung-3210/issues)
2. Email: pengadaan3210@gmail.com
3. Buat Discussion di GitHub

---

**Thank you for contributing! 🎉**
