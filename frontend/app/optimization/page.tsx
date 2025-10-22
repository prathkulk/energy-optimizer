"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { OptimizationControls } from "../../components/optimization/optimization-controls";
import { OptimizationResults } from "../../components/optimization/optimization-results";
import { ArrowLeft, AlertCircle, Lightbulb } from "lucide-react";
import {
	OptimizationPreset,
	OptimizationRequest,
	OptimizationResponse,
} from "../../lib/types";
import { getOptimizationPresets, runOptimization } from "../../lib/api";

export default function OptimizationPage() {
	const [presets, setPresets] = useState<OptimizationPreset[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [results, setResults] = useState<OptimizationResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Load presets on mount
		const loadPresets = async () => {
			try {
				const data = await getOptimizationPresets();
				setPresets(data);
			} catch (err) {
				console.error("Failed to load presets:", err);
			}
		};
		loadPresets();
	}, []);

	const handleRun = async (request: OptimizationRequest) => {
		setIsRunning(true);
		setError(null);
		setResults(null);

		try {
			const response = await runOptimization(request);
			setResults(response);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to run optimization"
			);
		} finally {
			setIsRunning(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div>
				<Link href="/">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Home
					</Button>
				</Link>
			</div>

			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					MILP Optimization
				</h1>
				<p className="text-gray-600 mt-2">
					Find optimal energy pricing using Mixed Integer Linear
					Programming
				</p>
			</div>

			{/* Info Alert */}
			<Alert>
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Before You Start</AlertTitle>
				<AlertDescription>
					Make sure you have ingested consumption data first. Go to{" "}
					<Link
						href="/data"
						className="font-medium text-blue-600 hover:underline"
					>
						Data Ingestion
					</Link>{" "}
					to load data from ENTSO-E.
				</AlertDescription>
			</Alert>

			{/* How It Works */}
			<Alert>
				<Lightbulb className="h-4 w-4" />
				<AlertTitle>How MILP Optimization Works</AlertTitle>
				<AlertDescription className="space-y-2">
					<p>
						The optimizer uses a mathematical solver to find prices
						that simultaneously:
					</p>
					<ul className="list-disc list-inside space-y-1 text-sm mt-2">
						<li>
							<strong>Meet cost recovery:</strong> Total revenue ≥
							target (hard constraint)
						</li>
						<li>
							<strong>Maximize fairness:</strong> Minimize price
							variance across time
						</li>
						<li>
							<strong>Maximize profit:</strong> Generate
							additional revenue above target
						</li>
						<li>
							<strong>Respect bounds:</strong> Prices stay within
							min/max limits
						</li>
					</ul>
					<p className="text-sm mt-2">
						Adjust the weights to control the trade-off between
						fairness and profitability.
					</p>
				</AlertDescription>
			</Alert>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left: Controls */}
				<div className="lg:col-span-1">
					<OptimizationControls
						presets={presets}
						onRun={handleRun}
						isRunning={isRunning}
					/>
				</div>

				{/* Right: Results */}
				<div className="lg:col-span-2">
					<div className="sticky top-6">
						{error && (
							<Alert variant="destructive">
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{isRunning && (
							<Alert>
								<AlertDescription className="flex items-center gap-2">
									<div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
									Running MILP optimization... This may take
									up to 30 seconds.
								</AlertDescription>
							</Alert>
						)}

						{results && <OptimizationResults results={results} />}

						{!results && !isRunning && !error && (
							<div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 bg-gray-50">
								<div className="text-center text-gray-500 space-y-4">
									<div className="text-6xl">🎯</div>
									<div>
										<p className="text-lg font-medium">
											Ready to Optimize
										</p>
										<p className="text-sm mt-2">
											Configure parameters and click
											&apos;Run Optimization&apos; to find
											optimal pricing
										</p>
									</div>
									<div className="text-xs text-gray-400 max-w-md">
										The optimizer will use a mathematical
										solver (CBC) to find prices that balance
										your fairness and profitability
										objectives
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Tips Section */}
			{!results && (
				<Alert className="bg-blue-50 border-blue-200">
					<Lightbulb className="h-4 w-4 text-blue-600" />
					<AlertTitle className="text-blue-900">
						💡 Tips for Better Results
					</AlertTitle>
					<AlertDescription className="text-blue-800 space-y-2">
						<ul className="list-disc list-inside space-y-1 text-sm">
							<li>
								<strong>Start with presets:</strong> Use
								&apos;Balanced&apos; preset first to understand
								baseline results
							</li>
							<li>
								<strong>Fairness = 1.0:</strong> Results in
								nearly identical costs for all households (like
								Flat Rate)
							</li>
							<li>
								<strong>Profit = 1.0:</strong> Maximizes revenue
								but may create unfair distribution
							</li>
							<li>
								<strong>Equal weights (0.5/0.5):</strong> Good
								compromise for most scenarios
							</li>
							<li>
								<strong>Wider price bounds:</strong> Give the
								optimizer more flexibility
							</li>
							<li>
								<strong>Longer timeout:</strong> May find better
								solutions for complex problems
							</li>
						</ul>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
