/**
 * TopVendorExposureCard Component
 * Displays concentration risk by outstanding value for top vendors
 */

import { Building2 } from 'lucide-react'

const TopVendorExposureCard = ({ vendors = [], title = 'Top Vendor Exposure', subtitle = 'Concentration risk by outstanding value' }) => {
  // Calculate max value for percentage bars
  const maxValue = vendors.length > 0
    ? Math.max(...vendors.map(v => v.value || 0))
    : 0

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-serif text-base font-medium text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="p-4 space-y-3">
        {vendors.length > 0 ? (
          vendors.slice(0, 5).map((vendor, idx) => {
            const percentage = maxValue > 0 ? (vendor.value / maxValue) * 100 : 0
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{vendor.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-sm font-semibold text-slate-900">{vendor.formatted_value}</span>
                    {vendor.percentage && (
                      <span className="text-xs text-slate-500 ml-1">{vendor.percentage}</span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-4 text-slate-400 text-sm">
            No vendor data available
          </div>
        )}
      </div>
    </div>
  )
}

export default TopVendorExposureCard
