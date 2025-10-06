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
                <div className="border-t border-pink-200"></div>
              </div>
            );
          }

          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left
                ${isActive 
                  ? 'bg-pink-100 text-pink-700 border-pink-200' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              {Icon && <Icon className="w-5 h-5 mr-3" />}
              {section.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}






