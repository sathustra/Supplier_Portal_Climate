export type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
export type SystemBoundary = 'cradle_to_gate' | 'cradle_to_grave' | 'gate_to_gate'
export type Methodology = 'iso_14067' | 'ghg_product' | 'pact_pathfinder' | 'pef' | 'other'
export type AllocationMethod = 'mass' | 'economic' | 'energy' | 'system_expansion' | 'none'
export type SBTiStatus = 'none' | 'committed' | 'validated_near_term' | 'validated_net_zero'
export type AffectedScope = 'scope_1' | 'scope_2' | 'scope_3' | 'scope_1_2' | 'cross_cutting'
export type MeasureStatus = 'implemented' | 'in_progress' | 'planned' | 'under_review'
export type RelevanceToSupply = 'yes' | 'no' | 'partially'

export interface Supplier {
  id: string
  company_name: string
  country: string
  duns_number: string | null
  contact_name: string
  contact_email: string
  is_admin: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface SubmissionOut {
  id: string
  supplier_id: string
  reporting_year: number
  status: SubmissionStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewer_comment: string | null
  created_at: string
  updated_at: string | null
}

export interface SubmissionDetail extends SubmissionOut {
  pcf_count: number
  measures_count: number
  has_target: boolean
}

export interface AdminSubmissionDetail extends SubmissionDetail {
  supplier_company_name: string
  supplier_contact_email: string
  supplier_country: string
}

export interface PCFRecord {
  id: string
  submission_id: string
  supplier_id: string
  article_number: string
  product_name: string
  pcf_total: number
  functional_unit: string
  system_boundary: SystemBoundary
  methodology: Methodology
  primary_data_share: number | null
  biogenic_emissions: number | null
  raw_material_emissions: number | null
  production_energy_emissions: number | null
  upstream_transport_emissions: number | null
  packaging_emissions: number | null
  other_emissions: number | null
  recycled_content_share: number | null
  bio_based_share: number | null
  allocation_method: AllocationMethod | null
  calculation_year: number
  externally_verified: boolean
  verification_standard: string | null
  remarks: string | null
  created_at: string
  updated_at: string | null
  warnings: string[]
}

export interface PCFRecordCreate {
  article_number: string
  product_name: string
  pcf_total: number
  functional_unit: string
  system_boundary: SystemBoundary
  methodology: Methodology
  primary_data_share?: number | null
  biogenic_emissions?: number | null
  raw_material_emissions?: number | null
  production_energy_emissions?: number | null
  upstream_transport_emissions?: number | null
  packaging_emissions?: number | null
  other_emissions?: number | null
  recycled_content_share?: number | null
  bio_based_share?: number | null
  allocation_method?: AllocationMethod | null
  calculation_year: number
  externally_verified: boolean
  verification_standard?: string | null
  remarks?: string | null
}

export interface ReductionTarget {
  id: string
  submission_id: string
  supplier_id: string
  has_climate_target: boolean
  sbti_status: SBTiStatus
  base_year: number | null
  near_term_target_year: number | null
  scope_1_2_reduction_pct: number | null
  scope_3_reduction_pct: number | null
  net_zero_target_year: number | null
  net_zero_reduction_pct: number | null
  internal_carbon_price: number | null
  cdp_participation: boolean
  cdp_score: string | null
  created_at: string
  updated_at: string | null
}

export interface ReductionTargetUpsert {
  has_climate_target: boolean
  sbti_status: SBTiStatus
  base_year?: number | null
  near_term_target_year?: number | null
  scope_1_2_reduction_pct?: number | null
  scope_3_reduction_pct?: number | null
  net_zero_target_year?: number | null
  net_zero_reduction_pct?: number | null
  internal_carbon_price?: number | null
  cdp_participation: boolean
  cdp_score?: string | null
}

export interface ReductionMeasure {
  id: string
  submission_id: string
  supplier_id: string
  measure_name: string
  affected_scope: AffectedScope
  status: MeasureStatus
  implementation_year: number | null
  expected_savings_tco2e: number | null
  capex_eur: number | null
  relevant_to_our_supply: RelevanceToSupply
  remarks: string | null
  created_at: string
  updated_at: string | null
}

export interface ReductionMeasureCreate {
  measure_name: string
  affected_scope: AffectedScope
  status: MeasureStatus
  implementation_year?: number | null
  expected_savings_tco2e?: number | null
  capex_eur?: number | null
  relevant_to_our_supply: RelevanceToSupply
  remarks?: string | null
}
