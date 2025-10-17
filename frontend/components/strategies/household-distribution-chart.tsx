"use client";

import { TooltipProps } from 'recharts';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { HouseholdCost } from "@/lib/types";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";

interface HouseholdDistributionChartProps {
	householdCosts: HouseholdCost[];
	meanCost: number;
	medianCost: number;
}

export function HouseholdDistributionChart({
	householdCosts,
	meanCost,
	medianCost,
}: HouseholdDistributionChartProps) {
	// Create histogram bins
	const createHistogram = () => {
		if (householdCosts.length === 0) return [];

		const costs = householdCosts.map((h) => h.avg_cost_per_kwh);
		const minCost = Math.min(...costs);
		const maxCost = Math.max(...costs);

		// Create 20 bins
		const numBins = 20;
		const binSize = (maxCost - minCost) / numBins;

		const bins = Array.from({ length: numBins }, (_, i) => ({
			binStart: minCost + i * binSize,
			binEnd: minCost + (i + 1) * binSize,
			count: 0,
			label: `€${(minCost + i * binSize).toFixed(4)}`,
		}));

		// Fill bins
		costs.forEach((cost) => {
			const binIndex = Math.min(
				Math.floor((cost - minCost) / binSize),
				numBins - 1
			);
			bins[binIndex].count++;
		});

		return bins;
	};

	const histogramData = createHistogram();

	// Custom tooltip
	interface CustomTooltipProps extends TooltipProps<number, string> {
		payload?: Array<{
			payload: {
				binStart: number;
				binEnd: number;
				count: number;
			};
		}>;
	}

	const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			return (
				<div className="bg-white p-3 border rounded-lg shadow-lg">
					<p className="text-sm font-medium">
						€{data.binStart.toFixed(4)} - €{data.binEnd.toFixed(4)}
						/kWh
					</p>
					<p className="text-sm text-blue-600 font-semibold">
						{data.count} household{data.count !== 1 ? "s" : ""}
					</p>
				</div>
			);
		}
		return null;
	};

	// Color bars based on relation to mean
	const getBarColor = (binStart: number, binEnd: number) => {
		const binCenter = (binStart + binEnd) / 2;
		if (binCenter < meanCost * 0.95) return "#10b981"; // Green - below average
		if (binCenter > meanCost * 1.05) return "#ef4444"; // Red - above average
		return "#3b82f6"; // Blue - around average
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Household Cost Distribution</CardTitle>
				<CardDescription>
					Distribution of average cost per kWh across all households
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={350}>
					<BarChart data={histogramData}>
						<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
						<XAxis
							dataKey="label"
							tick={{ fontSize: 11 }}
							angle={-45}
							textAnchor="end"
							height={80}
							interval={Math.floor(histogramData.length / 8)}
						/>
						<YAxis
							label={{
								value: "Number of Households",
								angle: -90,
								position: "insideLeft",
							}}
							tick={{ fontSize: 12 }}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Bar
							dataKey="count"
							radius={[4, 4, 0, 0]}
							animationDuration={1000}
						>
							{histogramData.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={getBarColor(
										entry.binStart,
										entry.binEnd
									)}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>

				{/* Legend */}
				<div className="flex justify-center gap-6 mt-4 text-sm">
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-green-500 rounded"></div>
						<span>Below Average</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-blue-500 rounded"></div>
						<span>Around Average</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-red-500 rounded"></div>
						<span>Above Average</span>
					</div>
				</div>

				{/* Statistics */}
				<div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
					<div className="text-center">
						<p className="text-sm text-gray-600">Mean Cost</p>
						<p className="text-lg font-semibold text-blue-600">
							€{meanCost.toFixed(4)}/kWh
						</p>
					</div>
					<div className="text-center">
						<p className="text-sm text-gray-600">Median Cost</p>
						<p className="text-lg font-semibold text-purple-600">
							€{medianCost.toFixed(4)}/kWh
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
