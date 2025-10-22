"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Clock, TrendingUp, Zap } from "lucide-react";
import { StrategyType } from "../../lib/types";

interface StrategySelectorProps {
	selectedStrategy: StrategyType | null;
	onSelect: (strategy: StrategyType) => void;
}

export function StrategySelector({
	selectedStrategy,
	onSelect,
}: StrategySelectorProps) {
	const strategies = [
		{
			type: StrategyType.FLAT,
			name: "Flat Rate",
			description:
				"Simple constant pricing. Same price for all hours - predictable and easy to understand.",
			icon: Zap,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
			pros: ["Simple", "Predictable", "Fair distribution"],
			cons: [
				"No load shifting incentive",
				"Doesn't reflect real-time costs",
			],
		},
		{
			type: StrategyType.TOU,
			name: "Time-of-Use",
			description:
				"Peak and off-peak pricing. Encourages consumers to shift usage to cheaper off-peak hours.",
			icon: Clock,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
			pros: [
				"Encourages load shifting",
				"Reflects time-varying costs",
				"Consumer control",
			],
			cons: ["More complex", "May disadvantage inflexible consumers"],
		},
		{
			type: StrategyType.DYNAMIC,
			name: "Dynamic Tariff",
			description:
				"Real-time load-based pricing. Price automatically adjusts with system demand.",
			icon: TrendingUp,
			color: "text-green-600",
			bgColor: "bg-green-50",
			pros: [
				"Optimal load management",
				"Reflects real-time supply/demand",
				"Revenue optimization",
			],
			cons: [
				"Most complex",
				"Less predictable for consumers",
				"Requires smart systems",
			],
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			{strategies.map((strategy) => {
				const Icon = strategy.icon;
				const isSelected = selectedStrategy === strategy.type;

				return (
					<Card
						key={strategy.type}
						className={`cursor-pointer transition-all hover:shadow-lg ${
							isSelected ? "ring-2 ring-blue-600 shadow-lg" : ""
						}`}
						onClick={() => onSelect(strategy.type)}
					>
						<CardHeader>
							<div
								className={`w-12 h-12 rounded-lg ${strategy.bgColor} flex items-center justify-center mb-3`}
							>
								<Icon className={`h-6 w-6 ${strategy.color}`} />
							</div>
							<CardTitle className="flex items-center justify-between">
								{strategy.name}
								{isSelected && (
									<Badge className="ml-2">Selected</Badge>
								)}
							</CardTitle>
							<CardDescription>
								{strategy.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-green-700 mb-1">
									✓ Pros:
								</p>
								<ul className="text-sm text-gray-600 space-y-1">
									{strategy.pros.map((pro, idx) => (
										<li key={idx}>• {pro}</li>
									))}
								</ul>
							</div>
							<div>
								<p className="text-sm font-medium text-red-700 mb-1">
									✗ Cons:
								</p>
								<ul className="text-sm text-gray-600 space-y-1">
									{strategy.cons.map((con, idx) => (
										<li key={idx}>• {con}</li>
									))}
								</ul>
							</div>
							<Button
								className="w-full"
								variant={isSelected ? "default" : "outline"}
								onClick={(e) => {
									e.stopPropagation();
									onSelect(strategy.type);
								}}
							>
								{isSelected ? "Selected" : "Select Strategy"}
							</Button>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
