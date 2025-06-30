/**
 * Topic Consolidation Script
 * Maps similar, duplicate, and related topics to standardized terms
 */

export interface TopicMapping {
  [key: string]: string;
}

export const topicMappings: TopicMapping = {
  // HR Technology & Systems
  "ERP systems": "enterprise resource planning",
  "ERP": "enterprise resource planning", 
  "enterprise resource planning": "enterprise resource planning",
  "HRIS": "HR information systems",
  "HR information systems": "HR information systems",
  "HR systems": "HR information systems",
  "human resources information systems": "HR information systems",
  "HRMS": "HR management systems",
  "HR management systems": "HR management systems",
  "HCM": "human capital management",
  "human capital management": "human capital management",
  "human capital": "human capital management",
  "HCM systems": "human capital management",

  // Learning & Development
  "learning": "learning and development",
  "learning and development": "learning and development",
  "L&D": "learning and development",
  "training": "learning and development",
  "employee training": "learning and development",
  "corporate training": "learning and development",
  "professional development": "learning and development",
  "skill development": "learning and development",
  "LMS": "learning management systems",
  "learning management systems": "learning management systems",
  "e-learning": "learning management systems",
  "online learning": "learning management systems",

  // Talent Management
  "talent management": "talent management",
  "talent acquisition": "talent acquisition",
  "recruiting": "talent acquisition",
  "recruitment": "talent acquisition",
  "hiring": "talent acquisition",
  "talent sourcing": "talent acquisition",
  "performance management": "performance management",
  "performance review": "performance management",
  "performance evaluation": "performance management",
  "succession planning": "succession planning",
  "career development": "succession planning",
  "talent pipeline": "succession planning",

  // Leadership
  "leadership": "leadership",
  "leadership development": "leadership",
  "management development": "leadership",
  "executive development": "leadership",
  "leadership training": "leadership",

  // Employee Experience & Engagement
  "employee experience": "employee experience",
  "EX": "employee experience",
  "employee engagement": "employee engagement",
  "employee satisfaction": "employee engagement",
  "workplace culture": "organizational culture",
  "company culture": "organizational culture",
  "organizational culture": "organizational culture",
  "culture": "organizational culture",
  "employee retention": "employee retention",
  "retention": "employee retention",
  "employee wellbeing": "employee wellbeing",
  "workplace wellness": "employee wellbeing",
  "work-life balance": "employee wellbeing",

  // Compensation & Benefits
  "compensation": "compensation and benefits",
  "compensation and benefits": "compensation and benefits",
  "C&B": "compensation and benefits",
  "total rewards": "compensation and benefits",
  "benefits": "compensation and benefits",
  "payroll": "payroll",
  "salary management": "compensation and benefits",

  // Analytics & Data
  "people analytics": "people analytics",
  "HR analytics": "people analytics",
  "workforce analytics": "people analytics",
  "data analytics": "data analytics",
  "business intelligence": "business intelligence",
  "BI": "business intelligence",
  "reporting": "business intelligence",
  "dashboards": "business intelligence",

  // Technology & Digital
  "digital transformation": "digital transformation",
  "digitalization": "digital transformation",
  "digital": "digital transformation",
  "automation": "automation",
  "process automation": "automation",
  "RPA": "automation",
  "robotic process automation": "automation",
  "AI": "artificial intelligence",
  "artificial intelligence": "artificial intelligence",
  "machine learning": "artificial intelligence",
  "ML": "artificial intelligence",
  "cloud computing": "cloud technology",
  "cloud": "cloud technology",
  "SaaS": "cloud technology",
  "software as a service": "cloud technology",

  // Diversity & Inclusion
  "diversity and inclusion": "diversity and inclusion",
  "D&I": "diversity and inclusion",
  "DEI": "diversity and inclusion",
  "diversity, equity, and inclusion": "diversity and inclusion",
  "inclusion": "diversity and inclusion",
  "diversity": "diversity and inclusion",
  "equity": "diversity and inclusion",

  // Remote Work & Future of Work
  "remote work": "future of work",
  "hybrid work": "future of work",
  "flexible work": "future of work",
  "future of work": "future of work",
  "distributed workforce": "future of work",
  "virtual teams": "future of work",

  // Compliance & Legal
  "compliance": "compliance",
  "labor law": "compliance",
  "employment law": "compliance",
  "regulatory compliance": "compliance",
  "GDPR": "compliance",
  "data privacy": "compliance",

  // Change Management
  "change management": "change management",
  "organizational change": "change management",
  "transformation": "change management",
  "change": "change management",

  // Customer Experience (related)
  "customer experience": "customer experience",
  "CX": "customer experience",
  "user experience": "user experience",
  "UX": "user experience",

  // Business Strategy
  "strategy": "business strategy",
  "business strategy": "business strategy",
  "strategic planning": "business strategy",
  "organizational strategy": "business strategy",

  // Project Management
  "project management": "project management",
  "program management": "project management",
  "agile": "project management",
  "scrum": "project management",

  // Communication & Collaboration
  "communication": "communication",
  "internal communication": "communication",
  "collaboration": "collaboration",
  "teamwork": "collaboration",
  "team collaboration": "collaboration",

  // Innovation
  "innovation": "innovation",
  "innovation management": "innovation",
  "R&D": "innovation",
  "research and development": "innovation",

  // Quality & Operations
  "quality management": "quality management",
  "operations": "operations",
  "operational excellence": "operations",
  "process improvement": "operations",
  "continuous improvement": "operations",

  // Security
  "cybersecurity": "cybersecurity",
  "information security": "cybersecurity",
  "data security": "cybersecurity",
  "security": "cybersecurity",

  // Finance & Budgeting
  "finance": "finance",
  "financial management": "finance",
  "budgeting": "finance",
  "cost management": "finance",

  // Vendor Management
  "vendor management": "vendor management",
  "supplier management": "vendor management",
  "procurement": "vendor management",

  // Market Research
  "market research": "market research",
  "competitive intelligence": "market research",
  "industry analysis": "market research",
  "market analysis": "market research"
};

