import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function OptimizationPage() {
	return (
		<div className="space-y-6">
			<div>
				<Link href="/">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Home
					</Button>
				</Link>
			</div>

			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Optimization
				</h1>
				<p className="text-gray-600 mt-2">
					Run MILP optimization to find optimal pricing
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Coming Soon</CardTitle>
					<CardDescription>
						This feature is under development
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-gray-600">
						We&apos;re building the optimization engine. Check back
						soon!
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
