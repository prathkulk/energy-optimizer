"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { PricePoint } from "../../lib/types";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface PriceCurveChartProps {
	priceData: PricePoint[];
	strategyName: string;
}

export function PriceCurveChart({
	priceData,
	strategyName,
}: PriceCurveChartProps) {
	// Prepare data for chart - limit to first 168 hours (7 days) for readability
	const chartData = priceData.slice(0, 168).map((point) => ({
		timestamp: new Date(point.timestamp),
		price: point.price_per_kwh,
		hour: format(new Date(point.timestamp), "MMM dd HH:mm"),
	}));

	// Custom tooltip
	interface CustomTooltipProps {
		active?: boolean;
		payload?: {
			value: number;
			payload: {
				timestamp: Date;
				price: number;
				hour: string;
			};
		}[];
	}

	const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-white p-3 border rounded-lg shadow-lg">
					<p className="text-sm font-medium">
						{format(payload[0].payload.timestamp, "PPpp")}
					</p>
					<p className="text-sm text-blue-600 font-semibold">
						€{payload[0].value.toFixed(4)}/kWh
					</p>
				</div>
			);
		}
		return null;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Price Curve Over Time</CardTitle>
				<CardDescription>
					{strategyName} pricing for the first 7 days (
					{chartData.length} hours)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
						<XAxis
							dataKey="hour"
							tick={{ fontSize: 12 }}
							angle={-45}
							textAnchor="end"
							height={80}
							interval={Math.floor(chartData.length / 10)} // Show ~10 labels
						/>
						<YAxis
							label={{
								value: "Price (€/kWh)",
								angle: -90,
								position: "insideLeft",
							}}
							tick={{ fontSize: 12 }}
							domain={["dataMin - 0.01", "dataMax + 0.01"]}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Legend />
						<Line
							type="monotone"
							dataKey="price"
							stroke="#2563eb"
							strokeWidth={2}
							dot={false}
							name="Price per kWh"
							animationDuration={1000}
						/>
					</LineChart>
				</ResponsiveContainer>

				{priceData.length > 168 && (
					<p className="text-sm text-gray-500 text-center mt-4">
						Showing first 168 hours. Total data points:{" "}
						{priceData.length}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
