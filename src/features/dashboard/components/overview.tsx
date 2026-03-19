import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { formatRupiah } from '@/lib/format'

const data = [
  { name: 'Jul', total: 28500000 },
  { name: 'Ags', total: 32100000 },
  { name: 'Sep', total: 35200000 },
  { name: 'Okt', total: 29800000 },
  { name: 'Nov', total: 31500000 },
  { name: 'Des', total: 34700000 },
  { name: 'Jan', total: 42300000 },
  { name: 'Feb', total: 38600000 },
  { name: 'Mar', total: 36400000 },
  { name: 'Apr', total: 33200000 },
  { name: 'Mei', total: 37800000 },
  { name: 'Jun', total: 41200000 },
]

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}jt`
  if (value >= 1_000) return `${value / 1_000}rb`
  return `${value}`
}

export function SppCollectionChart({ timeRange = '12' }: { timeRange?: string }) {
  const range = parseInt(timeRange, 10) || 12
  const filteredData = data.slice(-range)

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={filteredData}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction='ltr'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatAxisValue}
        />
        <Tooltip
          formatter={(value: number) => formatRupiah(value)}
          cursor={{ fill: 'rgba(0,0,0,0.1)' }}
        />
        <Bar
          dataKey='total'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
