import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import ProjectListPage from './pages/ProjectListPage';
import ProjectForm from './pages/ProjectForm';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import ProjectSummaryPage from './pages/ProjectSummaryPage';
import ProjectModulePage from './pages/ProjectModulePage';
import TaskBoardPage from './pages/TaskBoardPage';
import AuthRequired from './components/AuthRequired';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/profile" element={<AuthRequired><Profile /></AuthRequired>} />
              <Route path="/dashboard" element={<AuthRequired><Dashboard /></AuthRequired>} />
              <Route path="/dashboard/create" element={<AuthRequired><ProjectListPage /></AuthRequired>} />
              <Route path="/dashboard/create/new" element={<AuthRequired><ProjectForm /></AuthRequired>} />
              <Route path="/dashboard/create/edit/:projectId" element={<AuthRequired><ProjectForm /></AuthRequired>} />
              <Route 
                path="/dashboard/projects/:projectId" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectDashboardPage />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/summary" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectSummaryPage />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/brainstorming" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Brainstorming Module" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/roadmap" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Roadmapping Module" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/knowledge" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Knowledge Base Module" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/delivery" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Delivery Module" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/delivery/kanban/new" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Create Kanban Board" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/delivery/sprint/new" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Create Sprint Board" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/delivery/kanban/:boardId" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Kanban Board" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/delivery/sprint/:boardId" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Sprint Board" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/delivery/kanban/:boardId/edit" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Edit Kanban Board" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/backlog" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <ProjectModulePage moduleTitle="Backlog Module" />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
              <Route 
                path="/dashboard/projects/:projectId/board" 
                element={
                  <AuthRequired>
                    <DashboardLayout>
                      <TaskBoardPage />
                    </DashboardLayout>
                  </AuthRequired>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;