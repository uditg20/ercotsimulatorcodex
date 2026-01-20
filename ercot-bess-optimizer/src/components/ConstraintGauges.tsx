import React from 'react'

interface ConstraintGaugesProps {
  soc: number
  minSoc: number
  maxSoc: number
  reservedSoc: number
  protectScarcity: boolean
  cycleBudgetDaily: number
  cycleBudgetAnnual: number
  maxDailyCycles: number
  maxAnnualCycles: number
  asHeadroom: number
  virtualMw: number
  maxVirtualMw: number
}

const ConstraintGauges: React.FC<ConstraintGaugesProps> = ({
  soc,
  minSoc,
  maxSoc,
  reservedSoc,
  protectScarcity,
  cycleBudgetDaily,
  cycleBudgetAnnual,
  maxDailyCycles,
  maxAnnualCycles,
  asHeadroom,
  virtualMw,
  maxVirtualMw,
}) => {
  const dailyRatio = Math.max(
    0,
    Math.min(1, cycleBudgetDaily / Math.max(maxDailyCycles, 0.1))
  )
  const annualRatio = Math.max(
    0,
    Math.min(1, cycleBudgetAnnual / Math.max(maxAnnualCycles, 1))
  )
  const virtualRatio = Math.max(
    0,
    Math.min(1, virtualMw / Math.max(maxVirtualMw, 1))
  )

  return (
    <div className="card">
      <div className="card-title">Constraint Gauges</div>
      <div className="gauge">
        <div className="gauge-header">
          <span>SOC</span>
          <span>{soc.toFixed(0)}%</span>
        </div>
        <div className="gauge-bar">
          <div
            className="gauge-range"
            style={{
              left: `${minSoc}%`,
              width: `${Math.max(maxSoc - minSoc, 0)}%`,
            }}
          />
          {protectScarcity ? (
            <div
              className="gauge-reserved"
              style={{ width: `${reservedSoc}%` }}
            />
          ) : null}
          <div className="gauge-fill" style={{ width: `${soc}%` }} />
        </div>
        <div className="gauge-meta">
          Min {minSoc}% / Max {maxSoc}%{' '}
          {protectScarcity ? `Reserved ${reservedSoc}%` : ''}
        </div>
      </div>

      <div className="gauge">
        <div className="gauge-header">
          <span>Cycle Budget Remaining</span>
          <span>
            {cycleBudgetDaily.toFixed(2)} daily / {cycleBudgetAnnual.toFixed(0)}{' '}
            annual
          </span>
        </div>
        <div className="gauge-bar">
          <div className="gauge-fill" style={{ width: `${dailyRatio * 100}%` }} />
        </div>
        <div className="gauge-secondary">
          <div
            className="gauge-secondary-fill"
            style={{ width: `${annualRatio * 100}%` }}
          />
        </div>
      </div>

      <div className="gauge">
        <div className="gauge-header">
          <span>AS Commitment Headroom</span>
          <span>{Math.round(asHeadroom * 100)}%</span>
        </div>
        <div className="gauge-bar">
          <div
            className="gauge-fill gauge-fill-accent"
            style={{ width: `${asHeadroom * 100}%` }}
          />
        </div>
      </div>

      <div className="gauge">
        <div className="gauge-header">
          <span>Virtual Exposure</span>
          <span>{virtualMw.toFixed(0)} MW</span>
        </div>
        <div className="gauge-bar">
          <div
            className="gauge-fill gauge-fill-virtual"
            style={{ width: `${virtualRatio * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default ConstraintGauges
