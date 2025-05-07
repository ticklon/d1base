# Development Guidelines

This document outlines the guidelines for contributing to the d1base project.

## Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/d1base.git
   cd d1base
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

## Project Structure

This project uses a monorepo structure:

```
/packages/
  └── d1base/          # Main library
      ├── src/
      │   ├── client.ts     # DbClient definition & getDbClient function
      │   ├── builder.ts    # QueryBuilder class (main chain processing)
      │   ├── sql.ts        # SQL syntax construction utilities
      │   ├── types.ts      # Table structure, query types & relation definitions
      │   └── index.ts      # Exports
      └── __tests__/        # Test code
```

## Development Workflow

1. Create a branch for a new feature or bug fix:
   ```bash
   git checkout -b feature/feature-name
   ```

2. Make code changes and add tests.

3. Run tests to ensure all tests pass:
   ```bash
   npm test
   ```

4. Run lint and format:
   ```bash
   npm run lint
   npm run format
   ```

5. Commit and push changes:
   ```bash
   git commit -m "Description of the feature"
   git push origin feature/feature-name
   ```

6. Create a pull request.

## Coding Standards

- Provide accurate TypeScript type definitions and avoid using `any`.
- Add appropriate JSDoc comments to functions and classes.
- Maintain high test coverage.
- Use meaningful names for variables, functions, and classes.
- Add comments to complex logic.

## Testing

Run tests with the following command:

```bash
npm test
```

Test files should be placed in the `__tests__` directory with a `.test.ts` extension.

## Building

Build the project with the following command:

```bash
npm run build
```

Build output will be in the `packages/d1base/dist` directory.

## Future Development Plans

- Introduction of `.upsert()`, `.count()`, `.transaction()`
- Prisma-like type generation mechanism
- Automatic type generation via CLI
- D1 Emulator integration in the test environment
