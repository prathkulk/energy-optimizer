"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Slider } from "../../components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
	OptimizationPreset,
	OptimizationRequest,
	OptimizationMode,
} from "../../lib/types";
import { useState } from "react";
import { Info, Zap, TrendingUp, TrendingDown, Shield } from "lucide-react";

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
	const [mode, setMode] = useState<OptimizationMode>(
		OptimizationMode.REGULATED
	);
	const [minCostRecovery, setMinCostRecovery] = useState(100.0);
	const [maxCostRecovery, setMaxCostRecovery] = useState(150.0);
	const [costRecoveryTarget, setCostRecoveryTarget] = useState<string>("");
	const [minPrice, setMinPrice] = useState(0.05);
	const [maxPrice, setMaxPrice] = useState(0.5);
	const [solverTimeout, setSolverTimeout] = useState(30);

	const handlePresetSelect = (preset: OptimizationPreset) => {
		setFairnessWeight(preset.fairness_weight);
		setProfitWeight(preset.profit_weight);

		// Set mode based on preset name
		if (preset.name.toLowerCase().includes("market")) {
			setMode(OptimizationMode.MARKET);
			// Market presets have more flexible ranges
			setMinCostRecovery(85.0);
			setMaxCostRecovery(120.0);
		} else {
			setMode(OptimizationMode.REGULATED);
			setMinCostRecovery(100.0);
			setMaxCostRecovery(150.0);
		}
	};

	const handleFairnessChange = (value: number[]) => {
		const newFairness = value[0];
		setFairnessWeight(newFairness);
		if (newFairness + profitWeight > 1.0) {
			setProfitWeight(1.0 - newFairness);
		}
	};

	const handleProfitChange = (value: number[]) => {
		const newProfit = value[0];
		setProfitWeight(newProfit);
		if (fairnessWeight + newProfit > 1.0) {
			setFairnessWeight(1.0 - newProfit);
		}
	};

	const handleModeChange = (newMode: string) => {
		const modeValue = newMode as OptimizationMode;
		setMode(modeValue);

		// Adjust default ranges based on mode
		if (modeValue === OptimizationMode.REGULATED) {
			setMinCostRecovery(100.0);
			setMaxCostRecovery(150.0);
		} else {
			setMinCostRecovery(85.0);
			setMaxCostRecovery(120.0);
		}
	};

	const handleRun = () => {
		const request: OptimizationRequest = {
			fairness_weight: fairnessWeight,
			profit_weight: profitWeight,
			mode: mode,
			min_cost_recovery_pct: minCostRecovery,
			max_cost_recovery_pct: maxCostRecovery,
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
	const recoveryRangeValid = maxCostRecovery >= minCostRecovery;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Zap className="h-5 w-5 text-blue-600" />
					Optimization Configuration
				</CardTitle>
				<CardDescription>
					Configure objectives and constraints for the optimizer
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Presets */}
				<div className="space-y-2">
					<Label>Quick Presets</Label>
					<div className="grid grid-cols-1 gap-2">
						{presets.map((preset) => (
							<Button
								key={preset.name}
								variant="outline"
								size="sm"
								onClick={() => handlePresetSelect(preset)}
								className="text-left justify-start h-auto py-3"
							>
								<div className="w-full">
									<div className="font-medium text-sm">
										{preset.name}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{preset.description}
									</div>
									<div className="text-xs text-gray-600 mt-1">
										Fairness: {preset.fairness_weight} /
										Profit: {preset.profit_weight}
									</div>
								</div>
							</Button>
						))}
					</div>
				</div>

				{/* Mode Selection */}
				<div className="space-y-3">
					<Label>Optimization Mode</Label>
					<Tabs
						value={mode}
						onValueChange={handleModeChange}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger
								value={OptimizationMode.REGULATED}
								className="gap-2"
							>
								<Shield className="h-4 w-4" />
								Regulated
							</TabsTrigger>
							<TabsTrigger
								value={OptimizationMode.MARKET}
								className="gap-2"
							>
								<TrendingUp className="h-4 w-4" />
								Market
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value={OptimizationMode.REGULATED}
							className="space-y-2 mt-3"
						>
							<Alert>
								<Shield className="h-4 w-4" />
								<AlertTitle>Regulated Mode</AlertTitle>
								<AlertDescription className="text-sm">
									Utility must meet minimum cost recovery
									(≥100%). Suitable for regulated utilities
									with mandated cost recovery requirements.
								</AlertDescription>
							</Alert>
						</TabsContent>

						<TabsContent
							value={OptimizationMode.MARKET}
							className="space-y-2 mt-3"
						>
							<Alert className="border-orange-200 bg-orange-50">
								<TrendingDown className="h-4 w-4 text-orange-600" />
								<AlertTitle className="text-orange-900">
									Market Mode
								</AlertTitle>
								<AlertDescription className="text-sm text-orange-700">
									Flexible cost recovery - can accept losses
									(&lt;100%) or generate profits. Suitable for
									competitive markets where pricing is
									strategic.
								</AlertDescription>
							</Alert>
						</TabsContent>
					</Tabs>
				</div>

				{/* Cost Recovery Range */}
				<div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-semibold">
							Cost Recovery Range
						</Label>
						<span className="text-sm text-gray-600">
							{minCostRecovery.toFixed(0)}% -{" "}
							{maxCostRecovery.toFixed(0)}%
						</span>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="minRecovery" className="text-xs">
								Minimum{" "}
								{mode === OptimizationMode.MARKET
									? "(allows losses)"
									: ""}
							</Label>
							<div className="flex items-center gap-2">
								<Input
									id="minRecovery"
									type="number"
									step="5"
									min="50"
									max="100"
									value={minCostRecovery}
									onChange={(e) =>
										setMinCostRecovery(
											parseFloat(e.target.value)
										)
									}
									className="w-20"
								/>
								<span className="text-sm">%</span>
							</div>
							<Slider
								value={[minCostRecovery]}
								onValueChange={(v) => setMinCostRecovery(v[0])}
								min={50}
								max={100}
								step={5}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="maxRecovery" className="text-xs">
								Maximum (profit cap)
							</Label>
							<div className="flex items-center gap-2">
								<Input
									id="maxRecovery"
									type="number"
									step="5"
									min="100"
									max="200"
									value={maxCostRecovery}
									onChange={(e) =>
										setMaxCostRecovery(
											parseFloat(e.target.value)
										)
									}
									className="w-20"
								/>
								<span className="text-sm">%</span>
							</div>
							<Slider
								value={[maxCostRecovery]}
								onValueChange={(v) => setMaxCostRecovery(v[0])}
								min={100}
								max={200}
								step={5}
								className="w-full"
							/>
						</div>
					</div>

					{/* Visual indicator */}
					<div className="relative h-8 bg-gradient-to-r from-red-200 via-yellow-200 via-green-200 to-blue-200 rounded">
						<div
							className="absolute h-full bg-blue-600 opacity-30 rounded"
							style={{
								left: `${minCostRecovery / 2}%`,
								width: `${
									(maxCostRecovery - minCostRecovery) / 2
								}%`,
							}}
						/>
						<div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
							<span>50% Loss</span>
							<span>100% Break-even</span>
							<span>200% Profit</span>
						</div>
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
							Higher = More revenue optimization (may increase
							price variation)
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
							<p className="text-xs text-gray-500">
								Leave empty to auto-calculate based on
								consumption data
							</p>
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
						The optimizer uses MILP to find prices that:
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>
								Balance fairness (equal costs) vs. profit
								(revenue maximization)
							</li>
							<li>
								Stay within cost recovery range (
								{minCostRecovery}% - {maxCostRecovery}%)
							</li>
							<li>
								Respect min/max price bounds (€{minPrice} - €
								{maxPrice}/kWh)
							</li>
							{mode === OptimizationMode.MARKET && (
								<li className="text-orange-600 font-medium">
									Can accept losses to maintain fairness
								</li>
							)}
						</ul>
					</AlertDescription>
				</Alert>

				{/* Run Button */}
				<Button
					onClick={handleRun}
					className="w-full"
					disabled={isRunning || !weightsValid || !recoveryRangeValid}
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
				{!recoveryRangeValid && (
					<p className="text-sm text-red-600 text-center">
						⚠️ Max recovery must be ≥ min recovery
					</p>
				)}
			</CardContent>
		</Card>
	);
}
