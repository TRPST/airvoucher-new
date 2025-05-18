"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { BarChart } from "lucide-react";

import { cn } from "@/utils/cn";

// Variant definitions using CVA
const chartPlaceholderVariants = cva(
  "rounded-lg border border-border bg-card p-6 shadow-sm transition-all animate-fade-in",
  {
    variants: {
      height: {
        sm: "h-[150px]",
        md: "h-[250px]",
        lg: "h-[350px]",
      },
    },
    defaultVariants: {
      height: "md",
    },
  }
);

export interface ChartPlaceholderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chartPlaceholderVariants> {
  title: string;
  description?: string;
  data?: Array<Record<string, any>>;
  dataKey?: string;
  labelKey?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function ChartPlaceholder({
  className,
  height,
  title,
  description = "Chart goes here",
  data,
  dataKey = "value",
  labelKey = "label",
  valuePrefix = "",
  valueSuffix = "",
  ...props
}: ChartPlaceholderProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const hasData = data && data.length > 0;

  // Calculate max value for scaling
  const maxValue = React.useMemo(() => {
    if (!hasData || !dataKey) return 0;
    return Math.max(...data.map((item) => Number(item[dataKey]) || 0));
  }, [data, dataKey, hasData]);

  // Format values for display
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${valuePrefix}${(value / 1000000).toFixed(1)}M${valueSuffix}`;
    } else if (value >= 1000) {
      return `${valuePrefix}${(value / 1000).toFixed(1)}K${valueSuffix}`;
    }
    return `${valuePrefix}${value.toFixed(2)}${valueSuffix}`;
  };

  return (
    <div
      className={cn(chartPlaceholderVariants({ height, className }))}
      {...props}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
      </div>

      {!hasData ? (
        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
          <BarChart className="mb-3 h-12 w-12 opacity-20" />
          <p className="max-w-[160px] text-center text-sm opacity-70">
            {description}
          </p>
        </div>
      ) : (
        <div className="h-[calc(100%-40px)] w-full">
          <div className="flex h-full w-full items-end justify-between gap-1">
            {data.map((item, index) => {
              const value = Number(item[dataKey]) || 0;
              const percentage = maxValue ? (value / maxValue) * 100 : 0;
              const label = item[labelKey] || `Item ${index + 1}`;

              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="flex w-full flex-col items-center">
                    <div
                      className="w-8 bg-primary/80 rounded-t-sm hover:bg-primary transition-colors"
                      style={{ height: `${Math.max(5, percentage)}%` }}
                      title={`${label}: ${formatValue(value)}`}
                    />
                  </div>
                  <div className="mt-2 w-16 truncate text-center text-xs text-muted-foreground">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
