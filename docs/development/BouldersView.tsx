import React, { useState, useEffect } from 'react';
import { useAhaEpics, RoadmapEpic } from '@/hooks/useAhaEpics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { BoulderCard } from './BoulderCard';
import { EpicDetailDialog } from './EpicDetailDialog';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MultiSelect, Option } from '@/components/ui/multi-select';

// Function to get current quarter and year
const getCurrentQuarter = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month < 3) return `Q1 ${year}`;
  if (month < 6) return `Q2 ${year}`;
  if (month < 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
};

// Function to generate quarters (past and future)
const generateQuarters = (startDate: Date, pastCount: number, futureCount: number): string[] => {
  const quarters: string[] = [];
  let currentYear = startDate.getFullYear();
  let currentQuarterNum = Math.floor(startDate.getMonth() / 3) + 1;

  // Generate past quarters (going backwards)
  for (let i = pastCount; i > 0; i--) {
    let quarterNum = currentQuarterNum - i;
    let year = currentYear;
    
    if (quarterNum <= 0) {
      quarterNum += 4;
      year--;
    }
    
    quarters.push(`Q${quarterNum} ${year}`);
  }

  // Add current quarter
  quarters.push(`Q${currentQuarterNum} ${currentYear}`);

  // Generate future quarters (going forwards)
  for (let i = 1; i <= futureCount; i++) {
    let quarterNum = currentQuarterNum + i;
    let year = currentYear;
    
    if (quarterNum > 4) {
      quarterNum -= 4;
      year++;
    }
    
    quarters.push(`Q${quarterNum} ${year}`);
  }

  return quarters;
};

export const BouldersView: React.FC = () => {
  // TODO: Update to fetch all pages or implement proper pagination for Boulders
  const { data: epicData, isLoading, error } = useAhaEpics(1, 1000); // Fetching a large number for now
  const [boulderEpics, setBoulderEpics] = useState<RoadmapEpic[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // State for all boulder epics before module filtering
  const [allDesignatedBoulders, setAllDesignatedBoulders] = useState<RoadmapEpic[]>([]);
  // State for the actual list of modules derived from data
  const [availableModules, setAvailableModules] = useState<string[]>(['all']);

  // Generate quarters: 2 past quarters + current quarter + 3 future quarters (6 total)
  const displayQuarters = generateQuarters(new Date(), 2, 3);

  const [selectedEpic, setSelectedEpic] = useState<RoadmapEpic | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: isAdmin, isLoading: isAdminLoading } = useIsSuperAdmin();

  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Aliases for known modules
  const MODULE_ALIASES: Record<string, string> = {
    'Talent Acquisition': 'TA',
    'Onboarding/Emp Events': 'ONB',
    'Talent Development': 'TD',
    'Reporting & Analytics': 'R&A',
    'Integration': 'INT',
    'Platform': 'PLAT',
    'LMS': 'LMS',
    'Compensation Management': 'CM',
  };

  // Build module options for MultiSelect
  const moduleOptions: Option[] = availableModules
    .filter(module => module.toLowerCase() !== 'all')
    .map(module => ({
      value: module,
      label: module,
      alias: MODULE_ALIASES[module] || undefined,
    }));

  useEffect(() => {
    if (epicData?.epics) {
      const designatedBoulders = epicData.epics.filter(epic => {
        // NEW LOGIC:
        return epic.is_boulder === true && epic.releaseDate;
      });
      setAllDesignatedBoulders(designatedBoulders);

      // Dynamically generate available modules from these designated boulders
      const modules = Array.from(new Set(designatedBoulders.map(epic => epic.devRoadmap).filter(Boolean as any as (value: string | null | undefined) => value is string)));
      // Could add sorting logic here if needed, e.g., modules.sort();
      setAvailableModules(['all', ...modules.sort()]);
    }
  }, [epicData]); // Runs when epicData changes

  useEffect(() => {
    let filtered = allDesignatedBoulders;
    if (selectedModules.length > 0) {
      filtered = filtered.filter(epic => selectedModules.includes(epic.devRoadmap));
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(epic =>
        (epic.alternate_name || epic.name || '').toLowerCase().includes(q) ||
        (epic.description || '').toLowerCase().includes(q)
      );
    }
    setBoulderEpics(filtered);
  }, [selectedModules, allDesignatedBoulders, searchQuery]);

  const getEpicsForQuarter = (quarterString: string): RoadmapEpic[] => {
    return boulderEpics
      .filter(epic => {
      if (!epic.releaseDate) return false;
      const releaseDate = new Date(epic.releaseDate);
      const epicQuarter = getCurrentQuarter(releaseDate);
      return epicQuarter === quarterString;
      })
      .sort((a, b) => {
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-2 text-gray-600">Loading Boulders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading Boulders: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        "Boulders" in the Past 2, Current, and Next 3 Quarters
      </h2>
      <div className="text-sm text-gray-900 mb-4 hidden md:block">
        The full roadmap can be daunting, it comprises back-end platform modernization items and other small enhancements which will not speak to everyone looking at the Timeline view or the List view. Therefore, we have created this boulders view (born from the vernacular from product management vernacular that describes a roadmap as a combination of boulders, rocks, and sand) which will be a collection of items of particular significance for our customers' delight and/or for our strategic direction.
      </div>
      <div className="flex flex-row items-end gap-8 mt-2 mb-4 w-full">
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="boulders-search" className="text-sm font-medium text-gray-700 whitespace-nowrap">Search</label>
          <div className="relative w-[286px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="boulders-search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
              type="text"
            />
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="boulder-module-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Module/R&D Pod:
          </label>
          <MultiSelect
            options={moduleOptions}
            selected={selectedModules}
            onChange={setSelectedModules}
            placeholder="All modules"
            className="w-[286px]"
          />
        </div>
      </div>
      {displayQuarters.map(quarter => {
        const epicsInQuarter = getEpicsForQuarter(quarter);
        if (epicsInQuarter.length === 0) {
          // Optionally, render something if no epics for a quarter, or skip
          // return null;
          return (
            <div key={quarter} className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">{quarter}</h3>
              <p className="text-gray-500">No boulders scheduled for this quarter.</p>
            </div>
          );
        }
        return (
          <div key={quarter} className="mb-8">
            <h3 className="text-xl font-bold text-gray-700 mb-3">{quarter}</h3>
            <div className="boulder-quarter-row flex overflow-x-auto pb-4 -mb-4 pr-4">
              <div className="flex flex-col md:flex-row flex-nowrap pl-1 gap-4">
                {epicsInQuarter.map(epic => (
                  <BoulderCard key={epic.id} epic={epic} onClick={() => { setSelectedEpic(epic); setIsDialogOpen(true); }} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {boulderEpics.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No Boulders to display.</p>
          <p className="text-gray-400 text-sm mt-2">
            Ensure epics are designated as 'Boulders' and have release dates.
          </p>
        </div>
      )}

      <EpicDetailDialog
        epic={selectedEpic}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        isAdmin={isAdmin}
      />
    </div>
  );
};
