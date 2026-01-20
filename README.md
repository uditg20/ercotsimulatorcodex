# ERCOT Merchant BESS Optimization Simulator

This repository contains a single-page, executive-focused simulator that
teaches how merchant battery optimizers in ERCOT turn forecast signals into
bids, dispatch, and P&L using energy, ancillary services, virtuals, and
scarcity optionality.

## Quick start

```bash
cd ercot-bess-optimizer
npm install
npm run dev
```

## What it covers

- DA vs RT energy, DA virtuals, and ERCOT ancillary services
- Forecast confidence and regime-shift behavior
- Cycle budget and degradation as the true cost of dispatch
- RTC+B co-optimization intuition and SOC feasibility