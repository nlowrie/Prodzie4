# Project Management System

A modern project management system built with React, Supabase, and Tailwind CSS.

## Core Features

### Project Management
- Project creation and configuration
- Team member management
- Real-time collaboration
- Project overview dashboard

### Delivery Module
- **Kanban Boards**
  - Customizable columns
  - Task management
  - Drag-and-drop interface
- **Sprint Boards**
  - Sprint planning
  - Capacity tracking
  - Burndown charts
- **Workflow Management**
  - Custom workflow creation
  - Status flow configuration
  - Board assignment

### Task Management
- Backlog management
- Task creation and editing
- Status tracking
- Priority levels
- Assignment capabilities

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** Supabase
- **Database:** PostgreSQL
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
project/
├── src/
│   ├── components/    # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── pages/        # Page components
│   └── types/        # TypeScript types
├── public/           # Static assets
└── supabase/        # Supabase configurations
    └── migrations/   # Database migrations
```