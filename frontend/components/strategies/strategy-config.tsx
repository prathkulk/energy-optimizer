"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StrategyType, TOUParameters, DynamicParameters } from "@/lib/types";
import { useState } from "react";

interface StrategyConfigProps {
  strategyType: StrategyType;
  onExecute: (params: any) => void;
  isExecuting: boolean;
}

export function StrategyConfig({ strategyType, onExecute, isExecuting }: StrategyConfigProps) {
  // TOU Parameters
  const [peakHours, setPeakHours] = useState<string>("7,8,17,18,19,20,21");
  const [peakMultiplier, setPeakMultiplier] = useState(1.5);
  const [offpeakMultiplier, setOffpeakMultiplier] = useState(0.7);

  // Dynamic Parameters
  const [minMultiplier, setMinMultiplier] = useState(0.5);
  const [maxMultiplier, setMaxMultiplier] = useState(2.0);

  // Common
  const [costRecoveryTarget, setCostRecoveryTarget] = useState<string>("");

  const handleExecute = () => {
    const baseParams = {
      cost_recovery_target: costRecoveryTarget ? parseFloat(costRecoveryTarget) : undefined,
    };

    if (strategyType === StrategyType.TOU) {
      const hours = peakHours.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h) && h >= 0 && h <= 23);
      onExecute({
        ...baseParams,
        tou_params: {
          peak_hours: hours,
          peak_multiplier: peakMultiplier,
          offpeak_multiplier: offpeakMultiplier,
        },
      });
    } else if (strategyType === StrategyType.DYNAMIC) {
      onExecute({
        ...baseParams,
        dynamic_params: {
          min_multiplier: minMultiplier,
          max_multiplier: maxMultiplier,
        },
      });
    } else {
      onExecute(baseParams);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          {strategyType === StrategyType.FLAT && "No configuration needed for flat rate pricing"}
          {strategyType === StrategyType.TOU && "Configure peak hours and price multipliers"}
          {strategyType === StrategyType.DYNAMIC && "Configure price multiplier range"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Recovery Target (Optional for all strategies) */}
        <div className="space-y-2">
          <Label htmlFor="costTarget">Cost Recovery Target (Optional)</Label>
          <Input
            id="costTarget"
            type="number"
            placeholder="Leave empty to auto-calculate"
            value={costRecoveryTarget}
            onChange={(e) => setCostRecoveryTarget(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Target revenue in EUR. If not specified, calculated as total consumption × €0.25/kWh
          </p>
        </div>

        {/* Time-of-Use Configuration */}
        {strategyType === StrategyType.TOU && (
          <>
            <div className="space-y-2">
              <Label htmlFor="peakHours">Peak Hours (comma-separated, 0-23)</Label>
              <Input
                id="peakHours"
                value={peakHours}
                onChange={(e) => setPeakHours(e.target.value)}
                placeholder="7,8,17,18,19,20,21"
              />
              <p className="text-sm text-gray-500">
                Example: 7,8,17,18,19,20,21 for morning (7-9 AM) and evening (5-10 PM) peaks
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Peak Price Multiplier: {peakMultiplier.toFixed(2)}x</Label>
                <Slider
                  value={[peakMultiplier]}
                  onValueChange={(value) => setPeakMultiplier(value[0])}
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Peak hours cost {peakMultiplier.toFixed(2)}× the base price
                </p>
              </div>

              <div className="space-y-2">
                <Label>Off-Peak Price Multiplier: {offpeakMultiplier.toFixed(2)}x</Label>
                <Slider
                  value={[offpeakMultiplier]}
                  onValueChange={(value) => setOffpeakMultiplier(value[0])}
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Off-peak hours cost {offpeakMultiplier.toFixed(2)}× the base price
                </p>
              </div>
            </div>
          </>
        )}

        {/* Dynamic Configuration */}
        {strategyType === StrategyType.DYNAMIC && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Price Multiplier: {minMultiplier.toFixed(2)}x</Label>
                <Slider
                  value={[minMultiplier]}
                  onValueChange={(value) => setMinMultiplier(value[0])}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Price at lowest system load
                </p>
              </div>

              <div className="space-y-2">
                <Label>Maximum Price Multiplier: {maxMultiplier.toFixed(2)}x</Label>
                <Slider
                  value={[maxMultiplier]}
                  onValueChange={(value) => setMaxMultiplier(value[0])}
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Price at highest system load
                </p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Price scales linearly between {minMultiplier.toFixed(2)}× and {maxMultiplier.toFixed(2)}× based on system load
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          className="w-full"
          disabled={isExecuting}
        >
          {isExecuting ? "Executing..." : "Execute Strategy"}
        </Button>
      </CardContent>
    </Card>
  );
}