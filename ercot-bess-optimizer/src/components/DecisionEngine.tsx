import React from 'react'
import { motion } from 'framer-motion'
import { ActionType, StrategyScore, StrategyType } from '../types'

interface DecisionEngineProps {
  bestAction: ActionType
  bestStrategy: StrategyType
  topTwo: StrategyScore[]
  confidenceLabel: string
  traceNote: string
  rtcMode: boolean
}

const actionIcons: Record<ActionType, string> = {
  Charge: '[CHG]',
  Discharge: '[DIS]',
  'Provide Ancillary': '[AS]',
  'DA Virtual': '[VIRT]',
  'Hold SOC': '[HOLD]',
}

const DecisionEngine: React.FC<DecisionEngineProps> = ({
  bestAction,
  bestStrategy,
  topTwo,
  confidenceLabel,
  traceNote,
  rtcMode,
}) => {
  return (
    <div className="card decision-card">
      <div className="decision-header">
        <div className="card-title">Best Risk-Adjusted Action Right Now</div>
        <div className="decision-meta">
          <span>Confidence: {confidenceLabel}</span>
          <span>{rtcMode ? 'RTC+B co-optimized' : 'Pre-RTC+B simplified'}</span>
        </div>
      </div>
      <motion.div
        className="decision-action"
        key={bestAction}
        initial={{ opacity: 0.4, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="decision-icon">{actionIcons[bestAction]}</span>
        <div className="decision-text">
          <span className="decision-action-label">{bestAction}</span>
          <span className="decision-action-subtitle">
            Strategy: {bestStrategy}
          </span>
        </div>
      </motion.div>
      <div className="decision-trace">
        <div className="trace-title">Decision Trace</div>
        {topTwo.map((item, index) => (
          <div key={item.type} className="trace-row">
            <span className="trace-rank">{index + 1}</span>
            <span className="trace-label">{item.label}</span>
            <span className="trace-score">{item.score.toFixed(1)}</span>
          </div>
        ))}
        <div className="trace-note">{traceNote}</div>
      </div>
    </div>
  )
}

export default DecisionEngine
