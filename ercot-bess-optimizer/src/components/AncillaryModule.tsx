import React from 'react'

interface AncillaryModuleProps {
  ancillaryPriceLevel: number
  asHeadroom: number
  rampSpeed: number
  selected: boolean
  rtcMode: boolean
}

const AncillaryModule: React.FC<AncillaryModuleProps> = ({
  ancillaryPriceLevel,
  asHeadroom,
  rampSpeed,
  selected,
  rtcMode,
}) => {
  return (
    <div className="card module-card">
      <div className="card-title">Ancillary Services (ERCOT)</div>
      <p className="module-callout">
        Ancillaries pay for speed and availability; SOC headroom is the ticket.
      </p>
      <div className="as-services">
        <span>Reg Up</span>
        <span>Reg Down</span>
        <span>RRS</span>
        <span>ECRS</span>
        <span>Non-Spin</span>
      </div>
      <div className={`freq-animation ${selected ? 'active' : ''}`}>
        <div className="freq-line" />
        <div className="freq-dot" />
      </div>
      <div className="module-note">
        {rtcMode
          ? 'RTC+B: energy + AS co-optimized; SOC feasibility binds continuously.'
          : 'Pre-RTC+B: simplified scheduling, fewer co-optimization constraints.'}
      </div>
      <div className="module-row">
        <span>AS Price Level</span>
        <span>{ancillaryPriceLevel.toFixed(0)}</span>
      </div>
      <div className="module-row">
        <span>Headroom</span>
        <span>{Math.round(asHeadroom * 100)}%</span>
      </div>
      <div className="module-row">
        <span>Response Speed</span>
        <span>{Math.round(rampSpeed)}%</span>
      </div>
    </div>
  )
}

export default AncillaryModule
