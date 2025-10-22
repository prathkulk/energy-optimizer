"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { DataIngestionResponse } from "../../lib/types";
import { CheckCircle2, Users, Calendar, Zap, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface StatisticsDisplayProps {
	data: DataIngestionResponse;
}

export function StatisticsDisplay({ data }: StatisticsDisplayProps) {
	return (
		<div className="space-y-6">
			{/* Success Message */}
			<Card className="border-green-200 bg-green-50">
				<CardContent className="pt-6">
					<div className="flex items-start gap-3">
						<CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
						<div>
							<h3 className="font-semibold text-green-900">
								Data Ingestion Successful!
							</h3>
							<p className="text-sm text-green-700 mt-1">
								{data.message}
							</p>
							<p className="text-xs text-green-600 mt-2">
								Completed in{" "}
								{data.ingestion_time_seconds.toFixed(2)} seconds
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Total Records</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Zap className="h-5 w-5 text-blue-600" />
							<span className="text-2xl font-bold">
								{data.total_records.toLocaleString()}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Households</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-purple-600" />
							<span className="text-2xl font-bold">
								{data.unique_households}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Time Period</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-orange-600" />
							<span className="text-2xl font-bold">
								{data.date_range.total_hours}h
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardDescription>Country</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-green-600" />
							<span className="text-2xl font-bold">
								{data.country}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Statistics */}
			<Card>
				<CardHeader>
					<CardTitle>Consumption Statistics</CardTitle>
					<CardDescription>
						Statistical analysis of energy consumption (kWh per
						hour)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Mean Consumption
							</p>
							<p className="text-xl font-semibold">
								{data.statistics.mean_consumption.toFixed(3)}{" "}
								kWh
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Median Consumption
							</p>
							<p className="text-xl font-semibold">
								{data.statistics.median_consumption.toFixed(3)}{" "}
								kWh
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Std Deviation
							</p>
							<p className="text-xl font-semibold">
								{data.statistics.std_deviation.toFixed(3)} kWh
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Min Consumption
							</p>
							<p className="text-xl font-semibold text-blue-600">
								{data.statistics.min_consumption.toFixed(3)} kWh
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Max Consumption
							</p>
							<p className="text-xl font-semibold text-red-600">
								{data.statistics.max_consumption.toFixed(3)} kWh
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Total Consumption
							</p>
							<p className="text-xl font-semibold text-green-600">
								{data.statistics.total_consumption.toLocaleString(
									undefined,
									{
										maximumFractionDigits: 0,
									}
								)}{" "}
								kWh
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Date Range Details */}
			<Card>
				<CardHeader>
					<CardTitle>Date Range</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="text-gray-600">Start:</span>
							<span className="font-semibold">
								{format(
									new Date(data.date_range.start),
									"PPpp"
								)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">End:</span>
							<span className="font-semibold">
								{format(new Date(data.date_range.end), "PPpp")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Duration:</span>
							<span className="font-semibold">
								{data.date_range.total_hours} hours (
								{Math.round(data.date_range.total_hours / 24)}{" "}
								days)
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
