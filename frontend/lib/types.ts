/**
 * TypeScript types for API requests and responses.
 * These match the Pydantic schemas in the backend.
 */

export enum CountryCode {
	DE = "DE",
	FR = "FR",
	IT = "IT",
	ES = "ES",
	NL = "NL",
	BE = "BE",
	AT = "AT",
	PL = "PL",
	SE = "SE",
	NO = "NO",
}

export const COUNTRY_NAMES: Record<CountryCode, string> = {
	[CountryCode.DE]: "Germany",
	[CountryCode.FR]: "France",
	[CountryCode.IT]: "Italy",
	[CountryCode.ES]: "Spain",
	[CountryCode.NL]: "Netherlands",
	[CountryCode.BE]: "Belgium",
	[CountryCode.AT]: "Austria",
	[CountryCode.PL]: "Poland",
	[CountryCode.SE]: "Sweden",
	[CountryCode.NO]: "Norway",
};

// Request Types
export interface DataIngestionRequest {
	country_code: CountryCode;
	start_date: string; // ISO 8601 format
	end_date: string; // ISO 8601 format
	num_households: number;
}

// Response Types
export interface ConsumptionStatistics {
	mean_consumption: number;
	median_consumption: number;
	std_deviation: number;
	min_consumption: number;
	max_consumption: number;
	total_consumption: number;
}

export interface DateRange {
	start: string;
	end: string;
	total_hours: number;
}

export interface DataIngestionResponse {
	status: string;
	message: string;
	total_records: number;
	unique_households: number;
	country: string;
	date_range: DateRange;
	statistics: ConsumptionStatistics;
	ingestion_time_seconds: number;
}

export interface DataSummaryResponse {
	total_records: number;
	unique_households: number;
	countries: string[];
	date_range: DateRange | null;
	statistics: ConsumptionStatistics | null;
}

export interface HealthCheckResponse {
	status: string;
	timestamp: string;
	database: string;
	version: string;
}

export interface ErrorResponse {
	error_code: string;
	message: string;
	details?: Record<string, unknown>;
}

export enum StrategyType {
	FLAT = "flat",
	TOU = "tou",
	DYNAMIC = "dynamic",
}

export interface StrategyInfo {
	strategy_type: StrategyType;
	name: string;
	description: string;
}

export interface TOUParameters {
	peak_hours: number[];
	peak_multiplier: number;
	offpeak_multiplier: number;
}

export interface DynamicParameters {
	min_multiplier: number;
	max_multiplier: number;
}

export interface StrategyExecutionRequest {
	strategy_type: StrategyType;
	cost_recovery_target?: number;
	country?: string;
	tou_params?: TOUParameters;
	dynamic_params?: DynamicParameters;
}

export interface PricePoint {
	timestamp: string;
	price_per_kwh: number;
}

export interface HouseholdCost {
	household_id: number;
	total_cost: number;
	total_consumption: number;
	avg_cost_per_kwh: number;
}

export interface FairnessMetrics {
	gini_coefficient: number;
	coefficient_of_variation: number;
	min_cost_per_kwh: number;
	max_cost_per_kwh: number;
	mean_cost_per_kwh: number;
	median_cost_per_kwh: number;
	std_cost_per_kwh: number;
}

export interface StrategyExecutionResponse {
	strategy_type: StrategyType;
	strategy_name: string;
	total_revenue: number;
	cost_recovery_target: number;
	cost_recovery_percentage: number;
	total_consumption: number;
	avg_price_per_kwh: number;
	fairness_metrics: FairnessMetrics;
	price_curve: PricePoint[];
	household_costs: HouseholdCost[];
	execution_time_seconds: number;
}

export interface OptimizationRequest {
	fairness_weight: number;
	profit_weight: number;
	mode?: OptimizationMode; // NEW
	min_cost_recovery_pct?: number; // NEW
	max_cost_recovery_pct?: number; // NEW
	cost_recovery_target?: number;
	min_price?: number;
	max_price?: number;
	solver_timeout?: number;
	country?: string;
}

export interface OptimizationResponse {
	id: number;
	fairness_weight: number;
	profit_weight: number;
	solver_status: string;
	solver_runtime_seconds: number;
	objective_value: number;
	total_revenue: number;
	cost_recovery_target: number;
	cost_recovery_percentage: number;
	total_consumption: number;
	avg_price_per_kwh: number;
	fairness_metrics: FairnessMetrics;
	price_curve: PricePoint[];
	household_costs: HouseholdCost[];
	optimization_details: {
		mean_price: number;
		price_std: number;
		price_min: number;
		price_max: number;
		fairness_weight_used: number;
		profit_weight_used: number;
		mode?: string; // NEW
		min_cost_recovery_pct?: number; // NEW
		max_cost_recovery_pct?: number; // NEW
		revenue_shortfall?: number; // NEW
		revenue_excess?: number; // NEW
	};
	created_at: string;
}

export interface OptimizationPreset {
	name: string;
	description: string;
	fairness_weight: number;
	profit_weight: number;
}

export enum OptimizationMode {
	REGULATED = "regulated",
	MARKET = "market",
}
