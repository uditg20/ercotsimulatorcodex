import React from 'react'
import type { DecisionRationale } from '../types'

interface RationalePanelProps {
  rationale: DecisionRationale
}

const RationalePanel: React.FC<RationalePanelProps> = ({ rationale }) => {
  return (
    <div className="card rationale-card">
      <div className="card-title">Why This Action</div>
      <div className="rationale-item">
        <span className="rationale-label">Signal</span>
        <p>{rationale.signal}</p>
      </div>
      <div className="rationale-item">
        <span className="rationale-label">Constraint</span>
        <p>{rationale.constraint}</p>
      </div>
      <div className="rationale-item">
        <span className="rationale-label">Risk Avoided</span>
        <p>{rationale.risk}</p>
      </div>
      <div className="rationale-item">
        <span className="rationale-label">Rejected Alternative</span>
        <p>{rationale.alternative}</p>
      </div>
    </div>
  )
}

export default RationalePanel
