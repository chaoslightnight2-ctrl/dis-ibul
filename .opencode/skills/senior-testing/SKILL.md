---
name: senior-testing
description: Use when writing tests, debugging test failures, or asked about testing strategies. Triggers on: "write tests", "unit test", "integration test", "e2e", "test coverage", "test failure", "vitest", "playwright".
---

# Senior Testing Guide

## Test Pyramid Priority
1. **Unit tests** (fast, isolated) — 70% of test suite
2. **Integration tests** (service boundaries) — 20%
3. **E2E tests** (critical user paths) — 10%

## What to Test
- **Business logic**: domain rules, validations, state transitions
- **Error paths**: what happens when DB fails, API returns 500, auth expires
- **Edge cases**: empty arrays, null values, max length, special characters
- **Contract**: API request/response shapes match expected schemas
- **Regression**: every bug fix gets a test that reproduces the bug

## Testing Patterns
- Arrange-Act-Assert (AAA): clear setup, action, verification sections
- Mock external services at boundaries, not internally
- Use factories/builders for test data (not real DB in unit tests)
- Test behavior, not implementation details (avoid testing private methods)
- Each test should verify ONE behavior/concept

## Framework-Specific (Vitest)
```ts
// Unit test pattern
describe('ServiceName.methodName', () => {
  it('should return expected result when condition', async () => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Framework-Specific (Playwright)
```ts
// E2E test pattern
test('user can complete booking flow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Book' }).click()
  await expect(page.locator('.success')).toBeVisible()
})
```

## Coverage Goals
- Lines: 80%+
- Branches: 75%+
- Critical paths: 100% (auth, payments, data mutations)
- Never chase 100% line coverage at expense of meaningful tests

## Test Quality Signs
- **Good**: tests fail when behavior changes, pass when refactoring internals
- **Bad**: brittle tests (fail on trivial changes), slow tests, flaky tests
- **Fix flaky tests**: add `waitFor`, proper cleanup, deterministic data, retry logic
