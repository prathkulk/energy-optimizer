"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { StrategySelector } from "../../components/strategies/strategy-selector";
import { StrategyConfig } from "../../components/strategies/strategy-config";
import { StrategyResults } from "../../components/strategies/strategy-results";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { StrategyType, StrategyExecutionRequest, StrategyExecutionResponse } from "../../lib/types";
import { executeStrategy } from "../../lib/api";

export default function StrategiesPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<StrategyExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (params: any) => {
    if (!selectedStrategy) return;

    setIsExecuting(true);
    setError(null);
    setResults(null);

    try {
      const request: StrategyExecutionRequest = {
        strategy_type: selectedStrategy,
        ...params,
      };

      const response = await executeStrategy(request);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute strategy");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStrategyChange = (strategy: StrategyType) => {
    setSelectedStrategy(strategy);
    setResults(null);
    setError(null);
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
        <h1 className="text-3xl font-bold tracking-tight">Pricing Strategies</h1>
        <p className="text-gray-600 mt-2">
          Compare different energy pricing models and analyze their fairness and profitability
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Before You Start</AlertTitle>
        <AlertDescription>
          Make sure you have ingested consumption data first. Go to{" "}
          <Link href="/data" className="font-medium text-blue-600 hover:underline">
            Data Ingestion
          </Link>{" "}
          to load data from ENTSO-E.
        </AlertDescription>
      </Alert>

      {/* Strategy Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 1: Select a Pricing Strategy</h2>
        <StrategySelector
          selectedStrategy={selectedStrategy}
          onSelect={handleStrategyChange}
        />
      </div>

      {/* Configuration & Execution */}
      {selectedStrategy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Step 2: Configure & Execute</h2>
            <StrategyConfig
              strategyType={selectedStrategy}
              onExecute={handleExecute}
              isExecuting={isExecuting}
            />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Step 3: Analyze Results</h2>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isExecuting && (
              <Alert>
                <AlertDescription>
                  Executing {selectedStrategy} strategy... This may take a few seconds.
                </AlertDescription>
              </Alert>
            )}
            {results && <StrategyResults results={results} />}
            {!results && !isExecuting && !error && (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium">No results yet</p>
                  <p className="text-sm mt-2">
                    Configure the strategy and click &apos;Execute Strategy&apos; to see results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}