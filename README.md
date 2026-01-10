# Agent Factory Console

Single pane of glass dashboard for multi-agent AI development - Project inventory, notifications feed, and run/task tracking.

## Features

- **Dashboard**: Overview of all projects, active runs, and recent notifications
- **Project Inventory**: Manage and monitor your multi-agent AI projects with filtering and search
- **Run & Task Tracking**: Monitor agent run executions with real-time progress tracking
- **Notifications Feed**: Stay updated with alerts, errors, and system events
- **Settings**: Configure preferences, API keys, and security options

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Layout.tsx
│   ├── PageHeader.tsx
│   ├── ProgressBar.tsx
│   └── Sidebar.tsx
├── data/           # Mock data for development
├── pages/          # Page components
│   ├── Dashboard.tsx
│   ├── Notifications.tsx
│   ├── Projects.tsx
│   ├── Runs.tsx
│   └── Settings.tsx
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component with routing
├── main.tsx        # App entry point
└── index.css       # Global styles with Tailwind
```

## License

MIT
