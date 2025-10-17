"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { checkHealth } from "@/lib/api";
import { HealthCheckResponse } from "@/lib/types";

export function HealthStatus() {
	const [health, setHealth] = useState<HealthCheckResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchHealth = async () => {
			try {
				const data = await checkHealth();
				setHealth(data);
				setError(null);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to connect"
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchHealth();
		// Refresh every 30 seconds
		const interval = setInterval(fetchHealth, 30000);
		return () => clearInterval(interval);
	}, []);

	if (isLoading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span className="text-sm">
							Checking backend status...
						</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<XCircle className="h-4 w-4" />
				<AlertDescription>
					Backend API is not reachable: {error}
				</AlertDescription>
			</Alert>
		);
	}

	const isHealthy =
		health?.status === "healthy" && health?.database === "connected";

	return (
		<Alert variant={isHealthy ? "default" : "destructive"}>
			{isHealthy ? (
				<CheckCircle2 className="h-4 w-4 text-green-600" />
			) : (
				<XCircle className="h-4 w-4" />
			)}
			<AlertDescription>
				<div className="flex items-center justify-between">
					<span>
						Backend API: <strong>{health?.status}</strong> |
						Database: <strong>{health?.database}</strong> | Version:{" "}
						<strong>{health?.version}</strong>
					</span>
				</div>
			</AlertDescription>
		</Alert>
	);
}
