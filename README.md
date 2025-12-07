# Locust Data Dashboard

A modern, responsive dashboard for monitoring and analyzing Locust load testing results.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components built with Radix UI patterns
- **Charts**: Apache ECharts
- **State Management**: TanStack Query (React Query) + Zustand
- **Icons**: Lucide React

## Features

### Planned Features

- **Dashboard Home**: Overview of recent test runs and key metrics
- **Test Runs List**: Browse, filter, and search historical test runs
- **Test Run Details**: Comprehensive view of individual test runs with:
  - Time-series charts (RPS, response times, user count, failures)
  - Statistics table per endpoint
  - Failures breakdown
  - Request logs drill-down
- **Live Monitoring**: Real-time updates for active test runs
- **Comparison**: Side-by-side comparison of multiple test runs

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard home
│   ├── test-runs/         # Test runs pages
│   ├── live/              # Live monitoring
│   └── compare/           # Comparison feature
├── components/
│   ├── ui/                # Reusable UI components
│   ├── charts/            # Chart components
│   ├── layout/            # Layout components (Sidebar, etc.)
│   └── providers/         # React context providers
├── lib/
│   ├── api.ts             # API client for FastAPI backend
│   └── utils.ts           # Utility functions
└── types/
    └── api.ts             # TypeScript types for API models
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Running Locust Data Service API (see `../locust-data-service`)

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## API Integration

The dashboard connects to the Locust Data Service API at `/api/v1`:

- `GET /test-runs` - List test runs
- `GET /test-runs/{id}` - Get test run details
- `GET /stats?test_run_id={id}` - Get stats snapshots
- `GET /requests?test_run_id={id}` - Get request logs
- `GET /failures?test_run_id={id}` - Get failures
- `GET /requests/stats?test_run_id={id}` - Get aggregated stats

## Development Status

✅ Project setup complete
✅ Basic layout and navigation
✅ API client configured
⏳ Test runs list page (in progress)
⏳ Test run details page
⏳ Charts implementation
⏳ Live monitoring
⏳ Comparison feature

## License

MIT
