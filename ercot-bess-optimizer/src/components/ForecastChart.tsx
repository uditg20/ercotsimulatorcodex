import React from 'react'
import {
  Area,
  AreaChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ForecastPoint } from '../types'

interface ForecastChartProps {
  data: ForecastPoint[]
  showScarcity: boolean
  scarcityWindow: { start: number; end: number }
}

const formatHour = (hour: number) => {
  const h = Math.floor(hour) % 24
  const m = Math.round((hour - Math.floor(hour)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  showScarcity,
  scarcityWindow,
}) => {
  return (
    <div className="card chart-card">
      <div className="card-title">Prediction + Uncertainty</div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={40} />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? value.toFixed(1) : `${value ?? ''}`,
                String(name),
              ]}
              labelFormatter={(label) => `Hour ${formatHour(Number(label))}`}
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #1f2937',
              }}
            />
            {showScarcity ? (
              <ReferenceArea
                x1={scarcityWindow.start}
                x2={scarcityWindow.end}
                fill="#f97316"
                fillOpacity={0.08}
                strokeOpacity={0}
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="lower"
              stackId="1"
              stroke="none"
              fill="transparent"
            />
            <Area
              type="monotone"
              dataKey="band"
              stackId="1"
              stroke="none"
              fill="url(#confidenceBand)"
            />
            <Line
              type="monotone"
              dataKey="da"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="DA"
            />
            <Line
              type="monotone"
              dataKey="rt"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="RT"
            />
            <Line
              type="monotone"
              dataKey="rtForecast"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="RT Forecast"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot legend-da" />
          DA Energy
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-rt" />
          RT Energy
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-forecast" />
          Forecast + Band
        </span>
        {showScarcity ? (
          <span className="legend-item">
            <span className="legend-dot legend-scarcity" />
            Scarcity Window
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default ForecastChart
