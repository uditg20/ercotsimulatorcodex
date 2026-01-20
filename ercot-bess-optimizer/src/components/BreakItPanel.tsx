import React from 'react'

interface BreakItPanelProps {
  ignoreConfidence: boolean
  alwaysChaseSpread: boolean
  neverHoldScarcity: boolean
  cycleDrag: number
  pnlDrag: number
  drawdownRisk: number
}

const BreakItPanel: React.FC<BreakItPanelProps> = ({
  ignoreConfidence,
  alwaysChaseSpread,
  neverHoldScarcity,
  cycleDrag,
  pnlDrag,
  drawdownRisk,
}) => {
  const anyBreak = ignoreConfidence || alwaysChaseSpread || neverHoldScarcity

  return (
    <div className={`card break-card ${anyBreak ? 'break-card-active' : ''}`}>
      <div className="card-title">Break It (Failure Modes)</div>
      <div className="break-status">
        {anyBreak ? 'Failure mode engaged' : 'Governance intact'}
      </div>
      <div className="break-metrics">
        <div className="break-row">
          <span>Cycle Depletion</span>
          <span>{cycleDrag.toFixed(0)}%</span>
        </div>
        <div className="break-row">
          <span>Risk-Adjusted P&L</span>
          <span>{pnlDrag.toFixed(0)}%</span>
        </div>
        <div className="break-row">
          <span>Drawdown Risk</span>
          <span>{drawdownRisk.toFixed(0)}%</span>
        </div>
      </div>
      {anyBreak ? (
        <div className="break-postmortem">
          Post-mortem: this is how merchant batteries get destroyed.
        </div>
      ) : (
        <div className="break-postmortem neutral">
          Discipline preserves optionality and cycle life.
        </div>
      )}
    </div>
  )
}

export default BreakItPanel
