import { z } from 'zod'

const CURRENT_YEAR = new Date().getFullYear()

const nullableFloat = z
  .union([z.number().min(0), z.nan(), z.null()])
  .optional()
  .transform((v) => (v === undefined || (typeof v === 'number' && isNaN(v)) ? null : v))
  .nullable()

const nullablePercent = z
  .union([z.number().min(0).max(100), z.nan(), z.null()])
  .optional()
  .transform((v) => (v === undefined || (typeof v === 'number' && isNaN(v)) ? null : v))
  .nullable()

const nullableYear = z
  .union([z.number().int().min(2020).max(CURRENT_YEAR + 30), z.nan(), z.null()])
  .optional()
  .transform((v) => (v === undefined || (typeof v === 'number' && isNaN(v)) ? null : v))
  .nullable()

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort erforderlich'),
})

export const registerSchema = z.object({
  company_name: z.string().min(1, 'Firmenname erforderlich'),
  country: z.string().min(1, 'Land erforderlich'),
  contact_name: z.string().min(1, 'Ansprechpartner erforderlich'),
  contact_email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
})

export const pcfRecordSchema = z.object({
  article_number: z.string().min(1, 'Artikelnummer erforderlich'),
  product_name: z.string().min(1, 'Produktname erforderlich'),
  pcf_total: z.number({ invalid_type_error: 'PCF gesamt erforderlich' }).min(0, 'PCF muss >= 0 sein'),
  functional_unit: z.string().min(1, 'Funktionelle Einheit erforderlich'),
  system_boundary: z.enum(['cradle_to_gate', 'cradle_to_grave', 'gate_to_gate']),
  methodology: z.enum(['iso_14067', 'ghg_product', 'pact_pathfinder', 'pef', 'other']),
  primary_data_share: nullablePercent,
  biogenic_emissions: nullableFloat,
  raw_material_emissions: nullableFloat,
  production_energy_emissions: nullableFloat,
  upstream_transport_emissions: nullableFloat,
  packaging_emissions: nullableFloat,
  other_emissions: nullableFloat,
  recycled_content_share: nullablePercent,
  bio_based_share: nullablePercent,
  allocation_method: z
    .enum(['mass', 'economic', 'energy', 'system_expansion', 'none'])
    .nullable()
    .optional(),
  calculation_year: z
    .number({ invalid_type_error: 'Berechnungsjahr erforderlich' })
    .int()
    .min(2020, 'Mindestens 2020')
    .max(CURRENT_YEAR, `Maximal ${CURRENT_YEAR}`),
  externally_verified: z.boolean().default(false),
  verification_standard: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
})

export const targetSchema = z.object({
  has_climate_target: z.boolean(),
  sbti_status: z.enum(['none', 'committed', 'validated_near_term', 'validated_net_zero']).default('none'),
  base_year: nullableYear,
  near_term_target_year: nullableYear,
  scope_1_2_reduction_pct: nullablePercent,
  scope_3_reduction_pct: nullablePercent,
  net_zero_target_year: nullableYear,
  net_zero_reduction_pct: nullablePercent,
  internal_carbon_price: nullableFloat,
  cdp_participation: z.boolean().default(false),
  cdp_score: z.string().nullable().optional(),
})

export const measureSchema = z.object({
  measure_name: z.string().min(1, 'Maßnahmenname erforderlich'),
  affected_scope: z.enum(['scope_1', 'scope_2', 'scope_3', 'scope_1_2', 'cross_cutting']),
  status: z.enum(['implemented', 'in_progress', 'planned', 'under_review']),
  implementation_year: nullableYear,
  expected_savings_tco2e: nullableFloat,
  capex_eur: nullableFloat,
  relevant_to_our_supply: z.enum(['yes', 'no', 'partially']).default('partially'),
  remarks: z.string().nullable().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type PCFRecordFormData = z.infer<typeof pcfRecordSchema>
export type TargetFormData = z.infer<typeof targetSchema>
export type MeasureFormData = z.infer<typeof measureSchema>