/**
 * Consolidates a list of topics by mapping similar terms to standardized ones
 * @param topics Array of topic strings to consolidate
 * @returns Array of consolidated topic strings with duplicates removed
 */
export function consolidateTopics(topics: string[]): string[] {
  if (!topics || topics.length === 0) return [];

  // Convert topics to lowercase for mapping, then map to consolidated terms
  const consolidated = topics.map(topic => {
    const normalizedTopic = topic.toLowerCase().trim();
    return topicMappings[normalizedTopic] || topic;
  });

  // Remove duplicates while preserving order
  const seen = new Set<string>();
  const unique = consolidated.filter(topic => {
    if (seen.has(topic.toLowerCase())) {
      return false;
    }
    seen.add(topic.toLowerCase());
    return true;
  });

  return unique;
}

/**
 * Gets consolidation suggestions for a given topic
 * @param topic The topic to get suggestions for
 * @returns The consolidated topic name or the original if no mapping exists
 */
export function getConsolidatedTopic(topic: string): string {
  const normalizedTopic = topic.toLowerCase().trim();
  return topicMappings[normalizedTopic] || topic;
}

/**
 * Finds all topics that would be consolidated into the same term
 * @param consolidatedTopic The consolidated topic to find variations for
 * @returns Array of all topic variations that map to this consolidated term
 */
export function getTopicVariations(consolidatedTopic: string): string[] {
  const variations: string[] = [];
  
  Object.entries(topicMappings).forEach(([original, consolidated]) => {
    if (consolidated.toLowerCase() === consolidatedTopic.toLowerCase()) {
      variations.push(original);
    }
  });

  return variations;
}

/**
 * Analyzes a list of topics and returns consolidation suggestions
 * @param topics Array of topics to analyze
 * @returns Object with consolidation suggestions and statistics
 */
export function analyzeTopicConsolidation(topics: string[]) {
  const originalCount = topics.length;
  const consolidated = consolidateTopics(topics);
  const consolidatedCount = consolidated.length;
  
  const suggestions: Array<{
    original: string[];
    consolidated: string;
  }> = [];

  // Group original topics by their consolidated form
  const groupedTopics = new Map<string, string[]>();
  
  topics.forEach(topic => {
    const consolidatedTopic = getConsolidatedTopic(topic);
    if (!groupedTopics.has(consolidatedTopic)) {
      groupedTopics.set(consolidatedTopic, []);
    }
    groupedTopics.get(consolidatedTopic)!.push(topic);
  });

  // Create suggestions for groups with multiple original topics
  groupedTopics.forEach((originalTopics, consolidatedTopic) => {
    if (originalTopics.length > 1) {
      suggestions.push({
        original: originalTopics,
        consolidated: consolidatedTopic
      });
    }
  });

  return {
    originalCount,
    consolidatedCount,
    reductionCount: originalCount - consolidatedCount,
    reductionPercentage: Math.round(((originalCount - consolidatedCount) / originalCount) * 100),
    consolidated,
    suggestions
  };
}

/**
 * Utility function to be used in forms when adding/editing analyst topics
 * Automatically consolidates topics as they're being entered
 */
export function useTopicConsolidation(topics: string[]): {
  consolidatedTopics: string[];
  hasChanges: boolean;
  suggestions: Array<{ original: string[]; consolidated: string }>;
} {
  const analysis = analyzeTopicConsolidation(topics);
  
  return {
    consolidatedTopics: analysis.consolidated,
    hasChanges: analysis.reductionCount > 0,
    suggestions: analysis.suggestions
  };
}

// Example usage:
// const topics = ["ERP systems", "learning", "leadership development", "human capital", "talent management", "L&D", "AI", "machine learning"];
// console.log(consolidateTopics(topics));
// console.log(analyzeTopicConsolidation(topics));
// 
// // In a form component:
// const { consolidatedTopics, hasChanges, suggestions } = useTopicConsolidation(formData.coveredTopics);
// if (hasChanges) {
//   // Show user the consolidation suggestions
//   setFormData({ ...formData, coveredTopics: consolidatedTopics });
// }
