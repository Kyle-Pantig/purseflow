"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Re-export all recharts components
export * from "recharts"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/10 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      {children}
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).reduce(
    (acc, [key, item]) => {
      if (typeof item === "object" && item.color) {
        acc[`--color-${key}`] = item.color
      }
      return acc
    },
    {} as Record<string, string>
  )

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
:root {
  ${Object.entries(colorConfig)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n")}
}

[data-chart="${id}"] {
  ${Object.entries(colorConfig)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n")}
}
        `,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

interface ChartTooltipContentProps extends React.ComponentProps<"div"> {
  active?: boolean
  payload?: Array<{
    value: unknown
    name: string
    color: string
    dataKey?: string
    payload: Record<string, unknown>
  }>
  label?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  labelFormatter?: (value: string, payload: Array<{ value: unknown; name: string; color: string; dataKey?: string; payload: Record<string, unknown> }>) => string
  formatter?: (value: unknown, name: string, item: { value: unknown; name: string; color: string; dataKey?: string; payload: Record<string, unknown> }, index: number, payload: Array<{ value: unknown; name: string; color: string; dataKey?: string; payload: Record<string, unknown> }>) => React.ReactNode
  color?: string
  labelClassName?: string
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const value =
        typeof labelFormatter === "function"
          ? labelFormatter(label || '', payload)
          : label

      if (nameKey && typeof item.payload?.[nameKey] !== "undefined") {
        return {
          [nameKey]: String(item.payload[nameKey]),
          [key]: value,
        }
      }

      return { [key]: value }
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelKey,
      nameKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const [item] = payload

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!hideLabel && tooltipLabel && (
          <div className={cn("font-medium", labelClassName)}>
            {Object.entries(tooltipLabel).map(([key, value]) => (
              <div key={key}>
                {typeof value === "function" ? String((value as (payload: Record<string, unknown>) => unknown)(item.payload)) : String(value)}
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item: { value: unknown; name: string; color: string; dataKey?: string; payload: Record<string, unknown> }, index: number) => (
            <div
              key={item.dataKey || item.name || index}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent":
                            indicator === "dashed",
                        }
                      )}
                      style={
                        {
                          "--color-bg": color || item.payload?.fill || item.color,
                          "--color-border": color || item.payload?.fill || item.color,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      hideIndicator ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {item.name && (
                            <div className="text-muted-foreground">
                              {item.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.value !== undefined && item.value !== null && (
                      <div className="font-mono font-medium tabular-nums text-foreground">
                        {String(item.value)}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | {
        color?: string
        theme?: never
      }
    | {
        color?: never
        theme: Record<string, string>
      }
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
}
