# Project Management System - Technical Summary

## Architecture

### Frontend
- React + TypeScript SPA
- Tailwind CSS for styling
- Vite for development and building
- Context API for state management
- React Router for navigation

### Backend
- Supabase
- PostgreSQL database
- Real-time subscriptions
- Row Level Security (RLS)

## Database Schema

### Core Tables
- `projects`: Project information
- `project_members`: Team membership
- `workflows`: Custom workflows
- `workflow_board_assignments`: Workflow-board relationships
- `tasks`: Backlog items and tasks

## Security Features
- Row Level Security (RLS)
- Role-based access control
- Secure authentication flow
- Protected API endpoints

## Core Modules

### Project Management
- Project creation and configuration
- Team member management
- Project overview dashboard
- Real-time collaboration support

### Delivery Module
- Kanban boards with customizable columns
- Sprint boards with capacity tracking
- Workflow management system
- Board assignment capabilities

### Task Management
- Backlog management
- Task creation and editing
- Status tracking
- Priority management
- Team member assignments