import React from 'react';

interface MenuSection {
  id: string;
  label: string;
  icon: React.ElementType | null;
  isSeparator?: boolean;
}

interface SidebarNavProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  menuSections: MenuSection[];
}

export default function SidebarNav({ activeSection, setActiveSection, menuSections }: SidebarNavProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <nav className="space-y-2">
        {menuSections.map((section) => {
          // Handle separators
          if (section.isSeparator) {
            return (
              <div key={section.id} className="py-2">
                <div className="border-t border-gray-200"></div>
              </div>
            );
          }

          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              {section.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
} 