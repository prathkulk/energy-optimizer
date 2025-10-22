"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OptimizationPreset, OptimizationRequest } from "@/lib/types";
import { useState } from "react";
import { Info, Zap } from "lucide-react";

interface OptimizationControlsProps {
	presets: OptimizationPreset[];
	onRun: (request: OptimizationRequest) => void;
	isRunning: boolean;
}

export function OptimizationControls({
	presets,
	onRun,
	isRunning,
}: OptimizationControlsProps) {
	const [fairnessWeight, setFairnessWeight] = useState(0.5);
	const [profitWeight, setProfitWeight] = useState(0.5);
	const [costRecoveryTarget, setCostRecoveryTarget] = useState<string>("");
	const [minPrice, setMinPrice] = useState(0.05);
	const [maxPrice, setMaxPrice] = useState(0.5);
	const [solverTimeout, setSolverTimeout] = useState(30);

	const handlePresetSelect = (preset: OptimizationPreset) => {
		setFairnessWeight(preset.fairness_weight);
		setProfitWeight(preset.profit_weight);
	};

	const handleFairnessChange = (value: number[]) => {
		const newFairness = value[0];
		setFairnessWeight(newFairness);
		// Auto-adjust profit weight to keep sum <= 1.0
		if (newFairness + profitWeight > 1.0) {
			setProfitWeight(1.0 - newFairness);
		}
	};

	const handleProfitChange = (value: number[]) => {
		const newProfit = value[0];
		setProfitWeight(newProfit);
		// Auto-adjust fairness weight to keep sum <= 1.0
		if (fairnessWeight + newProfit > 1.0) {
			setFairnessWeight(1.0 - newProfit);
		}
	};

	const handleRun = () => {
		const request: OptimizationRequest = {
			fairness_weight: fairnessWeight,
			profit_weight: profitWeight,
			cost_recovery_target: costRecoveryTarget
				? parseFloat(costRecoveryTarget)
				: undefined,
			min_price: minPrice,
			max_price: maxPrice,
			solver_timeout: solverTimeout,
		};
		onRun(request);
	};

	const weightsValid = fairnessWeight + profitWeight <= 1.0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Zap className="h-5 w-5 text-blue-600" />
					Optimization Configuration
				</CardTitle>
				<CardDescription>
					Adjust weights to balance fairness and profitability
					objectives
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Presets */}
				<div className="space-y-2">
					<Label>Quick Presets</Label>
					<div className="grid grid-cols-2 gap-2">
						{presets.map((preset) => (
							<Button
								key={preset.name}
								variant="outline"
								size="sm"
								onClick={() => handlePresetSelect(preset)}
								className="text-left justify-start h-auto py-2"
							>
								<div>
									<div className="font-medium text-sm">
										{preset.name}
									</div>
									<div className="text-xs text-gray-500">
										F: {preset.fairness_weight} / P:{" "}
										{preset.profit_weight}
									</div>
								</div>
							</Button>
						))}
					</div>
				</div>

				{/* Weight Sliders */}
				<div className="space-y-4 p-4 bg-blue-50 rounded-lg">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Fairness Weight</Label>
							<span className="text-sm font-semibold text-blue-600">
								{fairnessWeight.toFixed(2)}
							</span>
						</div>
						<Slider
							value={[fairnessWeight]}
							onValueChange={handleFairnessChange}
							min={0}
							max={1}
							step={0.05}
							className="w-full"
						/>
						<p className="text-xs text-gray-600">
							Higher = More uniform costs across households (lower
							Gini coefficient)
						</p>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Profit Weight</Label>
							<span className="text-sm font-semibold text-green-600">
								{profitWeight.toFixed(2)}
							</span>
						</div>
						<Slider
							value={[profitWeight]}
							onValueChange={handleProfitChange}
							min={0}
							max={1}
							step={0.05}
							className="w-full"
						/>
						<p className="text-xs text-gray-600">
							Higher = More revenue generation (may increase price
							variation)
						</p>
					</div>

					{/* Weights Sum Display */}
					<div className="flex items-center justify-between p-2 bg-white rounded border">
						<span className="text-sm font-medium">
							Weights Sum:
						</span>
						<span
							className={`text-sm font-bold ${
								weightsValid ? "text-green-600" : "text-red-600"
							}`}
						>
							{(fairnessWeight + profitWeight).toFixed(2)} / 1.00
							{weightsValid ? " ✓" : " ✗"}
						</span>
					</div>
				</div>

				{/* Advanced Settings */}
				<details className="space-y-4">
					<summary className="cursor-pointer font-medium text-sm text-gray-700 hover:text-blue-600">
						Advanced Settings
					</summary>
					<div className="space-y-4 mt-4 p-4 border rounded-lg">
						<div className="space-y-2">
							<Label htmlFor="costTarget">
								Cost Recovery Target (Optional)
							</Label>
							<Input
								id="costTarget"
								type="number"
								placeholder="Auto-calculated if empty"
								value={costRecoveryTarget}
								onChange={(e) =>
									setCostRecoveryTarget(e.target.value)
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="minPrice">
									Min Price (€/kWh)
								</Label>
								<Input
									id="minPrice"
									type="number"
									step="0.01"
									value={minPrice}
									onChange={(e) =>
										setMinPrice(parseFloat(e.target.value))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="maxPrice">
									Max Price (€/kWh)
								</Label>
								<Input
									id="maxPrice"
									type="number"
									step="0.01"
									value={maxPrice}
									onChange={(e) =>
										setMaxPrice(parseFloat(e.target.value))
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="timeout">
								Solver Timeout (seconds)
							</Label>
							<Input
								id="timeout"
								type="number"
								value={solverTimeout}
								onChange={(e) =>
									setSolverTimeout(parseInt(e.target.value))
								}
							/>
						</div>
					</div>
				</details>

				{/* Info Alert */}
				<Alert>
					<Info className="h-4 w-4" />
					<AlertTitle>How It Works</AlertTitle>
					<AlertDescription className="text-sm">
						The optimizer uses Mixed Integer Linear Programming
						(MILP) to find prices that:
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>Meet the cost recovery target (constraint)</li>
							<li>Stay within min/max price bounds</li>
							<li>
								Maximize the weighted objective (fairness +
								profit)
							</li>
						</ul>
					</AlertDescription>
				</Alert>

				{/* Run Button */}
				<Button
					onClick={handleRun}
					className="w-full"
					disabled={isRunning || !weightsValid}
					size="lg"
				>
					{isRunning ? (
						<>
							<Zap className="mr-2 h-4 w-4 animate-pulse" />
							Running Optimization...
						</>
					) : (
						<>
							<Zap className="mr-2 h-4 w-4" />
							Run Optimization
						</>
					)}
				</Button>

				{!weightsValid && (
					<p className="text-sm text-red-600 text-center">
						⚠️ Weights must sum to 1.0 or less
					</p>
				)}
			</CardContent>
		</Card>
	);
}
