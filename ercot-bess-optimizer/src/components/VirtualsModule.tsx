import React from 'react'
import type { VirtualDirection } from '../types'

interface VirtualsModuleProps {
  virtualDirection: VirtualDirection
  expectedValue: number
  riskHaircut: number
  virtualMw: number
  maxVirtualMw: number
  useVirtualsToPreserveBatteryLife: boolean
}

const VirtualsModule: React.FC<VirtualsModuleProps> = ({
  virtualDirection,
  expectedValue,
  riskHaircut,
  virtualMw,
  maxVirtualMw,
  useVirtualsToPreserveBatteryLife,
}) => {
  const exposureRatio = Math.min(1, virtualMw / Math.max(maxVirtualMw, 1))

  return (
    <div className="card module-card">
      <div className="card-title">DA Virtuals Module</div>
      <p className="module-callout">
        Virtuals monetize DA-RT mispricing without cycling the battery.
      </p>
      <div className="module-row">
        <span>Direction</span>
        <span>{virtualDirection}</span>
      </div>
      <div className="module-note">
        {virtualDirection === 'INC-like'
          ? 'INC-like: buy DA, sell RT.'
          : 'DEC-like: sell DA, buy RT.'}
      </div>
      <div className="module-row">
        <span>Exposure</span>
        <span>
          {virtualMw.toFixed(0)} MW / {maxVirtualMw.toFixed(0)} MW
        </span>
      </div>
      <div className="module-row">
        <span>Expected Value</span>
        <span>{expectedValue.toFixed(1)}</span>
      </div>
      <div className="module-row">
        <span>Confidence Haircut</span>
        <span>{riskHaircut.toFixed(0)}%</span>
      </div>
      <div className="module-bar">
        <div className="module-bar-fill" style={{ width: `${exposureRatio * 100}%` }} />
      </div>
      <div className="module-note">
        {useVirtualsToPreserveBatteryLife
          ? 'Preserves cycle budget when enabled.'
          : 'Virtuals optionality disabled.'}
      </div>
    </div>
  )
}

export default VirtualsModule
