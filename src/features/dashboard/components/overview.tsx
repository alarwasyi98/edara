import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const data = [
  { name: 'Jul', lunas: 25000000, menunggak: 3500000 },
  { name: 'Ags', lunas: 28000000, menunggak: 4100000 },
  { name: 'Sep', lunas: 32000000, menunggak: 3200000 },
  { name: 'Okt', lunas: 26000000, menunggak: 3800000 },
  { name: 'Nov', lunas: 28500000, menunggak: 3000000 },
  { name: 'Des', lunas: 31000000, menunggak: 3700000 },
  { name: 'Jan', lunas: 38000000, menunggak: 4300000 },
  { name: 'Feb', lunas: 35000000, menunggak: 3600000 },
  { name: 'Mar', lunas: 31400000, menunggak: 5000000 },
  { name: 'Apr', lunas: 30200000, menunggak: 3000000 },
  { name: 'Mei', lunas: 34800000, menunggak: 3000000 },
  { name: 'Jun', lunas: 38200000, menunggak: 3000000 },
]

const chartConfig = {
  lunas: {
    label: 'Lunas',
    color: 'var(--chart-1)',
  },
  menunggak: {
    label: 'Menunggak',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}jt`
  if (value >= 1_000) return `${value / 1_000}rb`
  return `${value}`
}

export function SppCollectionChart({ timeRange = '12' }: { timeRange?: string }) {
  const range = parseInt(timeRange, 10) || 12
  const filteredData = data.slice(-range)

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillLunas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-lunas)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-lunas)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillMenunggak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-menunggak)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-menunggak)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatAxisValue}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="menunggak"
          stackId="1"
          stroke="var(--color-menunggak)"
          fill="url(#fillMenunggak)"
        />
        <Area
          type="monotone"
          dataKey="lunas"
          stackId="1"
          stroke="var(--color-lunas)"
          fill="url(#fillLunas)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
