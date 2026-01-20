import React from 'react'
import { StrategyScore, StrategyType } from '../types'

interface ValueBarsProps {
  items: StrategyScore[]
  selected: StrategyType
}

const ValueBars: React.FC<ValueBarsProps> = ({ items, selected }) => {
  const maxValue = Math.max(...items.map((item) => item.score), 1)

  return (
    <div className="card">
      <div className="card-title">Competing Value Bars (Risk-Adjusted)</div>
      <div className="value-bars">
        {items.map((item) => {
          const width = (item.score / maxValue) * 100
          return (
            <div
              key={item.type}
              className={`value-bar ${
                selected === item.type ? 'value-bar-active' : ''
              }`}
            >
              <div className="value-bar-label">{item.label}</div>
              <div className="value-bar-track">
                <div
                  className="value-bar-fill"
                  style={{ width: `${width}%` }}
                />
              </div>
              <div className="value-bar-meta">
                <span className="value-bar-score">{item.score.toFixed(1)}</span>
                <span className="value-bar-detail">{item.detail}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ValueBars
