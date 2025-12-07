# E2E Testing Guide

This project uses Playwright for end-to-end testing with full stack integration.

## Local Testing

### Option 1: Docker Compose (Recommended)

Run the entire stack with one command:

```bash
# Start all services and run tests
docker-compose -f docker-compose.test.yml up --build e2e-tests

# Or run services and tests separately
docker-compose -f docker-compose.test.yml up -d postgres backend dashboard
npm run test:e2e
```

### Option 2: Manual Setup

1. Start PostgreSQL:
```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=locust_data_test \
  postgres:15
```

2. Start backend (in backend directory):
```bash
cd ../locust-data-service
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/locust_data_test \
  uv run alembic upgrade head
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/locust_data_test \
  uv run fastapi dev app/main.py --port 8500
```

3. Run tests (in dashboard directory):
```bash
SKIP_WEBSERVER=1 \
BASE_URL=http://localhost:3000 \
NEXT_PUBLIC_API_URL=http://localhost:8500 \
npx playwright test
```

## CI/CD

E2E tests run automatically on:
- Push to `main` branch
- Pull requests to `main`

The GitHub Actions workflow:
1. Sets up PostgreSQL service
2. Checks out both frontend and backend repos
3. Runs database migrations
4. Starts backend API with health checks
5. Runs Playwright tests
6. Uploads test reports as artifacts

## Test Scripts

```bash
# Run tests headlessly
npm run test:e2e

# Run with UI mode (great for debugging)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

## Test Data

The E2E tests require seeded test data to run successfully. The backend includes a `seed_test_data.py` script that creates:

- **3 Test Runs**: Completed, Running, and Failed states
- **5 Stats Snapshots**: Performance metrics over time
- **10 Request Logs**: API request history
- **1 Failure Record**: Example failure tracking
- **3 Test Logs**: Application logs at different levels

The GitHub Actions workflow automatically seeds this data before running tests.

For local testing:
```bash
# From backend directory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/locust_data_test \
  uv run python seed_test_data.py
```

## Test Structure

```
e2e/
├── dashboard.spec.ts          # Dashboard homepage tests
├── test-runs.spec.ts          # Test runs list and filtering
└── test-run-details.spec.ts   # Individual test run details
```

## Writing Tests

### Health Check Pattern

Always wait for services to be ready:

```typescript
test.beforeAll(async () => {
  // Wait for backend to be ready
  const response = await fetch('http://localhost:8500/docs');
  expect(response.ok).toBeTruthy();
});
```

### Test Data Pattern

For predictable tests, seed test data:

```typescript
test.beforeEach(async ({ request }) => {
  // Create test data via API
  await request.post('http://localhost:8500/api/v1/test-runs', {
    data: { /* test data */ }
  });
});
```

## Troubleshooting

### Backend not starting
- Check database connection: `psql postgresql://postgres:postgres@localhost:5432/locust_data_test`
- Check backend logs: `docker-compose -f docker-compose.test.yml logs backend`

### Tests failing locally but passing in CI
- Ensure you're using the same Node/Python versions
- Check environment variables
- Use Docker Compose to match CI environment exactly

### Lock file errors
- Use `SKIP_WEBSERVER=1` when dev server is already running
- Kill existing Next.js processes: `lsof -ti:3000 | xargs kill -9`

## Best Practices

1. **Idempotent Tests**: Each test should be able to run independently
2. **Clean State**: Reset database between test suites if needed
3. **Realistic Data**: Use realistic test data that matches production
4. **Health Checks**: Always verify services are ready before running tests
5. **Parallel Execution**: Tests should not interfere with each other
