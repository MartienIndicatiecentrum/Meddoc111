import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, fullHeight = false }) => (
  <div className="min-h-screen flex bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Header />
      <main className={fullHeight ? "flex-1 flex flex-col" : "flex-1 p-4 overflow-y-auto"}>{children}</main>
    </div>
  </div>
);

export default AppLayout;
