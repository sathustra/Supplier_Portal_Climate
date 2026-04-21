import type {
  SubmissionStatus,
  SystemBoundary,
  Methodology,
  AllocationMethod,
  SBTiStatus,
  AffectedScope,
  MeasureStatus,
  RelevanceToSupply,
} from '@/types'

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: 'Entwurf',
  submitted: 'Eingereicht',
  under_review: 'In Prüfung',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
}

export const SYSTEM_BOUNDARY_LABELS: Record<SystemBoundary, string> = {
  cradle_to_gate: 'Cradle-to-Gate',
  cradle_to_grave: 'Cradle-to-Grave',
  gate_to_gate: 'Gate-to-Gate',
}

export const METHODOLOGY_LABELS: Record<Methodology, string> = {
  iso_14067: 'ISO 14067',
  ghg_product: 'GHG Protocol Product',
  pact_pathfinder: 'PACT Pathfinder',
  pef: 'PEF (EU)',
  other: 'Andere',
}

export const ALLOCATION_METHOD_LABELS: Record<AllocationMethod, string> = {
  mass: 'Masse',
  economic: 'Wirtschaftlich',
  energy: 'Energie',
  system_expansion: 'Systemerweiterung',
  none: 'Keine',
}

export const SBTI_STATUS_LABELS: Record<SBTiStatus, string> = {
  none: 'Kein SBTi',
  committed: 'Committed',
  validated_near_term: 'Validiert Near-Term',
  validated_net_zero: 'Validiert Net-Zero',
}

export const AFFECTED_SCOPE_LABELS: Record<AffectedScope, string> = {
  scope_1: 'Scope 1',
  scope_2: 'Scope 2',
  scope_3: 'Scope 3',
  scope_1_2: 'Scope 1+2',
  cross_cutting: 'Übergreifend',
}

export const MEASURE_STATUS_LABELS: Record<MeasureStatus, string> = {
  implemented: 'Umgesetzt',
  in_progress: 'In Umsetzung',
  planned: 'Geplant',
  under_review: 'In Prüfung',
}

export const RELEVANCE_LABELS: Record<RelevanceToSupply, string> = {
  yes: 'Ja',
  no: 'Nein',
  partially: 'Teilweise',
}

export const CURRENT_YEAR = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)
