import React, { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { ProjectProvider } from '../lib/ProjectContext';
import { SidebarProvider } from '../lib/SidebarContext';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProjectProvider>
      <SidebarProvider>
        <div className="flex h-[calc(100vh-4rem)]">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProjectProvider>
  );
}