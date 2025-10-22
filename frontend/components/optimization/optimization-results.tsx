"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptimizationResponse } from "@/lib/types";
import {
	CheckCircle2,
	AlertTriangle,
	Clock,
	TrendingUp,
	Users,
	DollarSign,
	Scale,
} from "lucide-react";
import { PriceCurveChart } from "../strategies/price-curve-chart";
import { HouseholdDistributionChart } from "../strategies/household-distribution-chart";
import { FairnessComparisonChart } from "../strategies/fairness-comparison-chart";
import { MetricsComparisonCard } from "../strategies/metrics-comparison-card";

interface OptimizationResultsProps {
	results: OptimizationResponse;
}

export function OptimizationResults({ results }: OptimizationResultsProps) {
	const getSolverStatusBadge = () => {
		if (results.solver_status === "Optimal") {
			return <Badge className="bg-green-600">✓ Optimal Solution</Badge>;
		} else if (results.solver_status.includes("Feasible")) {
			return <Badge className="bg-blue-600">~ Feasible Solution</Badge>;
		} else {
			return (
				<Badge variant="destructive">⚠ {results.solver_status}</Badge>
			);
		}
	};

	// Convert to StrategyExecutionResponse format for reusing components
	const strategyFormatted = {
		strategy_type: "optimized" as any,
		strategy_name: "MILP Optimized",
		total_revenue: results.total_revenue,
		cost_recovery_target: results.cost_recovery_target,
		cost_recovery_percentage: results.cost_recovery_percentage,
		total_consumption: results.total_consumption,
		avg_price_per_kwh: results.avg_price_per_kwh,
		fairness_metrics: results.fairness_metrics,
		price_curve: results.price_curve,
		household_costs: results.household_costs,
		execution_time_seconds: results.solver_runtime_seconds,
	};

	return (
		<div className="space-y-6">
			{/* Success Message */}
			<Alert className="border-green-200 bg-green-50">
				<CheckCircle2 className="h-4 w-4 text-green-600" />
				<AlertTitle className="text-green-900">
					Optimization Completed!
				</AlertTitle>
				<AlertDescription className="text-green-700">
					MILP solver found solution in{" "}
					{results.solver_runtime_seconds}s{getSolverStatusBadge()}
				</AlertDescription>
			</Alert>
			{/* Optimization Summary */}
			<Card>
				<CardHeader>
					<CardTitle>Optimization Summary</CardTitle>
					<CardDescription>
						Configuration and solver details
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Fairness Weight
							</p>
							<p className="text-xl font-bold text-blue-600">
								{results.fairness_weight.toFixed(2)}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Profit Weight
							</p>
							<p className="text-xl font-bold text-green-600">
								{results.profit_weight.toFixed(2)}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Solver Status
							</p>
							<p className="text-xl font-bold">
								{results.solver_status}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Objective Value
							</p>
							<p className="text-xl font-bold text-purple-600">
								{results.objective_value.toFixed(4)}
							</p>
						</div>
					</div>

					<div className="mt-4 p-3 bg-gray-50 rounded-lg">
						<p className="text-sm text-gray-600">
							<Clock className="inline h-4 w-4 mr-1" />
							Solved in{" "}
							<strong>
								{results.solver_runtime_seconds}s
							</strong>{" "}
							using CBC (COIN-OR Branch and Cut) solver
						</p>
					</div>
				</CardContent>
			</Card>
			// Add this after the Optimization Summary card (around line 100):
			{/* Cost Recovery Analysis */}
			<Card>
				<CardHeader>
					<CardTitle>Cost Recovery Analysis</CardTitle>
					<CardDescription>
						Revenue vs. target with losses/profits breakdown
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Visual Progress Bar */}
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Target Revenue</span>
								<span className="font-semibold">
									€
									{results.cost_recovery_target.toLocaleString(
										undefined,
										{ maximumFractionDigits: 0 }
									)}
								</span>
							</div>

							<div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
								<div
									className={`h-full transition-all ${
										results.cost_recovery_percentage >= 100
											? "bg-gradient-to-r from-green-500 to-green-600"
											: "bg-gradient-to-r from-red-500 to-orange-500"
									}`}
									style={{
										width: `${Math.min(
											results.cost_recovery_percentage,
											100
										)}%`,
									}}
								/>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-sm font-bold text-white drop-shadow">
										{results.cost_recovery_percentage.toFixed(
											1
										)}
										%
									</span>
								</div>
							</div>
						</div>

						{/* Revenue Breakdown */}
						<div className="grid grid-cols-3 gap-4 mt-4">
							<div className="text-center p-3 bg-gray-50 rounded-lg">
								<p className="text-xs text-gray-600 mb-1">
									Actual Revenue
								</p>
								<p className="text-lg font-bold text-blue-600">
									€
									{results.total_revenue.toLocaleString(
										undefined,
										{ maximumFractionDigits: 0 }
									)}
								</p>
							</div>

							{results.optimization_details.revenue_shortfall &&
							results.optimization_details.revenue_shortfall >
								0 ? (
								<div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
									<p className="text-xs text-red-600 mb-1">
										💸 Loss (Shortfall)
									</p>
									<p className="text-lg font-bold text-red-600">
										-€
										{results.optimization_details.revenue_shortfall.toLocaleString(
											undefined,
											{ maximumFractionDigits: 0 }
										)}
									</p>
									<p className="text-xs text-red-500 mt-1">
										{(
											(results.optimization_details
												.revenue_shortfall /
												results.cost_recovery_target) *
											100
										).toFixed(1)}
										% under target
									</p>
								</div>
							) : results.optimization_details.revenue_excess &&
							  results.optimization_details.revenue_excess >
									0 ? (
								<div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
									<p className="text-xs text-green-600 mb-1">
										💰 Profit (Excess)
									</p>
									<p className="text-lg font-bold text-green-600">
										+€
										{results.optimization_details.revenue_excess.toLocaleString(
											undefined,
											{ maximumFractionDigits: 0 }
										)}
									</p>
									<p className="text-xs text-green-500 mt-1">
										{(
											(results.optimization_details
												.revenue_excess /
												results.cost_recovery_target) *
											100
										).toFixed(1)}
										% over target
									</p>
								</div>
							) : (
								<div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
									<p className="text-xs text-blue-600 mb-1">
										🎯 Perfect Balance
									</p>
									<p className="text-lg font-bold text-blue-600">
										€0
									</p>
									<p className="text-xs text-blue-500 mt-1">
										Exactly on target
									</p>
								</div>
							)}

							<div className="text-center p-3 bg-purple-50 rounded-lg">
								<p className="text-xs text-purple-600 mb-1">
									Recovery Rate
								</p>
								<p className="text-lg font-bold text-purple-600">
									{results.cost_recovery_percentage.toFixed(
										1
									)}
									%
								</p>
								<p className="text-xs text-purple-500 mt-1">
									{results.cost_recovery_percentage >= 100
										? "Above"
										: "Below"}{" "}
									target
								</p>
							</div>
						</div>

						{/* Mode Indicator */}
						{results.optimization_details.mode && (
							<div className="mt-4 p-3 bg-gray-50 rounded-lg border">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										Optimization Mode:
									</span>
									<span
										className={`text-sm font-bold ${
											results.optimization_details
												.mode === "regulated"
												? "text-blue-600"
												: "text-orange-600"
										}`}
									>
										{results.optimization_details.mode ===
										"regulated"
											? "🛡️ Regulated"
											: "📈 Market"}
									</span>
								</div>
								{results.optimization_details
									.min_cost_recovery_pct && (
									<p className="text-xs text-gray-600 mt-1">
										Allowed range:{" "}
										{
											results.optimization_details
												.min_cost_recovery_pct
										}
										% -{" "}
										{
											results.optimization_details
												.max_cost_recovery_pct
										}
										%
									</p>
								)}
							</div>
						)}

						{/* Interpretation */}
						<Alert
							className={
								results.cost_recovery_percentage < 95
									? "border-red-200 bg-red-50"
									: results.cost_recovery_percentage > 110
									? "border-green-200 bg-green-50"
									: "border-blue-200 bg-blue-50"
							}
						>
							<AlertTitle className="text-sm font-semibold">
								{results.cost_recovery_percentage < 95
									? "⚠️ Operating at Loss"
									: results.cost_recovery_percentage > 110
									? "✅ Strong Profitability"
									: "✓ Healthy Cost Recovery"}
							</AlertTitle>
							<AlertDescription className="text-xs mt-1">
								{results.cost_recovery_percentage < 95
									? "This pricing strategy results in losses. In market mode, this may be acceptable for competitive positioning or fairness goals."
									: results.cost_recovery_percentage > 110
									? "This pricing strategy generates significant profit above cost recovery. Ensure this aligns with your fairness and regulatory requirements."
									: "This pricing strategy recovers costs effectively while balancing fairness and profitability objectives."}
							</AlertDescription>
						</Alert>
					</div>
				</CardContent>
			</Card>
			{/* Reuse Strategy Results Components */}
			<MetricsComparisonCard results={strategyFormatted as any} />
			{/* Tabs for Charts and Details */}
			<Tabs defaultValue="charts" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="charts">📈 Charts</TabsTrigger>
					<TabsTrigger value="metrics">
						📊 Detailed Metrics
					</TabsTrigger>
					<TabsTrigger value="households">🏠 Households</TabsTrigger>
				</TabsList>

				<TabsContent value="charts" className="space-y-6">
					<PriceCurveChart
						priceData={results.price_curve}
						strategyName={`Optimized (F:${results.fairness_weight}/P:${results.profit_weight})`}
					/>

					{results.household_costs.length > 0 && (
						<HouseholdDistributionChart
							householdCosts={results.household_costs}
							meanCost={
								results.fairness_metrics.mean_cost_per_kwh
							}
							medianCost={
								results.fairness_metrics.median_cost_per_kwh
							}
						/>
					)}

					<FairnessComparisonChart
						fairnessMetrics={results.fairness_metrics}
						strategyName="MILP Optimized"
					/>
				</TabsContent>

				<TabsContent value="metrics" className="space-y-6">
					{/* Key Metrics Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardDescription>Total Revenue</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<DollarSign className="h-5 w-5 text-green-600" />
									<span className="text-2xl font-bold">
										€
										{results.total_revenue.toLocaleString(
											undefined,
											{ maximumFractionDigits: 0 }
										)}
									</span>
								</div>
								<p className="text-sm text-gray-600 mt-2">
									{results.cost_recovery_percentage.toFixed(
										1
									)}
									% of target
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription>Avg Price</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Scale className="h-5 w-5 text-purple-600" />
									<span className="text-2xl font-bold">
										€{results.avg_price_per_kwh.toFixed(4)}
									</span>
								</div>
								<p className="text-sm text-gray-600 mt-2">
									per kWh
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription>
									Fairness (Gini)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Users className="h-5 w-5 text-orange-600" />
									<span className="text-2xl font-bold">
										{results.fairness_metrics.gini_coefficient.toFixed(
											4
										)}
									</span>
								</div>
								<Badge className="mt-2">
									{results.fairness_metrics.gini_coefficient <
									0.1
										? "Excellent"
										: results.fairness_metrics
												.gini_coefficient < 0.2
										? "Good"
										: "Fair"}
								</Badge>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription>Price Range</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-blue-600" />
									<span className="text-2xl font-bold">
										€
										{(
											results.fairness_metrics
												.max_cost_per_kwh -
											results.fairness_metrics
												.min_cost_per_kwh
										).toFixed(4)}
									</span>
								</div>
								<p className="text-sm text-gray-600 mt-2">
									€
									{results.fairness_metrics.min_cost_per_kwh.toFixed(
										4
									)}{" "}
									- €
									{results.fairness_metrics.max_cost_per_kwh.toFixed(
										4
									)}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Detailed Fairness Metrics */}
					<Card>
						<CardHeader>
							<CardTitle>Fairness Analysis</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Gini Coefficient
									</p>
									<p className="text-xl font-semibold">
										{results.fairness_metrics.gini_coefficient.toFixed(
											4
										)}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Coeff. of Variation
									</p>
									<p className="text-xl font-semibold">
										{results.fairness_metrics.coefficient_of_variation.toFixed(
											4
										)}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Mean Cost
									</p>
									<p className="text-xl font-semibold">
										€
										{results.fairness_metrics.mean_cost_per_kwh.toFixed(
											4
										)}
										/kWh
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Median Cost
									</p>
									<p className="text-xl font-semibold">
										€
										{results.fairness_metrics.median_cost_per_kwh.toFixed(
											4
										)}
										/kWh
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Min Cost
									</p>
									<p className="text-xl font-semibold text-blue-600">
										€
										{results.fairness_metrics.min_cost_per_kwh.toFixed(
											4
										)}
										/kWh
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Max Cost
									</p>
									<p className="text-xl font-semibold text-red-600">
										€
										{results.fairness_metrics.max_cost_per_kwh.toFixed(
											4
										)}
										/kWh
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="households" className="space-y-6">
					{results.household_costs.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Household Cost Breakdown</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Top 5 */}
									<div>
										<p className="text-sm font-medium text-gray-700 mb-2">
											🔴 Highest Cost Households
										</p>
										<div className="space-y-2">
											{results.household_costs
												.slice(0, 5)
												.map((household) => (
													<div
														key={
															household.household_id
														}
														className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100"
													>
														<span className="text-sm font-medium">
															Household #
															{
																household.household_id
															}
														</span>
														<div className="text-right">
															<p className="text-sm font-semibold text-red-700">
																€
																{household.avg_cost_per_kwh.toFixed(
																	4
																)}
																/kWh
															</p>
															<p className="text-xs text-gray-600">
																Total: €
																{household.total_cost.toFixed(
																	2
																)}
															</p>
														</div>
													</div>
												))}
										</div>
									</div>

									{/* Bottom 5 */}
									{results.household_costs.length > 5 && (
										<div>
											<p className="text-sm font-medium text-gray-700 mb-2">
												🟢 Lowest Cost Households
											</p>
											<div className="space-y-2">
												{results.household_costs
													.slice(-5)
													.reverse()
													.map((household) => (
														<div
															key={
																household.household_id
															}
															className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100"
														>
															<span className="text-sm font-medium">
																Household #
																{
																	household.household_id
																}
															</span>
															<div className="text-right">
																<p className="text-sm font-semibold text-green-700">
																	€
																	{household.avg_cost_per_kwh.toFixed(
																		4
																	)}
																	/kWh
																</p>
																<p className="text-xs text-gray-600">
																	Total: €
																	{household.total_cost.toFixed(
																		2
																	)}
																</p>
															</div>
														</div>
													))}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
