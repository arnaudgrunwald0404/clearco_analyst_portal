import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BoulderEpic } from '@/hooks/useBoulders'
import { Clock, Users, AlertTriangle, CheckCircle, Circle, PlayCircle, PauseCircle } from 'lucide-react'

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch (e) {
    return 'Invalid Date'
  }
}

// Module color helpers (same as original)
const getModuleGradientColor = (module: string): string => {
  let hash = 0
  for (let i = 0; i < module.length; i++) {
    const char = module.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hue = Math.abs(hash) % 360
  const saturation = 40 + (Math.abs(hash) % 30)
  const lightness = 85 + (Math.abs(hash) % 10)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

const getModuleBorderColor = (hsl: string): string => {
  const match = hsl.match(/hsl\((\d+), (\d+)%?, (\d+)%?\)/)
  if (!match) return hsl
  const [_, hue, sat, light] = match
  const newLight = Math.max(0, parseInt(light) - 15)
  const newSat = Math.min(100, parseInt(sat) + 10)
  return `hsl(${hue}, ${newSat}%, ${newLight}%)`
}

// Priority color helpers
const getPriorityColor = (priority?: string): string => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Status icon helpers
const getStatusIcon = (status?: string, statusComplete?: boolean) => {
  if (statusComplete || status?.toLowerCase().includes('complete') || status?.toLowerCase().includes('done')) {
    return <CheckCircle className="w-3 h-3 text-green-600" />
  }
  
  switch (status?.toLowerCase()) {
    case 'in progress':
      return <PlayCircle className="w-3 h-3 text-blue-600" />
    case 'planning':
      return <Circle className="w-3 h-3 text-yellow-600" />
    case 'design':
      return <PauseCircle className="w-3 h-3 text-purple-600" />
    case 'research':
      return <AlertTriangle className="w-3 h-3 text-orange-600" />
    default:
      return <Circle className="w-3 h-3 text-gray-400" />
  }
}

interface SimpleBoulderCardProps {
  epic: BoulderEpic
  onClick?: (epic: BoulderEpic) => void
}

export const SimpleBoulderCard: React.FC<SimpleBoulderCardProps> = ({ epic, onClick }) => {
  const hasFile = !!epic.boulder_file_url
  const hasCpoText = !!epic.cpo_take

  // Card sizing logic with enhanced styling
  let cardClasses = "m-2 flex-shrink-0 w-[280px] h-auto shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border-0 hover:scale-[1.02] cursor-pointer"
  if (!hasCpoText && !hasFile) {
    cardClasses += " min-h-[140px]"
  }
  
  // Add priority border styling
  if (epic.priority === 'Critical') {
    cardClasses += " ring-2 ring-red-200 hover:ring-red-300"
  } else if (epic.priority === 'High') {
    cardClasses += " ring-1 ring-orange-200 hover:ring-orange-300"
  }

  return (
    <Card
      className={cardClasses}
      onClick={() => onClick?.(epic)}
    >
      <CardHeader className="p-4">
        {/* Priority and Status Row */}
        <div className="flex items-center justify-between mb-2">
          {epic.priority && (
            <Badge className={`text-[0.6rem] px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(epic.priority)}`}>
              {epic.priority}
            </Badge>
          )}
          {epic.status && (
            <div className="flex items-center gap-1">
              {getStatusIcon(epic.status, epic.statusComplete)}
              <span className="text-[0.6rem] text-gray-600 font-medium">
                {epic.status}
              </span>
            </div>
          )}
        </div>

        <CardTitle className="text-base font-semibold leading-tight line-clamp-2 min-h-[2.5rem] mb-2" title={epic.alternate_name || epic.name}>
          {epic.alternate_name || epic.name || 'Untitled Boulder'}
        </CardTitle>
        
        {epic.description && (
          <CardDescription className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {epic.description}
          </CardDescription>
        )}

        {/* Module and Release Info */}
        <div className="flex flex-wrap gap-2 mb-2">
          {epic.devRoadmap && (
            <span
              className="inline-block text-[0.6rem] font-semibold px-2 py-1 border rounded-md"
              style={{
                background: getModuleGradientColor(String(epic.devRoadmap)),
                borderColor: getModuleBorderColor(getModuleGradientColor(String(epic.devRoadmap))),
                color: '#222',
              }}
            >
              {String(epic.devRoadmap)}
            </span>
          )}
          {epic.release && (
            <Badge variant="outline" className="text-[0.6rem] px-2 py-1">
              {epic.release}
            </Badge>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-[0.6rem] text-gray-500">
          {epic.effort && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{epic.effort}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Estimated effort</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {epic.team_size && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{epic.team_size}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Team size</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {epic.releaseDate && (
            <span className="text-[0.6rem]">
              {formatDate(epic.releaseDate)}
            </span>
          )}
        </div>
      </CardHeader>

      {/* File Section - only if there is a file */}
      {hasFile && (
        <div className="h-[140px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative cursor-pointer group">
          <div className="relative w-full h-full">
            {epic.boulder_file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img 
                src={epic.boulder_file_url} 
                alt={epic.name || 'Illustration'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            ) : epic.boulder_file_url?.match(/\.(mp4)$/i) ? (
              <video 
                src={epic.boulder_file_url} 
                controls 
                className="w-full h-full object-cover" 
              />
            ) : epic.boulder_file_url?.match(/\.(ppt|pptx)$/i) ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
                <a 
                  href={epic.boulder_file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors"
                >
                  📊 View Presentation
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
                <a 
                  href={epic.boulder_file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-gray-800 underline text-sm font-medium transition-colors"
                >
                  📎 View File
                </a>
              </div>
            )}
            {/* Overlay for better text visibility */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
          </div>
        </div>
      )}

      {/* CPO's Take Section */}
      {hasCpoText && (
        <div className={`p-4 pt-3 border-t border-gray-100 flex-1 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 ${!hasFile ? 'pb-4' : ''}`}>
          <div className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
            💭 CPO's Take
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="text-xs text-gray-700 leading-relaxed cursor-pointer overflow-hidden font-medium"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: hasFile ? 3 : 6,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxHeight: hasFile ? '4.5rem' : '9rem'
                  }}
                >
                  "{epic.cpo_take}"
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm whitespace-pre-line break-words p-3 bg-blue-900 text-white">
                <div className="font-semibold mb-1">CPO's Take:</div>
                <div>"{epic.cpo_take}"</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Dependencies Section - if available */}
      {epic.dependencies && epic.dependencies.length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Dependencies</div>
          <div className="flex flex-wrap gap-1">
            {epic.dependencies.slice(0, 2).map((dep, index) => (
              <Badge key={index} variant="outline" className="text-[0.55rem] px-1.5 py-0.5 bg-yellow-50 text-yellow-800 border-yellow-200">
                {dep}
              </Badge>
            ))}
            {epic.dependencies.length > 2 && (
              <Badge variant="outline" className="text-[0.55rem] px-1.5 py-0.5 bg-gray-50 text-gray-600">
                +{epic.dependencies.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}


