'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Eye,
  TrendingUp,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenuAnalytics, type AnalyticsFilters } from '@/hooks/use-analytics';

interface AnalyticsContentProps {
  menuId: string;
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#3b82f6',
  mobile: '#10b981',
  tablet: '#f59e0b',
  Unknown: '#6b7280',
};

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  Unknown: Globe,
};

const BROWSER_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export function AnalyticsContent({ menuId }: AnalyticsContentProps) {
  const [period, setPeriod] = useState<AnalyticsFilters['period']>('30d');
  const t = useTranslations('admin');

  const { data: analytics, isLoading } = useMenuAnalytics(menuId, { period });

  if (isLoading) {
    return <AnalyticsContentSkeleton />;
  }

  const overview = analytics?.overview || {
    totalViews: 0,
    viewsToday: 0,
    viewsThisWeek: 0,
    viewsThisMonth: 0,
    averageDaily: 0,
  };

  const dailyViews = analytics?.dailyViews || [];
  const deviceBreakdown = analytics?.deviceBreakdown || [];
  const browserBreakdown = analytics?.browserBreakdown || [];

  const chartData = dailyViews.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    views: item.views,
  }));

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select
          value={period}
          onValueChange={(value) =>
            setPeriod(value as AnalyticsFilters['period'])
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t('analytics.periods.7d')}</SelectItem>
            <SelectItem value="30d">{t('analytics.periods.30d')}</SelectItem>
            <SelectItem value="90d">{t('analytics.periods.90d')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('analytics.totalViews')}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.allTime')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('analytics.viewsToday')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.viewsToday.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.today')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('analytics.viewsThisWeek')}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.viewsThisWeek.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.thisWeek')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('analytics.averageDaily')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageDaily}</div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.perDay')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.viewsOverTime')}</CardTitle>
          <CardDescription>
            {analytics?.period
              ? `${analytics.period.start} - ${analytics.period.end}`
              : t('analytics.selectPeriod')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('analytics.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.deviceBreakdown')}</CardTitle>
            <CardDescription>{t('analytics.deviceDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length > 0 ? (
              <div className="space-y-4">
                {deviceBreakdown.map((item) => {
                  const Icon = DEVICE_ICONS[item.device] || Globe;
                  const color = DEVICE_COLORS[item.device] || '#6b7280';
                  return (
                    <div key={item.device} className="flex items-center gap-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {item.device}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                {t('analytics.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.browserBreakdown')}</CardTitle>
            <CardDescription>{t('analytics.browserDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {browserBreakdown.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={browserBreakdown.slice(0, 5)}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
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
                      {browserBreakdown.slice(0, 5).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BROWSER_COLORS[index % BROWSER_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                {t('analytics.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
