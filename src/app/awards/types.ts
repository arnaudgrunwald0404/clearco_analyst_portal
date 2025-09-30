export interface Award {
  id: string
  name: string | null
  link?: string | null
  organization: string | null
  productTopics?: string[] | string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  submissionDate: string | null
  publicationDate: string | null
  owner?: string | null
  status: 'EVALUATING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'WINNER' | 'FINALIST' | 'NOT_SELECTED' | 'WITHDRAWN'
  cost?: string | null
  notes?: string | null
  createdAt: string | null
  updatedAt: string | null
}
