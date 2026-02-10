/**
 * Dashboard Constants
 * Colors, thresholds, and configuration
 */

export const CHART_COLORS = [
  '#b4862e', '#059669', '#2563eb', '#dc2626', '#7c3aed',
  '#0891b2', '#c2410c', '#4f46e5', '#be185d', '#065f46'
]

export const STATUS_COLORS = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    indicator: 'bg-emerald-500',
    gradient: 'from-emerald-50 to-white'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    indicator: 'bg-amber-500',
    gradient: 'from-amber-50 to-white'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    indicator: 'bg-red-500',
    gradient: 'from-red-50 to-white'
  }
}

export const KPI_THRESHOLDS = {
  total_ap_outstanding: {
    getStatus: (value, comparison) => {
      const changePercent = Math.abs(parseFloat(comparison) || 0)
      if (changePercent <= 5) return 'green'
      if (changePercent <= 10) return 'amber'
      return 'red'
    }
  },
  days_payable_outstanding: {
    getStatus: (value) => {
      const days = parseFloat(value) || 0
      if (days >= 45 && days <= 55) return 'green'
      if (days >= 40 && days <= 60) return 'amber'
      return 'red'
    }
  },
  dpo: {
    getStatus: (value) => {
      const days = parseFloat(value) || 0
      if (days >= 45 && days <= 55) return 'green'
      if (days >= 40 && days <= 60) return 'amber'
      return 'red'
    }
  },
  cash_outflow: {
    getStatus: (value, comparison) => {
      const variance = Math.abs(parseFloat(comparison) || 0)
      if (variance <= 5) return 'green'
      if (variance <= 10) return 'amber'
      return 'red'
    }
  },
  overdue_payables: {
    getStatus: (value, comparison, rawValue, totalAP) => {
      const percent = totalAP ? (rawValue / totalAP) * 100 : parseFloat(comparison) || 0
      if (percent < 3) return 'green'
      if (percent <= 5) return 'amber'
      return 'red'
    }
  },
  stp_rate: {
    getStatus: (value) => {
      const rate = parseFloat(value) || 0
      if (rate >= 70) return 'green'
      if (rate >= 65) return 'amber'
      return 'red'
    }
  },
  straight_through_processing: {
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || 0
      if (rate >= 70) return 'green'
      if (rate >= 65) return 'amber'
      return 'red'
    }
  },
  discount_captured: {
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || parseFloat(value) || 0
      if (rate >= 95) return 'green'
      if (rate >= 90) return 'amber'
      return 'red'
    }
  },
  first_time_match: {
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || parseFloat(value) || 0
      if (rate >= 85) return 'green'
      if (rate >= 80) return 'amber'
      return 'red'
    }
  },
  exception_rate: {
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || parseFloat(value) || 0
      if (rate <= 15) return 'green'
      if (rate <= 20) return 'amber'
      return 'red'
    }
  },
  cost_per_invoice: {
    getStatus: (value) => {
      const cost = parseFloat(value) || 0
      if (cost <= 100) return 'green'
      if (cost <= 115) return 'amber'
      return 'red'
    }
  },
  aging_90_days: {
    getStatus: (value, comparison) => {
      const percent = parseFloat(comparison) || parseFloat(value) || 0
      if (percent < 3) return 'green'
      if (percent <= 5) return 'amber'
      return 'red'
    }
  }
}

export const AGING_COLORS = [
  'bg-gradient-to-t from-emerald-600 to-emerald-200',
  'bg-gradient-to-t from-blue-600 to-blue-200',
  'bg-gradient-to-t from-amber-600 to-amber-200',
  'bg-gradient-to-t from-red-500 to-red-200',
  'bg-gradient-to-t from-red-700 to-red-400',
  'bg-gradient-to-t from-slate-500 to-slate-300'
]
