import { HealthStatus } from "@/components/home/health-status";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArrowRight, PieChart, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
	return (
		<div className="space-y-8">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold tracking-tight">
					Energy Price Optimization Simulator
				</h1>
				<p className="text-xl text-gray-600 max-w-2xl mx-auto">
					Optimize energy pricing strategies by balancing
					profitability and fairness using real European energy
					consumption data
				</p>
			</div>

			<HealthStatus />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Zap className="h-10 w-10 text-blue-600 mb-2" />
						<CardTitle>Data Ingestion</CardTitle>
						<CardDescription>
							Fetch real energy consumption data from ENTSO-E for
							10 European countries
						</CardDescription>
						<CardContent>
							<Link href="/data">
								<Button className="w-full">
									Get Started{" "}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</CardContent>
					</CardHeader>
				</Card>

				<Card className="hover:shadow-lg transition-shadow">
					<CardHeader>
						<TrendingUp className="h-10 w-10 text-purple-600 mb-2" />
						<CardTitle>Pricing Strategies</CardTitle>
						<CardDescription>
							Compare flat rate, time-of-use, and dynamic pricing
							models
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/strategies">
							<Button className="w-full">
								Explore Strategies{" "}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="hover:shadow-lg transition-shadow">
					<CardHeader>
						<PieChart className="h-10 w-10 text-green-600 mb-2" />
						<CardTitle>Optimization</CardTitle>
						<CardDescription>
							Use MILP to find optimal pricing with fairness
							constraints
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/optimization">
							<Button
								className="w-full"
								variant="outline"
								disabled
							>
								Coming Soon
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>How It Works</CardTitle>
					<CardDescription>
						Three-step process to optimize energy pricing
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="space-y-2">
							<div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
								1
							</div>
							<h3 className="font-semibold">Ingest Data</h3>
							<p className="text-sm text-gray-600">
								Fetch real energy consumption data from ENTSO-E
								and convert to household-level consumption
								patterns
							</p>
						</div>
						<div className="space-y-2">
							<div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
								2
							</div>
							<h3 className="font-semibold">Choose Strategy</h3>
							<p className="text-sm text-gray-600">
								Select from multiple pricing strategies or run
								optimization with custom fairness/profit weights
							</p>
						</div>
						<div className="space-y-2">
							<div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
								3
							</div>
							<h3 className="font-semibold">Analyze Results</h3>
							<p className="text-sm text-gray-600">
								View detailed metrics, fairness indices, and
								price curves to understand the impact of your
								pricing strategy
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quick Links</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4">
						<a
							href="http://localhost:8000/docs"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							API Documentation →
						</a>

						<a
							href="https://www.preisenergie.de"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							Preisenergie.de →
						</a>
						<a
							href="https://transparency.entsoe.eu/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							ENTSO-E Platform →
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
