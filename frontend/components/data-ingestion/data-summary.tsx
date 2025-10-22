"use client";

import { clearData, getDataSummary } from "../../lib/api";
import { DataSummaryResponse } from "../../lib/types";
import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Database, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";

interface DataSummaryProps {
	onRefresh?: () => void;
}

export function DataSummary({ onRefresh }: DataSummaryProps) {
	const [summary, setSummary] = useState<DataSummaryResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isClearing, setIsClearing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchSummary = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const data = await getDataSummary();
			setSummary(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load summary"
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchSummary();
	}, []);

	const handleRefresh = () => {
		fetchSummary();
		onRefresh?.();
	};

	const handleClearData = async () => {
		if (
			!confirm(
				"Are you sure you want to delete all consumption data? This cannot be undone."
			)
		) {
			return;
		}

		setIsClearing(true);
		try {
			await clearData();
			await fetchSummary(); // Refresh after clearing
			onRefresh?.();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to clear data"
			);
		} finally {
			setIsClearing(false);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-center gap-2 py-8">
						<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
						<span className="text-sm text-gray-600">
							Loading database summary...
						</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						Database Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertDescription>
							{error.includes("No consumption data") ? (
								<div className="space-y-2">
									<p>No data in database yet.</p>
									<p className="text-sm text-gray-600">
										Use the form to ingest your first
										dataset from ENTSO-E.
									</p>
								</div>
							) : (
								<p>{error}</p>
							)}
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	if (!summary) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Database className="h-5 w-5 text-blue-600" />
						<CardTitle>Database Summary</CardTitle>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleRefresh}
							disabled={isLoading}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${
									isLoading ? "animate-spin" : ""
								}`}
							/>
							Refresh
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleClearData}
							disabled={isClearing}
						>
							{isClearing ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4 mr-2" />
							)}
							Clear All
						</Button>
					</div>
				</div>
				<CardDescription>
					Current data stored in the database
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Key Metrics */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<p className="text-sm text-gray-600">Total Records</p>
						<p className="text-2xl font-bold text-blue-600">
							{summary.total_records.toLocaleString()}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-gray-600">
							Unique Households
						</p>
						<p className="text-2xl font-bold text-purple-600">
							{summary.unique_households.toLocaleString()}
						</p>
					</div>
				</div>

				{/* Countries */}
				<div className="space-y-2">
					<p className="text-sm font-medium text-gray-700">
						Countries
					</p>
					<div className="flex flex-wrap gap-2">
						{summary.countries.map((country) => (
							<Badge
								key={country}
								variant="secondary"
								className="text-sm"
							>
								{country}
							</Badge>
						))}
					</div>
				</div>

				{/* Date Range */}
				{summary.date_range && (
					<div className="space-y-2">
						<p className="text-sm font-medium text-gray-700">
							Date Range
						</p>
						<div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Start:</span>
								<span className="font-medium">
									{format(
										new Date(summary.date_range.start),
										"PPp"
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">End:</span>
								<span className="font-medium">
									{format(
										new Date(summary.date_range.end),
										"PPp"
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Duration:</span>
								<span className="font-medium">
									{summary.date_range.total_hours} hours (
									{Math.round(
										summary.date_range.total_hours / 24
									)}{" "}
									days)
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Statistics */}
				{summary.statistics && (
					<div className="space-y-2">
						<p className="text-sm font-medium text-gray-700">
							Consumption Statistics
						</p>
						<div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-gray-600">Mean</p>
								<p className="font-semibold">
									{summary.statistics.mean_consumption.toFixed(
										3
									)}{" "}
									kWh
								</p>
							</div>
							<div>
								<p className="text-gray-600">Median</p>
								<p className="font-semibold">
									{summary.statistics.median_consumption.toFixed(
										3
									)}{" "}
									kWh
								</p>
							</div>
							<div>
								<p className="text-gray-600">Min</p>
								<p className="font-semibold text-blue-600">
									{summary.statistics.min_consumption.toFixed(
										3
									)}{" "}
									kWh
								</p>
							</div>
							<div>
								<p className="text-gray-600">Max</p>
								<p className="font-semibold text-red-600">
									{summary.statistics.max_consumption.toFixed(
										3
									)}{" "}
									kWh
								</p>
							</div>
							<div className="col-span-2">
								<p className="text-gray-600">
									Total Consumption
								</p>
								<p className="font-semibold text-green-600">
									{summary.statistics.total_consumption.toLocaleString(
										undefined,
										{
											maximumFractionDigits: 0,
										}
									)}{" "}
									kWh
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Info Message */}
				<Alert>
					<AlertDescription className="text-sm">
						💡 This data is available for pricing strategy analysis
						and optimization.
					</AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	);
}
