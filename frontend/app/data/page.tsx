"use client";

import { useState } from "react";
import { IngestionForm } from "../../components/data-ingestion/ingestion-form";
import { StatisticsDisplay } from "../../components/data-ingestion/statistics-display";
import { Button } from "../../components/ui/button";
import { DataIngestionResponse } from "../../lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DataSummary } from "../../components/data-ingestion/data-summary";

export default function DataPage() {
	const [ingestionResult, setIngestionResult] =
		useState<DataIngestionResponse | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleIngestionSuccess = (data: DataIngestionResponse) => {
        setIngestionResult(data);
        setRefreshKey((prev) => prev + 1);
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
					Data Ingestion
				</h1>
				<p className="text-gray-600 mt-2">
					Fetch and process energy consumption data from ENTSO-E
				</p>
			</div>

            <div key={refreshKey}>
                <DataSummary  onRefresh={() => setRefreshKey((prev) => prev + 1)} />
            </div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Column: Form */}
				<div>
					<IngestionForm onSuccess={handleIngestionSuccess} />
				</div>

				{/* Right Column: Results */}
				<div>
					{ingestionResult ? (
						<StatisticsDisplay data={ingestionResult} />
					) : (
						<div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-8">
							<div className="text-center text-gray-500">
								<p className="text-lg font-medium">
									No data ingested yet
								</p>
								<p className="text-sm mt-2">
									Fill out the form and click &apos;Fetch Data&apos; to
									see results here
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
