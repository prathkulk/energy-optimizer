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
import { StrategyExecutionResponse } from "@/lib/types";
import {
	CheckCircle2,
	TrendingUp,
	Users,
	DollarSign,
	Scale,
} from "lucide-react";
import { PriceCurveChart } from "./price-curve-chart";
import { HouseholdDistributionChart } from "./household-distribution-chart";
import { FairnessComparisonChart } from "./fairness-comparison-chart";
import { MetricsComparisonCard } from "./metrics-comparison-card";

interface StrategyResultsProps {
	results: StrategyExecutionResponse;
}

export function StrategyResults({ results }: StrategyResultsProps) {
	const getFairnessRating = (
		gini: number
	): { label: string; color: string } => {
		if (gini < 0.1) return { label: "Excellent", color: "text-green-600" };
		if (gini < 0.2) return { label: "Good", color: "text-blue-600" };
		if (gini < 0.3) return { label: "Fair", color: "text-yellow-600" };
		return { label: "Poor", color: "text-red-600" };
	};

	const getRecoveryStatus = (
		percentage: number
	): { label: string; color: string } => {
		if (percentage >= 98 && percentage <= 102)
			return { label: "On Target", color: "bg-green-100 text-green-800" };
		if (percentage >= 95 && percentage <= 105)
			return { label: "Close", color: "bg-blue-100 text-blue-800" };
		return { label: "Off Target", color: "bg-red-100 text-red-800" };
	};

	const fairnessRating = getFairnessRating(
		results.fairness_metrics.gini_coefficient
	);
	const recoveryStatus = getRecoveryStatus(results.cost_recovery_percentage);

	return (
		<div className="space-y-6">
			{/* Success Message */}
			<Alert className="border-green-200 bg-green-50">
				<CheckCircle2 className="h-4 w-4 text-green-600" />
				<AlertTitle className="text-green-900">
					Strategy Executed Successfully!
				</AlertTitle>
				<AlertDescription className="text-green-700">
					{results.strategy_name} pricing calculated in{" "}
					{results.execution_time_seconds}s
				</AlertDescription>
			</Alert>

			{/* Quick Metrics */}
			<MetricsComparisonCard results={results} />

			{/* Tabs for different views */}
			<Tabs defaultValue="charts" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="charts">📈 Charts</TabsTrigger>
					<TabsTrigger value="metrics">
						📊 Detailed Metrics
					</TabsTrigger>
					<TabsTrigger value="households">🏠 Households</TabsTrigger>
				</TabsList>

				{/* Charts Tab */}
				<TabsContent value="charts" className="space-y-6">
					{/* Price Curve Chart */}
					<PriceCurveChart
						priceData={results.price_curve}
						strategyName={results.strategy_name}
					/>

					{/* Household Distribution Chart */}
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

					{/* Fairness Radar Chart */}
					<FairnessComparisonChart
						fairnessMetrics={results.fairness_metrics}
						strategyName={results.strategy_name}
					/>
				</TabsContent>

				{/* Detailed Metrics Tab */}
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
								<Badge
									className={`mt-2 ${recoveryStatus.color}`}
								>
									{recoveryStatus.label}
								</Badge>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription>Cost Recovery</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-blue-600" />
									<span className="text-2xl font-bold">
										{results.cost_recovery_percentage.toFixed(
											1
										)}
										%
									</span>
								</div>
								<p className="text-sm text-gray-600 mt-2">
									Target: €
									{results.cost_recovery_target.toLocaleString(
										undefined,
										{ maximumFractionDigits: 0 }
									)}
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
								<Badge
									className={`mt-2 ${fairnessRating.color}`}
								>
									{fairnessRating.label}
								</Badge>
							</CardContent>
						</Card>
					</div>

					{/* Detailed Fairness Metrics */}
					<Card>
						<CardHeader>
							<CardTitle>Fairness Analysis</CardTitle>
							<CardDescription>
								Distribution of costs across households
							</CardDescription>
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
									<p className="text-xs text-gray-500 mt-1">
										Lower is fairer (0 = perfect equality)
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600 mb-1">
										Coefficient of Variation
									</p>
									<p className="text-xl font-semibold">
										{results.fairness_metrics.coefficient_of_variation.toFixed(
											4
										)}
									</p>
									<p className="text-xs text-gray-500 mt-1">
										Measures relative variability
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

							{/* Fairness Interpretation */}
							<div className="mt-6 p-4 bg-gray-50 rounded-lg">
								<p className="text-sm font-medium text-gray-700 mb-2">
									📊 Interpretation:
								</p>
								<p className="text-sm text-gray-600">
									{results.fairness_metrics.gini_coefficient <
										0.1 &&
										"This strategy provides excellent fairness with very uniform costs across all households."}
									{results.fairness_metrics
										.gini_coefficient >= 0.1 &&
										results.fairness_metrics
											.gini_coefficient < 0.2 &&
										"This strategy provides good fairness with reasonable cost distribution across households."}
									{results.fairness_metrics
										.gini_coefficient >= 0.2 &&
										results.fairness_metrics
											.gini_coefficient < 0.3 &&
										"This strategy shows moderate inequality. Some households pay notably more than others."}
									{results.fairness_metrics
										.gini_coefficient >= 0.3 &&
										"This strategy shows significant inequality. Consider adjusting parameters to improve fairness."}
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Households Tab */}
				<TabsContent value="households" className="space-y-6">
					{results.household_costs.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Household Cost Breakdown</CardTitle>
								<CardDescription>
									Detailed cost analysis for individual
									households
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Top 5 Most Expensive */}
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
														<div>
															<span className="text-sm font-medium">
																Household #
																{
																	household.household_id
																}
															</span>
															<p className="text-xs text-gray-600 mt-1">
																Consumption:{" "}
																{household.total_consumption.toFixed(
																	1
																)}{" "}
																kWh
															</p>
														</div>
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

									{/* Bottom 5 Least Expensive */}
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
															<div>
																<span className="text-sm font-medium">
																	Household #
																	{
																		household.household_id
																	}
																</span>
																<p className="text-xs text-gray-600 mt-1">
																	Consumption:{" "}
																	{household.total_consumption.toFixed(
																		1
																	)}{" "}
																	kWh
																</p>
															</div>
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

									{/* All Households Table */}
									<div className="mt-6">
										<p className="text-sm font-medium text-gray-700 mb-3">
											📋 All Households
										</p>
										<div className="border rounded-lg overflow-hidden">
											<div className="max-h-96 overflow-y-auto">
												<table className="w-full text-sm">
													<thead className="bg-gray-50 sticky top-0">
														<tr>
															<th className="px-4 py-2 text-left font-medium text-gray-700">
																Household ID
															</th>
															<th className="px-4 py-2 text-right font-medium text-gray-700">
																Consumption
																(kWh)
															</th>
															<th className="px-4 py-2 text-right font-medium text-gray-700">
																Total Cost (€)
															</th>
															<th className="px-4 py-2 text-right font-medium text-gray-700">
																Avg Cost (€/kWh)
															</th>
														</tr>
													</thead>
													<tbody>
														{results.household_costs.map(
															(
																household,
																idx
															) => (
																<tr
																	key={
																		household.household_id
																	}
																	className={
																		idx %
																			2 ===
																		0
																			? "bg-white"
																			: "bg-gray-50"
																	}
																>
																	<td className="px-4 py-2 font-medium">
																		#
																		{
																			household.household_id
																		}
																	</td>
																	<td className="px-4 py-2 text-right">
																		{household.total_consumption.toFixed(
																			1
																		)}
																	</td>
																	<td className="px-4 py-2 text-right">
																		€
																		{household.total_cost.toFixed(
																			2
																		)}
																	</td>
																	<td className="px-4 py-2 text-right font-semibold">
																		€
																		{household.avg_cost_per_kwh.toFixed(
																			4
																		)}
																	</td>
																</tr>
															)
														)}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
