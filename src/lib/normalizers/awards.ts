import type { Award } from '@/app/awards/types'

export function normalizeAwardRow(row: any): Award {
  return {
    id: row.id,
    name: row.awardName ?? row.name ?? null,
    link: row.link ?? null,
    organization: row.contactInfo ?? row.organization ?? null,
    productTopics: Array.isArray(row.topics)
      ? row.topics
      : (typeof row.topics === 'string' ? row.topics.split(',').map((t: string) => t.trim()).filter(Boolean) : (row.productTopics ?? null)),
    priority: row.priority ?? 'MEDIUM',
    submissionDate: row.processStartDate ?? row.submissionDate ?? null,
    publicationDate: row.publicationDate ?? null,
    owner: row.owner ?? null,
    status: row.status ?? 'EVALUATING',
    cost: row.cost ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  }
}
