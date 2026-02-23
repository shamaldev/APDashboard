/**
 * TopVendorExposureCard Component
 * Displays concentration risk by outstanding value for top vendors
 */

import { Building2 } from 'lucide-react'

/** Interpolate between Novigo indigo shades based on rank */
const barColor = (idx, total) => {
  const ratio = total > 1 ? idx / (total - 1) : 0
  const r = Math.round(0x2B + (0x8B - 0x2B) * ratio)
  const g = Math.round(0x25 + (0x87 - 0x25) * ratio)
  const b = Math.round(0x70 + (0xB8 - 0x70) * ratio)
  return `rgb(${r},${g},${b})`
}

const TopVendorExposureCard = ({
  vendors = [],
  title = 'Top Vendor Exposure',
  subtitle = 'Concentration risk by outstanding value',
}) => {
  const maxValue = vendors.length > 0
    ? Math.max(...vendors.map(v => v.value || 0))
    : 0

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-medium text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {vendors.length > 0 && (
          <span className="px-2 py-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">
            Top {Math.min(vendors.length, 5)}
          </span>
        )}
      </div>

      {/* Vendor List */}
      <div className="p-4">
        {vendors.length > 0 ? (
          <div className="space-y-1">
            {vendors.slice(0, 5).map((vendor, idx) => {
              const pct = maxValue > 0 ? (vendor.value / maxValue) * 100 : 0
              const color = barColor(idx, Math.min(vendors.length, 5))
              const isTop = idx === 0

              return (
                <div
                  key={idx}
                  className={`group rounded-lg px-3 py-2.5 transition-colors ${isTop ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}
                >
                  {/* Vendor row */}
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-bold text-slate-300 w-3 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <Building2 size={13} className="shrink-0 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-700 truncate">
                        {vendor.name}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-slate-800">
                        {vendor.formatted_value}
                      </span>
                      {vendor.percentage && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {vendor.percentage}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="ml-[22px]">
                    <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-slate-400">
            No vendor data available
          </div>
        )}
      </div>
    </div>
  )
}

export default TopVendorExposureCard
