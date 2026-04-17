'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartDataItem {
  name: string;
  fullName: string;
  total: number;
  isCurrent: boolean;
}

interface ExpenseChartProps {
  data: ChartDataItem[];
}

export default function ExpenseChart({ data }: ExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
          reversed
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v) => v > 0 ? `₪${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}` : ''}
          width={55}
        />
        <Tooltip
          cursor={{ fill: 'rgba(13, 148, 136, 0.06)', radius: 8 }}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', direction: 'rtl', textAlign: 'right' }}
          formatter={(value: number) => [`₪${value.toLocaleString()}`, 'סה״כ']}
          labelFormatter={(label) => {
            const item = data.find(d => d.name === label);
            return item?.fullName || label;
          }}
        />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isCurrent ? '#0d9488' : '#99f6e4'}
              opacity={entry.total === 0 ? 0.3 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
