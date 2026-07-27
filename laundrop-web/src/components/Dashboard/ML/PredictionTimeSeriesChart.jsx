import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import './PredictionTimeSeriesChart.css';

export default function PredictionTimeSeriesChart({
  title,
  subtitle,
  data = [],
  lines = [],
  yTickFormatter,
  tooltipFormatter,
  defaultChartType = 'line',
}) {
  const [chartType, setChartType] = useState(defaultChartType);

  const renderSeries = () => {
    if (chartType === 'bar') {
      return lines.map((line) => (
        <Bar
          key={line.dataKey}
          dataKey={line.dataKey}
          name={line.name}
          fill={line.color}
          radius={[5, 5, 0, 0]}
          maxBarSize={20}
        />
      ));
    }

    if (chartType === 'area') {
      return lines.map((line) => (
        <Area
          key={line.dataKey}
          type="monotone"
          dataKey={line.dataKey}
          name={line.name}
          stroke={line.color}
          fill={line.color}
          fillOpacity={0.16}
          strokeWidth={line.strokeWidth || 2.5}
          dot={false}
          strokeDasharray={line.dashArray || undefined}
        />
      ));
    }

    return lines.map((line) => (
      <Line
        key={line.dataKey}
        type="monotone"
        dataKey={line.dataKey}
        name={line.name}
        stroke={line.color}
        strokeWidth={line.strokeWidth || 2.5}
        dot={false}
        strokeDasharray={line.dashArray || undefined}
      />
    ));
  };

  const ChartRoot = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className="ml-ts-card">
      <div className="ml-ts-header">
        <div>
          <h4 className="ml-ts-title">{title}</h4>
          <p className="ml-ts-subtitle">{subtitle}</p>
        </div>

        <div className="ml-ts-actions">
          <div className="ml-ts-toggle" role="group" aria-label="Toggle jenis chart">
            <button
              type="button"
              className={`ml-ts-toggle-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button
              type="button"
              className={`ml-ts-toggle-btn ${chartType === 'area' ? 'active' : ''}`}
              onClick={() => setChartType('area')}
            >
              Area
            </button>
            <button
              type="button"
              className={`ml-ts-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      <div className="ml-ts-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ChartRoot data={data} margin={{ top: 8, right: 12, left: -14, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={tooltipFormatter}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b' }} />

            {renderSeries()}
          </ChartRoot>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
