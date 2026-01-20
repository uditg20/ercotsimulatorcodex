import React from 'react'

interface PnLAttributionProps {
  energy: number
  ancillary: number
  virtual: number
  degradation: number
  forecastError: number
}

const formatValue = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(0)}`

const PnLAttribution: React.FC<PnLAttributionProps> = ({
  energy,
  ancillary,
  virtual,
  degradation,
  forecastError,
}) => {
  const total = energy + ancillary + virtual + degradation + forecastError

  return (
    <div className="card pnl-card">
      <div className="card-title">P&L Attribution (Executive View)</div>
      <div className="pnl-row">
        <span>Energy P&L</span>
        <span>{formatValue(energy)}</span>
      </div>
      <div className="pnl-row">
        <span>AS P&L</span>
        <span>{formatValue(ancillary)}</span>
      </div>
      <div className="pnl-row">
        <span>Virtual P&L</span>
        <span>{formatValue(virtual)}</span>
      </div>
      <div className="pnl-row pnl-negative">
        <span>Degradation Cost</span>
        <span>{formatValue(degradation)}</span>
      </div>
      <div className="pnl-row pnl-negative">
        <span>Forecast Error Impact</span>
        <span>{formatValue(forecastError)}</span>
      </div>
      <div className="pnl-total">
        <span>Total</span>
        <span>{formatValue(total)}</span>
      </div>
    </div>
  )
}

export default PnLAttribution
