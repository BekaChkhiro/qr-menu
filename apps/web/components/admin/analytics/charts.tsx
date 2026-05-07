'use client';

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ViewsLineChartDatum {
  date: string;
  views: number;
}

export function ViewsLineChart({ data }: { data: ViewsLineChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface BrowserBarChartDatum {
  browser: string;
  count: number;
}

export function BrowserBarChart({
  data,
  colors,
}: {
  data: BrowserBarChartDatum[];
  colors: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          className="stroke-muted"
        />
        <XAxis
          type="number"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          type="category"
          dataKey="browser"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value) => [`${value}`, 'Views']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
