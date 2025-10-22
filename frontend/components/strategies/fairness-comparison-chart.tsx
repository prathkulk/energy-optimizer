"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { FairnessMetrics } from "../../lib/types";
import {
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar,
	ResponsiveContainer,
	Legend,
	Tooltip,
	TooltipProps,
} from "recharts";

interface FairnessComparisonChartProps {
	fairnessMetrics: FairnessMetrics;
	strategyName: string;
}

export function FairnessComparisonChart({
	fairnessMetrics,
	strategyName,
}: FairnessComparisonChartProps) {
	// Normalize metrics to 0-100 scale for radar chart
	// Lower is better for Gini and CV, so we invert them
	const normalizeInverted = (value: number, max: number) => {
		return ((max - value) / max) * 100;
	};

	const normalize = (value: number, min: number, max: number) => {
		return ((value - min) / (max - min)) * 100;
	};

	const chartData = [
		{
			metric: "Fairness (Gini)",
			score: normalizeInverted(fairnessMetrics.gini_coefficient, 1.0),
			fullMark: 100,
		},
		{
			metric: "Consistency (CV)",
			score: normalizeInverted(
				fairnessMetrics.coefficient_of_variation,
				2.0
			),
			fullMark: 100,
		},
		{
			metric: "Price Stability",
			score: normalizeInverted(
				fairnessMetrics.std_cost_per_kwh /
					fairnessMetrics.mean_cost_per_kwh,
				0.5
			),
			fullMark: 100,
		},
		{
			metric: "Affordability",
			score: normalizeInverted(fairnessMetrics.mean_cost_per_kwh, 0.5),
			fullMark: 100,
		},
		{
			metric: "Equity Range",
			score: normalizeInverted(
				fairnessMetrics.max_cost_per_kwh -
					fairnessMetrics.min_cost_per_kwh,
				0.2
			),
			fullMark: 100,
		},
	];

	interface CustomTooltipProps {
		active?: boolean;
		payload?: Array<{
			payload: {
				metric: string;
				score: number;
				fullMark: number;
			};
			value: number;
		}>;
	}

	const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-white p-3 border rounded-lg shadow-lg">
					<p className="text-sm font-medium">
						{payload[0].payload.metric}
					</p>
					<p className="text-sm text-blue-600 font-semibold">
						Score: {payload[0].value.toFixed(1)}/100
					</p>
				</div>
			);
		}
		return null;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Fairness Profile</CardTitle>
				<CardDescription>
					Multi-dimensional fairness analysis for {strategyName}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					<RadarChart data={chartData}>
						<PolarGrid stroke="#e5e7eb" />
						<PolarAngleAxis
							dataKey="metric"
							tick={{ fontSize: 12, fill: "#4b5563" }}
						/>
						<PolarRadiusAxis
							angle={90}
							domain={[0, 100]}
							tick={{ fontSize: 11 }}
						/>
						<Radar
							name={strategyName}
							dataKey="score"
							stroke="#2563eb"
							fill="#3b82f6"
							fillOpacity={0.6}
							animationDuration={1000}
						/>
						<Tooltip content={<CustomTooltip />} />
					</RadarChart>
				</ResponsiveContainer>

				{/* Explanation */}
				<div className="mt-4 p-4 bg-gray-50 rounded-lg">
					<p className="text-sm font-medium text-gray-700 mb-2">
						📊 Understanding the Metrics:
					</p>
					<ul className="text-sm text-gray-600 space-y-1">
						<li>
							• <strong>Fairness (Gini):</strong> How equally
							costs are distributed
						</li>
						<li>
							• <strong>Consistency (CV):</strong> How uniform
							costs are across households
						</li>
						<li>
							• <strong>Price Stability:</strong> How much prices
							vary over time
						</li>
						<li>
							• <strong>Affordability:</strong> Overall price
							level
						</li>
						<li>
							• <strong>Equity Range:</strong> Difference between
							highest and lowest costs
						</li>
					</ul>
					<p className="text-xs text-gray-500 mt-2">
						Higher scores indicate better performance on each metric
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
