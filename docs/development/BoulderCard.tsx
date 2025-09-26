import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RoadmapEpic } from '@/hooks/useAhaEpics';
import { Badge } from '@/components/ui/badge';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useUpdateEpic } from '@/hooks/useUpdateEpic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PencilIcon, SaveIcon, XIcon, Trash2 } from 'lucide-react';
import { getMappedStatus } from '@/utils/statusMapping';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Placeholder for image, replace with actual image logic later
const getEpicImage = (epic: RoadmapEpic): string | null => {
  // TODO: Implement actual image retrieval logic.
  // This might involve checking epic.customFields for an image URL
  const imageField = epic.customFields?.find(cf => cf.name === 'boulder_image_url');
  if (imageField && typeof imageField.value === 'string' && imageField.value.trim() !== '') {
    return imageField.value;
  }

  // Or use a placeholder if no image is found
  console.log("Boulder image URL for epic " + epic.name + " not found, using placeholder.")
  return 'https/placehold.co/600x400/EEE/31343C?text=Boulder'; // Default placeholder
};

// Function to get status variant (can be reused or adapted from EpicsGrid if needed)
const getStatusVariant = (status?: string): "default" | "destructive" | "outline" | "secondary" | "success" | "info" | "warning" | "gray" | "purple" => {
  if (!status) return 'outline';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('shipped') || statusLower.includes('completed') || statusLower.includes('done') || statusLower.includes('released') || statusLower.includes('live')) return 'success';
  if (statusLower.includes('in progress') || statusLower.includes('in development') || statusLower.includes('active') || statusLower.includes('building') || statusLower.includes('implementing')) return 'info';
  if (statusLower.includes('planned') || statusLower.includes('future') || statusLower.includes('backlog') || statusLower.includes('ready') || statusLower.includes('queued')) return 'warning';
  if (statusLower.includes('hold') || statusLower.includes('paused') || statusLower.includes('blocked') || statusLower.includes('cancelled') || statusLower.includes('suspended')) return 'gray';
  if (statusLower.includes('discovery') || statusLower.includes('research') || statusLower.includes('investigation') || statusLower.includes('concept') || statusLower.includes('ideation')) return 'purple';
  return 'outline';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Module color helpers from PivotTable
const getModuleGradientColor = (module: string): string => {
  let hash = 0;
  for (let i = 0; i < module.length; i++) {
    const char = module.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 40 + (Math.abs(hash) % 30);
  const lightness = 85 + (Math.abs(hash) % 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getModuleBorderColor = (hsl: string): string => {
  const match = hsl.match(/hsl\((\d+), (\d+)%?, (\d+)%?\)/);
  if (!match) return hsl;
  const [_, hue, sat, light] = match;
  const newLight = Math.max(0, parseInt(light) - 15);
  const newSat = Math.min(100, parseInt(sat) + 10);
  return `hsl(${hue}, ${newSat}%, ${newLight}%)`;
};

interface BoulderCardProps {
  epic: RoadmapEpic;
  onClick?: (epic: RoadmapEpic) => void; // Optional click handler
}

export const BoulderCard: React.FC<BoulderCardProps> = ({ epic, onClick }) => {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsSuperAdmin();
  const { mutate: updateEpic } = useUpdateEpic();

  const imageUrl = getEpicImage(epic);
  const hasFile = !!epic.boulder_file_url;
  const hasCpoText = !!epic.cpo_take;

  // Card sizing logic
  let cardClasses = "m-2 flex-shrink-0 w-[250px] h-auto shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden";
  if (!hasCpoText && !hasFile) {
    cardClasses += " min-h-[120px]";
  }

  return (
    <Card
      className={cardClasses}
      onClick={() => onClick?.(epic)}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-base font-semibold leading-tight line-clamp-2 min-h-[3.15rem]" title={epic.alternate_name || epic.name}>
          {epic.alternate_name || epic.name || 'Untitled Boulder'}
        </CardTitle>
        {epic.devRoadmap && (
          <div className="mt-0.5 mb-0.5">
            <span
              className="inline-block text-[0.67rem] font-semibold px-1.5 py-0.5 border"
              style={{
                borderRadius: '6px',
                background: getModuleGradientColor(String(epic.devRoadmap)),
                borderColor: getModuleBorderColor(getModuleGradientColor(String(epic.devRoadmap))),
                color: '#222',
              }}
            >
              {String(epic.devRoadmap)}
            </span>
          </div>
        )}
        {epic.release && (
          <CardDescription className="text-[0.67rem] text-gray-500 mt-0.5">
            {epic.release} {epic.releaseDate ? `(${formatDate(epic.releaseDate)})` : ''}
          </CardDescription>
        )}
        {epic.status && (
          <div className="mt-0.5">
            <Badge
              className={["text-[0.67rem] px-1.5 py-0.5 rounded-full font-semibold",
                [
                  "released to cohort 1",
                  "complete/done (ga)",
                  "released to gtm team",
                  "released to internal orgs"
                ].includes(epic.status.trim().toLowerCase())
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800"
              ].join(' ')}
            >
              {getMappedStatus(epic.status)}
            </Badge>
          </div>
        )}
      </CardHeader>

      {/* File Section - only if there is a file */}
      {hasFile && (
        <div className="h-[120px] bg-gray-200 flex items-center justify-center overflow-hidden relative cursor-pointer">
          <div className="relative w-full h-full">
            {epic.boulder_file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={epic.boulder_file_url} alt={epic.name || 'Illustration'} className="w-full h-full object-cover" style={{ fontSize: '90%' }} />
            ) : epic.boulder_file_url.match(/\.(mp4)$/i) ? (
              <video src={epic.boulder_file_url} controls className="w-full h-full object-cover" style={{ fontSize: '90%' }} />
            ) : epic.boulder_file_url.match(/\.(ppt|pptx)$/i) ? (
              <a href={epic.boulder_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Presentation</a>
            ) : null}
          </div>
        </div>
      )}

      {/* CPO's Take Section */}
      {hasCpoText && (
        <div className={`p-3 pt-2 border-t border-gray-100 flex-1 ${!hasFile ? 'pb-4' : ''}`}>
          <div className="text-xs font-medium text-gray-700 mb-1">CPO's Take</div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="text-xs text-gray-600 leading-relaxed cursor-pointer overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: hasFile ? 3 : 8,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxHeight: hasFile ? '4.5rem' : '12rem'
                  }}
                >
                  {epic.cpo_take}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs whitespace-pre-line break-words">
                {epic.cpo_take}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </Card>
  );
};
