"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, Download } from "lucide-react";
import {
	CountryCode,
	COUNTRY_NAMES,
	DataIngestionRequest,
	DataIngestionResponse,
} from "../../lib/types";
import { ingestData } from "../../lib/api";
import { format, subDays } from "date-fns";

interface IngestionFormProps {
	onSuccess: (data: DataIngestionResponse) => void;
}

export function IngestionForm({ onSuccess }: IngestionFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [countryCode, setCountryCode] = useState<CountryCode>(CountryCode.DE);
	const [startDate, setStartDate] = useState(() => {
		// Default: 14 days ago at midnight
		const date = subDays(new Date(), 14);
		date.setHours(0, 0, 0, 0);
		return format(date, "yyyy-MM-dd'T'HH:mm");
	});
	const [endDate, setEndDate] = useState(() => {
		// Default: 7 days ago at midnight
		const date = subDays(new Date(), 7);
		date.setHours(0, 0, 0, 0);
		return format(date, "yyyy-MM-dd'T'HH:mm");
	});
	const [numHouseholds, setNumHouseholds] = useState(100);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const request: DataIngestionRequest = {
				country_code: countryCode,
				start_date: new Date(startDate).toISOString(),
				end_date: new Date(endDate).toISOString(),
				num_households: numHouseholds,
			};

			const response = await ingestData(request);
			onSuccess(response);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>📊 Data Ingestion</CardTitle>
				<CardDescription>
					Fetch energy consumption data from ENTSO-E and process it
					for analysis
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Country Selection */}
					<div className="space-y-2">
						<Label htmlFor="country">Country</Label>
						<Select
							value={countryCode}
							onValueChange={(value) =>
								setCountryCode(value as CountryCode)
							}
						>
							<SelectTrigger id="country">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(COUNTRY_NAMES).map(
									([code, name]) => (
										<SelectItem key={code} value={code}>
											{name} ({code})
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>

					{/* Date Range */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date</Label>
							<Input
								id="startDate"
								type="datetime-local"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">End Date</Label>
							<Input
								id="endDate"
								type="datetime-local"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								required
							/>
						</div>
					</div>

					{/* Number of Households */}
					<div className="space-y-2">
						<Label htmlFor="households">Number of Households</Label>
						<Input
							id="households"
							type="number"
							min={1}
							max={1000}
							value={numHouseholds}
							onChange={(e) =>
								setNumHouseholds(parseInt(e.target.value))
							}
							required
						/>
						<p className="text-sm text-gray-500">
							Simulates consumption for {numHouseholds} synthetic
							households (1-1000)
						</p>
					</div>

					{/* Error Alert */}
					{error && (
						<Alert variant="destructive">
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Info Alert */}
					<Alert>
						<AlertTitle>ℹ️ Data Availability</AlertTitle>
						<AlertDescription>
							ENTSO-E data has a 2-day delay. Please select dates
							at least 2 days in the past. Data must be on hour
							boundaries (00:00:00).
						</AlertDescription>
					</Alert>

					{/* Submit Button */}
					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Fetching Data...
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Fetch Data from ENTSO-E
							</>
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
