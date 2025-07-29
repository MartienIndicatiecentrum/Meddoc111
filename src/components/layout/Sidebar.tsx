import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Folder, Calendar, Users, ClipboardList, Settings, UserCheck, Bell, Bot, Upload, MessageCircle, Receipt, CheckSquare, FileText, FileSpreadsheet, BarChart3, BookOpen } from 'lucide-react';
import { useTotalDocumentCount } from '../../hooks/useTotalDocumentCount';

const navItems = [
  { label: 'Dashboard', icon: Home, to: '/' },
  { label: 'Cliënten', icon: Users, to: '/clienten' },
  { label: 'Documenten', icon: Folder, to: '/documenten' },
  { label: 'Virtual AI Assistant', icon: Bot, to: 'https://anam-cara.vercel.app/', external: true },
  { label: 'Document Upload', icon: Upload, to: '/document-upload' },
  { label: 'AI Chat', icon: MessageCircle, to: '/ai-chat' },
  { label: 'Planning', icon: Calendar, to: '/planning' },
  { label: 'Kalender', icon: Calendar, to: '/kalender' },
  { label: 'Medewerkers', icon: UserCheck, to: '/medewerkers' },
  { label: 'Taken', icon: ClipboardList, to: '/taken' },
  { label: 'Lopende zaken', icon: BarChart3, to: '/lopende-zaken' },
  { label: 'Logboek', icon: BookOpen, to: '/logboek' },
  { label: 'Taken verzekeraar', icon: FileText, to: '/taken-verzekeraar' },
  { label: 'Factuur', icon: Receipt, to: '/factuur' },
  { label: 'Factuur Generator', icon: FileSpreadsheet, to: '/factuur-generator' },
  { label: 'Email Reminders', icon: Bell, to: '/admin/email-reminders' },
  { label: 'Instellingen', icon: Settings, to: '/instellingen' },
];

const Sidebar: React.FC = () => {
  const { documentCount, loading: documentCountLoading } = useTotalDocumentCount();

  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 font-bold text-primary-600 text-xl">
        <span className="mr-2">🩺</span> MedDoc Pro
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map(item => {
          if (item.external) {
            return (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary-50 transition-colors text-gray-700 hover:text-primary-700"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            );
          }

          // Special handling for Documenten to show count
          if (item.label === 'Documenten') {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded hover:bg-primary-50 transition-colors ${isActive ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-700'}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {documentCountLoading ? (
                  <div className="ml-auto w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold border border-blue-600">
                    {documentCount}
                  </span>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded hover:bg-primary-50 transition-colors ${isActive ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-700'}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
