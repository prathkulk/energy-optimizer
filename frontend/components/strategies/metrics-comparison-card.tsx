"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { StrategyExecutionResponse } from "../../lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsComparisonCardProps {
	results: StrategyExecutionResponse;
}

export function MetricsComparisonCard({ results }: MetricsComparisonCardProps) {
	const metrics = [
		{
			label: "Cost Recovery",
			value: `${results.cost_recovery_percentage.toFixed(1)}%`,
			target: 100,
			current: results.cost_recovery_percentage,
			unit: "%",
			good:
				results.cost_recovery_percentage >= 98 &&
				results.cost_recovery_percentage <= 102,
		},
		{
			label: "Fairness (Gini)",
			value: results.fairness_metrics.gini_coefficient.toFixed(4),
			target: 0,
			current: results.fairness_metrics.gini_coefficient,
			unit: "",
			good: results.fairness_metrics.gini_coefficient < 0.15,
		},
		{
			label: "Price Range",
			value: `€${(
				results.fairness_metrics.max_cost_per_kwh -
				results.fairness_metrics.min_cost_per_kwh
			).toFixed(4)}`,
			target: 0,
			current:
				results.fairness_metrics.max_cost_per_kwh -
				results.fairness_metrics.min_cost_per_kwh,
			unit: "/kWh",
			good:
				results.fairness_metrics.max_cost_per_kwh -
					results.fairness_metrics.min_cost_per_kwh <
				0.05,
		},
		{
			label: "Avg Price",
			value: `€${results.avg_price_per_kwh.toFixed(4)}`,
			target: 0.25,
			current: results.avg_price_per_kwh,
			unit: "/kWh",
			good:
				results.avg_price_per_kwh >= 0.2 &&
				results.avg_price_per_kwh <= 0.3,
		},
	];

	const getTrendIcon = (
		current: number,
		target: number,
		lowerIsBetter: boolean = false
	) => {
		const diff = Math.abs(current - target);
		if (diff < 0.01) return <Minus className="h-4 w-4 text-gray-500" />;

		if (lowerIsBetter) {
			return current < target ? (
				<TrendingDown className="h-4 w-4 text-green-600" />
			) : (
				<TrendingUp className="h-4 w-4 text-red-600" />
			);
		} else {
			return current > target ? (
				<TrendingUp className="h-4 w-4 text-green-600" />
			) : (
				<TrendingDown className="h-4 w-4 text-red-600" />
			);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Metrics Overview</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{metrics.map((metric, idx) => (
						<div
							key={idx}
							className={`p-4 rounded-lg border-2 ${
								metric.good
									? "border-green-200 bg-green-50"
									: "border-yellow-200 bg-yellow-50"
							}`}
						>
							<div className="flex items-start justify-between mb-2">
								<p className="text-xs font-medium text-gray-600">
									{metric.label}
								</p>
								{getTrendIcon(
									metric.current,
									metric.target,
									idx === 1 || idx === 2
								)}
							</div>
							<p className="text-xl font-bold">{metric.value}</p>
							<Badge
								className={`mt-2 text-xs ${
									metric.good
										? "bg-green-600"
										: "bg-yellow-600"
								}`}
							>
								{metric.good ? "Good" : "Acceptable"}
							</Badge>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
