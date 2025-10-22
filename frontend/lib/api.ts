/**
 * API client for communicating with FastAPI backend.
 */

import axios, { AxiosError } from "axios";
import type {
	DataIngestionRequest,
	DataIngestionResponse,
	DataSummaryResponse,
	HealthCheckResponse,
	ErrorResponse,
	StrategyInfo,
	StrategyExecutionRequest,
	StrategyExecutionResponse,
	OptimizationRequest,
	OptimizationResponse,
	OptimizationPreset,
} from "./types";

// Base URL for API - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1_PREFIX = "/api/v1";

// Create axios instance with default config
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 60000, // 60 seconds (data ingestion can take time)
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => response,
	(error: AxiosError<ErrorResponse>) => {
		if (error.response?.data) {
			// Backend returned an error response
			throw new Error(error.response.data.message || "An error occurred");
		} else if (error.request) {
			// Request was made but no response received
			throw new Error(
				"No response from server. Please check your connection."
			);
		} else {
			// Something else happened
			throw new Error(error.message || "An unexpected error occurred");
		}
	}
);

// API Functions

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
	const response = await apiClient.get<HealthCheckResponse>(
		`${API_V1_PREFIX}/health`
	);
	return response.data;
}

/**
 * Ingest energy consumption data
 */
export async function ingestData(
	request: DataIngestionRequest
): Promise<DataIngestionResponse> {
	const response = await apiClient.post<DataIngestionResponse>(
		`${API_V1_PREFIX}/data/ingest`,
		request
	);
	return response.data;
}

/**
 * Get data summary
 */
export async function getDataSummary(
	country?: string
): Promise<DataSummaryResponse> {
	const params = country ? { country } : {};
	const response = await apiClient.get<DataSummaryResponse>(
		`${API_V1_PREFIX}/data/summary`,
		{ params }
	);
	return response.data;
}

/**
 * Clear all data (development only)
 */
export async function clearData(
	country?: string
): Promise<{ message: string }> {
	const params = country ? { country } : {};
	const response = await apiClient.delete<{ message: string }>(
		`${API_V1_PREFIX}/data/clear`,
		{ params }
	);
	return response.data;
}

/**
 * List all available pricing strategies
 */
export async function listStrategies(): Promise<StrategyInfo[]> {
	const response = await apiClient.get<StrategyInfo[]>(
		`${API_V1_PREFIX}/strategies`
	);
	return response.data;
}

/**
 * Execute a pricing strategy
 */
export async function executeStrategy(
	request: StrategyExecutionRequest
): Promise<StrategyExecutionResponse> {
	const response = await apiClient.post<StrategyExecutionResponse>(
		`${API_V1_PREFIX}/strategies/execute`,
		request
	);
	return response.data;
}

/**
 * Get optimization presets
 */
export async function getOptimizationPresets(): Promise<OptimizationPreset[]> {
	const response = await apiClient.get<OptimizationPreset[]>(
		`${API_V1_PREFIX}/optimization/presets`
	);
	return response.data;
}

/**
 * Run optimization
 */
export async function runOptimization(
	request: OptimizationRequest
): Promise<OptimizationResponse> {
	const response = await apiClient.post<OptimizationResponse>(
		`${API_V1_PREFIX}/optimization/run`,
		request
	);
	return response.data;
}

/**
 * Get optimization result by ID
 */
export async function getOptimizationResult(
	resultId: number
): Promise<OptimizationResponse> {
	const response = await apiClient.get<OptimizationResponse>(
		`${API_V1_PREFIX}/optimization/results/${resultId}`
	);
	return response.data;
}
