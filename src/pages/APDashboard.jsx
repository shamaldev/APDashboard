import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, CreditCard, TrendingDown, TrendingUp, Minus, CheckCircle, FileText, AlertTriangle, DollarSign, Loader2, RefreshCw, AlertCircle, Plus, LogOut, MessageSquare, HelpCircle, Mic, MicOff } from 'lucide-react';
import { API_BASE_URL } from '../config/axios';

const Cookies = {
  get: (name) => { const value = `; ${document.cookie}`; const parts = value.split(`; ${name}=`); if (parts.length === 2) return parts.pop().split(';').shift(); return null; },
  remove: (name) => { document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`; }
};

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { return null; }
};

const getUserFromToken = () => {
  const token = Cookies.get('access_token');
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.user_id || decoded?.name || decoded?.username || decoded?.email || null;
};

const getAuthHeaders = () => { const token = Cookies.get('access_token'); return token ? { 'Authorization': `Bearer ${token}` } : {}; };
const handle401 = () => { Cookies.remove('access_token'); window.location.href = '/login'; };

const authFetch = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers };
  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  if (response.status === 401) { handle401(); throw new Error('Unauthorized'); }
  return response;
};

const ChartCanvas = ({ chartConfig, data, chartType, title }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 200;
    const w = canvas.width, h = canvas.height;
    const pad = { t: 25, r: 20, b: 45, l: 70 };
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title || chartConfig?.title || '', w / 2, 14);
    const xCol = chartConfig?.x_axis_col_name || Object.keys(data[0])[0];
    const yColArr = chartConfig?.y_axis_col_name || [];
    const yCol = Array.isArray(yColArr) ? yColArr[0] : yColArr || Object.keys(data[0]).find(k => typeof data[0][k] === 'number');
    if (chartType === 'horizontal_bar_chart') {
      const values = data.map(d => d[xCol] || d[yCol] || 0);
      const labels = data.map(d => d[yColArr[0]] || d[Object.keys(d)[0]] || '');
      const max = Math.max(...values) * 1.1 || 1;
      const barH = (h - pad.t - pad.b) / values.length * 0.8;
      const gap = (h - pad.t - pad.b) / values.length * 0.2;
      values.forEach((v, i) => {
        const y = pad.t + i * (barH + gap);
        const barW = (v / max) * (w - pad.l - pad.r);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fillRect(pad.l, y, barW, barH);
        ctx.fillStyle = '#64748b'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(String(labels[i]).substring(0, 20), pad.l - 5, y + barH / 2 + 3);
        ctx.textAlign = 'left';
        const valLabel = v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
        ctx.fillText(valLabel, pad.l + barW + 5, y + barH / 2 + 3);
      });
    } else if (chartType === 'line_chart') {
      const values = data.map(d => d[yCol] || 0);
      const labels = data.map(d => d[xCol] || '');
      const max = Math.max(...values) * 1.1 || 1;
      ctx.strokeStyle = COLORS[0]; ctx.lineWidth = 2; ctx.beginPath();
      values.forEach((v, i) => {
        const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r);
        const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = COLORS[0];
      values.forEach((v, i) => {
        const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r);
        const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b);
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#64748b'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      labels.forEach((l, i) => {
        if (i % Math.ceil(labels.length / 6) === 0) {
          const x = pad.l + (i / (labels.length - 1 || 1)) * (w - pad.l - pad.r);
          ctx.fillText(String(l).substring(0, 7), x, h - 5);
        }
      });
    } else if (chartType === 'stacked_bar_chart' || chartType === 'vertical_bar_chart') {
      const values = data.map(d => d[yCol] || d.total_spend || 0);
      const labels = data.map(d => d[xCol] || d.category || '');
      const max = Math.max(...values) * 1.1 || 1;
      const barW = (w - pad.l - pad.r) / values.length * 0.7;
      const gap = (w - pad.l - pad.r) / values.length * 0.3;
      values.forEach((v, i) => {
        const x = pad.l + i * (barW + gap) + gap / 2;
        const barH = (v / max) * (h - pad.t - pad.b);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fillRect(x, h - pad.b - barH, barW, barH);
      });
      ctx.fillStyle = '#64748b'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      labels.forEach((l, i) => {
        const x = pad.l + i * (barW + gap) + gap / 2 + barW / 2;
        ctx.save(); ctx.translate(x, h - 5); ctx.rotate(-Math.PI / 6);
        ctx.fillText(String(l).substring(0, 12), 0, 0); ctx.restore();
      });
    }
  }, [chartConfig, data, chartType, title]);
  return <canvas ref={canvasRef} className="w-full" />;
};

const COLORS = ['#b4862e', '#059669', '#2563eb', '#dc2626', '#7c3aed', '#0891b2', '#c2410c', '#4f46e5', '#be185d', '#065f46'];

// KPI Thresholds Configuration
const KPI_THRESHOLDS = {
  total_ap_outstanding: {
    // Green: Within plan, Amber: ±5-10% above, Red: >10% above
    getStatus: (value, comparison) => {
      const changePercent = Math.abs(parseFloat(comparison) || 0);
      if (changePercent <= 5) return 'green';
      if (changePercent <= 10) return 'amber';
      return 'red';
    }
  },
  days_payable_outstanding: {
    // Green: 45-55 days, Amber: ±3-5 days outside, Red: Material deviation
    getStatus: (value) => {
      const days = parseFloat(value) || 0;
      if (days >= 45 && days <= 55) return 'green';
      if (days >= 40 && days <= 60) return 'amber';
      return 'red';
    }
  },
  dpo: {
    getStatus: (value) => {
      const days = parseFloat(value) || 0;
      if (days >= 45 && days <= 55) return 'green';
      if (days >= 40 && days <= 60) return 'amber';
      return 'red';
    }
  },
  cash_outflow: {
    // Green: Within forecast, Amber: 5-10% variance, Red: >10%
    getStatus: (value, comparison) => {
      const variance = Math.abs(parseFloat(comparison) || 0);
      if (variance <= 5) return 'green';
      if (variance <= 10) return 'amber';
      return 'red';
    }
  },
  overdue_payables: {
    // Green: <2-3% of AP, Amber: 3-5%, Red: >5%
    getStatus: (value, comparison, rawValue, totalAP) => {
      const percent = totalAP ? (rawValue / totalAP) * 100 : parseFloat(comparison) || 0;
      if (percent < 3) return 'green';
      if (percent <= 5) return 'amber';
      return 'red';
    }
  },
  stp_rate: {
    // Green: ≥70%, Amber: 65-70%, Red: <65%
    getStatus: (value) => {
      const rate = parseFloat(value) || 0;
      if (rate >= 70) return 'green';
      if (rate >= 65) return 'amber';
      return 'red';
    }
  },
  straight_through_processing: {
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || 0;
      if (rate >= 70) return 'green';
      if (rate >= 65) return 'amber';
      return 'red';
    }
  },
  discount_captured: {
    // Green: ≥95%, Amber: 90-95%, Red: <90%
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || parseFloat(value) || 0;
      if (rate >= 95) return 'green';
      if (rate >= 90) return 'amber';
      return 'red';
    }
  },
  first_time_match: {
    // Green: ≥85%, Amber: 80-85%, Red: <80%
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || parseFloat(value) || 0;
      if (rate >= 85) return 'green';
      if (rate >= 80) return 'amber';
      return 'red';
    }
  },
  exception_rate: {
    // Green: ≤15%, Amber: 15-20%, Red: >20%
    getStatus: (value) => {
      const rate = parseFloat(value) * 100 || parseFloat(value) || 0;
      if (rate <= 15) return 'green';
      if (rate <= 20) return 'amber';
      return 'red';
    }
  },
  cost_per_invoice: {
    // Green: ≤$100, Amber: $100-115, Red: >$115
    getStatus: (value) => {
      const cost = parseFloat(value) || 0;
      if (cost <= 100) return 'green';
      if (cost <= 115) return 'amber';
      return 'red';
    }
  },
  aging_90_days: {
    // Green: <2-3% of AP, Amber: 3-5%, Red: >5%
    getStatus: (value, comparison) => {
      const percent = parseFloat(comparison) || parseFloat(value) || 0;
      if (percent < 3) return 'green';
      if (percent <= 5) return 'amber';
      return 'red';
    }
  }
};

// Get KPI status color based on thresholds
const getKPIStatus = (card) => {
  const cardId = card.id?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
  const value = card.value;
  const comparison = card.comparison_value;
  
  // Try to find matching threshold
  for (const [key, config] of Object.entries(KPI_THRESHOLDS)) {
    if (cardId.includes(key) || card.title?.toLowerCase().includes(key.replace(/_/g, ' '))) {
      return config.getStatus(value, comparison);
    }
  }
  
  // Fallback to original status logic
  if (card.status === 'success') return 'green';
  if (card.status === 'warning') return 'amber';
  if (card.status === 'error' || card.status === 'critical') return 'red';
  
  // Default based on comparison
  const change = parseFloat(comparison) || 0;
  if (Math.abs(change) <= 5) return 'green';
  if (Math.abs(change) <= 10) return 'amber';
  return 'red';
};

// Status color mappings
const STATUS_COLORS = {
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
};

// Helper to clean comparison label
const cleanComparisonLabel = (label) => {
  if (!label) return '';
  // Remove date patterns like (2025-12-01 00:00:00) or similar
  return label.replace(/\s*\(\d{4}-\d{2}-\d{2}[^)]*\)/g, '').trim();
};

const KPICard = ({ card, onClick }) => {
  const isPrimary = card.id === 'total_ap_outstanding';
  const kpiStatus = getKPIStatus(card);
  const colors = STATUS_COLORS[kpiStatus];
  const comparison = parseFloat(card.comparison_value) || 0;
  const isUp = card.status === 'up' || comparison > 0;
  const isDown = card.status === 'down' || comparison < 0;
  
  return (
    <div onClick={() => onClick(card)} className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-xl p-5 relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5`}>
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.indicator}`} />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
          <CreditCard size={12} />
          <span className="truncate">{card.title}</span>
        </div>
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`} title={`Status: ${kpiStatus}`} />
      </div>
      
      <div className={`font-serif font-semibold tracking-tight leading-tight mb-2 ${isPrimary ? 'text-3xl' : 'text-2xl'} ${colors.text}`}>
        {card.formatted_value}
      </div>
      
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
        {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
        {card.formatted_comparison}
      </span>
      
      <div className="text-[10px] text-slate-500 mt-2 truncate">{cleanComparisonLabel(card.comparison_label)}</div>
    </div>
  );
};

const ProactiveCard = ({ card }) => {
  const progress = Math.min(Math.max((card.value || 0) * 100, 0), 100);
  const Icon = card.title.includes('STP') ? CheckCircle : card.title.includes('Discount') ? DollarSign : FileText;
  
  // Determine status based on KPI thresholds
  let kpiStatus = 'amber';
  const titleLower = card.title?.toLowerCase() || '';
  const value = (card.value || 0) * 100;
  
  if (titleLower.includes('stp') || titleLower.includes('straight')) {
    kpiStatus = value >= 70 ? 'green' : value >= 65 ? 'amber' : 'red';
  } else if (titleLower.includes('discount')) {
    kpiStatus = value >= 95 ? 'green' : value >= 90 ? 'amber' : 'red';
  } else if (titleLower.includes('first') && titleLower.includes('match')) {
    kpiStatus = value >= 85 ? 'green' : value >= 80 ? 'amber' : 'red';
  } else if (titleLower.includes('exception')) {
    kpiStatus = value <= 15 ? 'green' : value <= 20 ? 'amber' : 'red';
  } else {
    // Fallback to original status
    kpiStatus = card.status === 'success' ? 'green' : card.status === 'warning' ? 'amber' : 'red';
  }
  
  const colors = STATUS_COLORS[kpiStatus];
  
  return (
    <div className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-lg p-4 transition-all duration-200 hover:shadow-md relative overflow-hidden`}>
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors.indicator}`} />
      
      <div className="flex justify-between items-start mb-2">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${colors.badge}`}>
          <Icon size={14} />
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${colors.indicator}`} />
          <div className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 text-right max-w-[50%] truncate">{card.title}</div>
        </div>
      </div>
      <div className={`font-serif text-xl font-semibold mb-0.5 ${colors.text}`}>{card.formatted_value}</div>
      <div className="text-[10px] text-slate-500 truncate">{card.target || card.detail_line_1}</div>
      <div className="h-1.5 bg-slate-200 rounded mt-2 overflow-hidden">
        <div className={`h-full rounded ${colors.indicator} transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

const AlertCard = ({ alert }) => {
  const severity = alert.structured_summary?.severity || 'MEDIUM';
  const isC = severity === 'CRITICAL';
  return (
    <div className={`flex gap-3 p-3 rounded-lg border-l-4 transition-all hover:shadow-sm ${isC ? 'bg-red-50/50 border-red-500' : 'bg-amber-50/50 border-amber-500'}`}>
      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isC ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{isC ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}</div>
      <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-900 truncate">{alert.structured_summary?.alert_title || alert.tool_name}</div><div className="text-[10px] text-slate-500 mt-0.5">{alert.record_count} records · {severity}</div></div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, card, onAskQuestion }) => {
  const [question, setQuestion] = useState('');
  const canvasRef = useRef(null);
  useEffect(() => {
    if (isOpen && card && canvasRef.current) {
      const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
      const chartData = card.chart_data || []; const config = card.chart_config || {};
      const w = canvas.width, h = canvas.height; const pad = { t: 30, r: 20, b: 50, l: 70 };
      ctx.clearRect(0, 0, w, h);
      if (chartData.length === 0) { ctx.fillStyle = '#94a3b8'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('No chart data available', w / 2, h / 2); return; }
      const xCol = config.x_axis_col_name || Object.keys(chartData[0])[0];
      const yCol = (config.y_axis_col_name || [])[0] || Object.keys(chartData[0]).find(k => typeof chartData[0][k] === 'number');
      const values = chartData.map(d => d[yCol] || 0); const labels = chartData.map(d => d[xCol] || ''); const max = Math.max(...values) * 1.1 || 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i <= 4; i++) { const y = pad.t + (i / 4) * (h - pad.t - pad.b); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
      ctx.strokeStyle = COLORS[0]; ctx.lineWidth = 2; ctx.beginPath();
      values.forEach((v, i) => { const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r); const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.stroke(); ctx.lineTo(w - pad.r, h - pad.b); ctx.lineTo(pad.l, h - pad.b); ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, 'rgba(180,134,46,0.2)'); grad.addColorStop(1, 'rgba(180,134,46,0)'); ctx.fillStyle = grad; ctx.fill();
      ctx.fillStyle = COLORS[0];
      values.forEach((v, i) => { const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r); const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#64748b'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      labels.forEach((l, i) => { if (i % Math.ceil(labels.length / 6) === 0 || labels.length <= 6) { const x = pad.l + (i / (labels.length - 1 || 1)) * (w - pad.l - pad.r); ctx.fillText(typeof l === 'string' ? l.substring(0, 10) : l, x, h - pad.b + 15); }});
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) { const v = max - (i / 4) * max; const y = pad.t + (i / 4) * (h - pad.t - pad.b); ctx.fillText(v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(0), pad.l - 8, y + 4); }
    }
  }, [isOpen, card]);
  const handleSend = () => { if (question.trim()) { onAskQuestion(question, card); setQuestion(''); } };
  const suggestedQuestions = [`What's driving ${card?.title}?`, `Show ${card?.title} by vendor`, `Compare to last month`];
  if (!isOpen || !card) return null;
  const summary = card.summary;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div><h2 className="font-serif text-lg font-semibold text-slate-900">{summary?.title || card.title}</h2><p className="text-xs text-slate-500">{card.description}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 grid md:grid-cols-[2fr_1fr] gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div><div className="text-[9px] text-slate-500 uppercase">Current</div><div className="font-serif text-3xl font-semibold text-slate-900">{card.formatted_value}</div></div>
              <div><div className={`font-semibold text-sm ${card.status === 'up' ? 'text-red-600' : 'text-emerald-600'}`}>{card.formatted_comparison}</div><div className="text-[10px] text-slate-500">{cleanComparisonLabel(card.comparison_label)}</div></div>
            </div>
            <div className="h-56 bg-slate-50 border border-slate-100 rounded-lg p-3 relative"><canvas ref={canvasRef} className="w-full h-full" /></div>
            {summary?.drivers && <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-amber-600"><div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Analysis</div>{summary.drivers.map((d, i) => <div key={i} className="flex gap-2 mb-1.5 text-xs text-slate-700"><span className="shrink-0">{d.icon}</span><span><strong>{d.title}:</strong> {d.description}</span></div>)}</div>}
          </div>
          <div className="flex flex-col gap-4">
            {summary?.current_state?.secondary_metrics && <div><div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Breakdown</div><div className="grid grid-cols-2 gap-2">{summary.current_state.secondary_metrics.map((m, i) => <div key={i} className="bg-slate-50 p-2 rounded text-center"><div className="text-[9px] text-slate-500 uppercase truncate">{m.label}</div><div className="font-mono text-sm font-semibold text-slate-900 truncate">{m.value}</div></div>)}</div></div>}
            <div><div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Quick Questions</div><div className="flex flex-col gap-1.5">{suggestedQuestions.map((q, i) => <button key={i} onClick={() => onAskQuestion(q, card)} className="text-left text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors">{q}</button>)}</div></div>
          </div>
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a follow-up question..." className="flex-1 bg-transparent outline-none text-sm" onKeyPress={e => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} className="bg-amber-600 text-white rounded p-1.5 hover:bg-amber-700"><Send size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null;
  const s = alert.structured_summary || {};
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`p-4 border-b flex justify-between items-start ${s.severity === 'CRITICAL' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div><div className={`text-[10px] font-semibold uppercase ${s.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>{s.severity} Alert</div><h2 className="font-serif text-lg font-semibold text-slate-900 mt-1">{s.alert_title}</h2></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <div className="mb-4"><div className="text-xs font-semibold uppercase text-slate-500 mb-2">Key Findings</div><div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg">{s.key_findings}</div></div>
          <div className="mb-4"><div className="text-xs font-semibold uppercase text-slate-500 mb-2">Recommended Actions</div><div className="text-sm text-slate-700 whitespace-pre-line bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">{s.recommended_actions}</div></div>
        </div>
      </div>
    </div>
  );
};

export default function APDashboard() {
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Initializing...');
  const [kpiCards, setKpiCards] = useState([]);
  const [kpiResults, setKpiResults] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [modalCard, setModalCard] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [dashboardQuery, setDashboardQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAgentListening, setIsAgentListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const startVoiceInput = (target) => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const setListeningState = target === 'dashboard' ? setIsListening : setIsAgentListening;
    const setInputValue = target === 'dashboard' ? setDashboardQuery : setAgentInput;

    recognitionRef.current.onstart = () => setListeningState(true);
    recognitionRef.current.onend = () => setListeningState(false);
    recognitionRef.current.onerror = (e) => { console.error('Speech error:', e); setListeningState(false); };
    recognitionRef.current.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInputValue(transcript);
    };

    recognitionRef.current.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsAgentListening(false);
    }
  };

  const getAIGreeting = () => {
    const greet = getGreeting();
    const nameGreet = userName ? `, ${userName.split(' ')[0].split('@')[0].charAt(0).toUpperCase() + userName.split(' ')[0].split('@')[0].slice(1).toLowerCase()}` : '';
    
    // Creative AI introductions based on time and day
    const aiIntros = {
      earlyMorning: [
        "You're up early! I've already analyzed overnight payment patterns.",
        "Early riser! Your AP data is fresh and ready for insights.",
        "Starting before the rush? Smart! I'm fully caffeinated and ready."
      ],
      morning: [
        "I'm your AI Financial Analyst, ready to decode your AP data.",
        "Your financial co-pilot is online. What mysteries shall we solve?",
        "I've been number-crunching while you grabbed coffee. Ask away!"
      ],
      afternoon: [
        "Afternoon analysis mode: engaged! What's on your mind?",
        "Post-lunch slump? Let me do the heavy lifting on your data.",
        "I'm here to turn your AP data into actionable intelligence."
      ],
      evening: [
        "Evening review time! I can help you wrap up with key insights.",
        "Winding down? Let me summarize what matters most in your AP.",
        "Evening shift reporting for duty. How can I assist?"
      ],
      late: [
        "Midnight oil mode! I never sleep, so let's dive deep.",
        "Late night analysis session? I've got unlimited energy for this.",
        "The quiet hours are perfect for focused financial analysis."
      ],
      monday: [
        "Monday mission: Let's conquer the week's AP challenges together!",
        "New week, fresh insights. What's our first target?"
      ],
      friday: [
        "TGIF! Let's tie up loose ends and prep for next week.",
        "Friday feels! Quick wins or deep dives — your call."
      ],
      weekend: [
        "Weekend warrior! Extra dedication deserves extra insights.",
        "Working weekends? I'm impressed. Let's make it productive!"
      ]
    };

    // Select appropriate intro
    let introPool;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      introPool = aiIntros.weekend;
    } else if (dayOfWeek === 1) {
      introPool = aiIntros.monday;
    } else if (dayOfWeek === 5) {
      introPool = aiIntros.friday;
    } else if (hour >= 5 && hour < 9) {
      introPool = aiIntros.earlyMorning;
    } else if (hour >= 9 && hour < 12) {
      introPool = aiIntros.morning;
    } else if (hour >= 12 && hour < 17) {
      introPool = aiIntros.afternoon;
    } else if (hour >= 17 && hour < 21) {
      introPool = aiIntros.evening;
    } else {
      introPool = aiIntros.late;
    }

    const intro = introPool[Math.floor(Math.random() * introPool.length)];
    return `${greet}${nameGreet}! ${intro}`;
  };

  const [agentMessages, setAgentMessages] = useState([{ text: "", sender: 'ai' }]);
  const [agentInput, setAgentInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeCard, setActiveCard] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userName, setUserName] = useState(null);
  const canvasRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => { const token = Cookies.get('access_token'); if (!token) { setIsAuthenticated(false); setError('Please login to access the dashboard'); setLoading(false); } else { setUserName(getUserFromToken()); } }, []);
  useEffect(() => { if (userName !== null) setAgentMessages([{ text: getAIGreeting(), sender: 'ai' }]); }, [userName]);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [agentMessages, streamingText]);

  const handleLogout = () => { Cookies.remove('access_token'); window.location.href = '/login'; };

  const fetchData = useCallback(async () => {
    if (!Cookies.get('access_token')) { setError('Please login'); setLoading(false); return; }
    setLoading(true); setError(null); setProgress(0); setKpiCards([]); setAlerts([]); setProgressMsg('Connecting...');
    try {
      const res = await authFetch('/dashboards/process-kpis-with-summaries', { method: 'POST', headers: { 'Accept': 'text/event-stream' }, body: JSON.stringify({ persona: 'CFO', goal: 'strategic financial insights', catalog: 'finance_fusion_catalog', schema: 'finance_fusion_catalog' }) });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.progress !== undefined) setProgress(data.progress);
              if (data.message) setProgressMsg(data.message);
              if (data.status === 'card_ready' && data.card) setKpiCards(prev => prev.find(c => c.id === data.card.id) ? prev.map(c => c.id === data.card.id ? data.card : c) : [...prev, data.card]);
              if (data.status === 'alert_ready' && data.alert) setAlerts(prev => [...prev, data.alert]);
              if (data.status === 'completed' && data.result) { setKpiCards(data.result.kpi_cards || []); setKpiResults(data.result.kpi_results || []); if (data.result.proactive_agents?.agent_findings) setAlerts(data.result.proactive_agents.agent_findings); setLoading(false); }
            } catch {}
          }
        }
      }
    } catch (e) { if (e.message !== 'Unauthorized') setError(e.message); setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [fetchData, isAuthenticated]);

  const handleKPICardChat = useCallback(async (question, card) => {
    if (!Cookies.get('access_token')) { handle401(); return; }
    setIsChatLoading(true); setStreamingText(''); setActiveCard(card);
    setAgentMessages(prev => [...prev, { text: question, sender: 'user', cardTitle: card.title }]);
    const cardContext = { card_id: card.id, title: card.title, description: card.description, value: card.value, formatted_value: card.formatted_value, comparison_value: card.comparison_value, comparison_label: card.comparison_label, detail_line_1: card.detail_line_1, detail_line_2: card.detail_line_2, sql_query: card.sql_query, chart_type: card.chart_type, chart_config: card.chart_config, data: card.chart_data || card.data, summary: card.summary };
    try {
      const res = await authFetch('/kpi-card-chat/chat-stream', { method: 'POST', headers: { 'Accept': 'text/event-stream' }, body: JSON.stringify({ query: question, card_context: cardContext, conversation_id: conversationId, catalog: 'finance_fusion_catalog', schema: 'finance_fusion_catalog', persona: 'CFO' }) });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = '', fullAnswer = '', resultData = null, followups = [], intent = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.stage === 'analyzing') setStreamingText('Analyzing your question...');
              if (data.stage === 'intent_classified') { intent = data.intent; setStreamingText(`Understanding intent: ${intent}...`); }
              if (data.stage === 'answer_ready' && data.answer) { fullAnswer = data.answer; setStreamingText(data.answer); }
              if (data.stage === 'drill_down') setStreamingText(fullAnswer + '\n\nGenerating detailed breakdown...');
              if (data.stage === 'drill_down_ready') { resultData = data.data; if (data.message) fullAnswer += '\n\n' + data.message; setStreamingText(fullAnswer); }
              if (data.stage === 'done' && data.result) { fullAnswer = data.result.answer || fullAnswer; resultData = data.result.data || resultData; followups = data.result.suggested_followups || []; if (data.result.conversation_id) setConversationId(data.result.conversation_id); }
              if (data.stage === 'error') fullAnswer = 'Error: ' + (data.message || 'Unknown error');
            } catch {}
          }
        }
      }
      setStreamingText('');
      setAgentMessages(prev => [...prev, { text: fullAnswer || 'No response', sender: 'ai', data: resultData, followups, intent, cardTitle: card.title }]);
    } catch (e) { if (e.message !== 'Unauthorized') { setStreamingText(''); setAgentMessages(prev => [...prev, { text: 'Error: ' + e.message, sender: 'ai' }]); } }
    finally { setIsChatLoading(false); }
  }, [conversationId]);

  const handleGeneralChat = useCallback(async (question) => {
    if (!Cookies.get('access_token')) { handle401(); return; }
    setIsChatLoading(true); setStreamingText('');
    setAgentMessages(prev => [...prev, { text: question, sender: 'user' }]);
    try {
      const requestBody = { query: question, catalog: 'finance_fusion_catalog', schema: 'finance_fusion_catalog', persona: 'analyst' };
      if (conversationId) requestBody.conversation_id = conversationId;
      const res = await authFetch('/conversational-bi/query-stream', { method: 'POST', headers: { 'Accept': 'text/event-stream' }, body: JSON.stringify(requestBody) });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
      let fullAnswer = '', followups = [], charts = [], queryType = 'simple';
      let executiveSummary = '', keyInsights = [], dataQualityAlert = null;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.stage === 'conversation_created') setConversationId(data.conversation_id);
              if (data.stage === 'followup_detected') setStreamingText(`Follow-up detected: ${data.enriched_query || 'Processing...'}`);
              if (data.stage === 'classification') setStreamingText('Analyzing question...');
              if (data.stage === 'classified') { queryType = data.query_type || 'simple'; setStreamingText(`Query type: ${queryType}...`); }
              if (data.stage === 'intent_analysis') setStreamingText('Analyzing business intent...');
              if (data.stage === 'planning') setStreamingText('Designing analysis strategy...');
              if (data.stage === 'sql_generation') setStreamingText('Generating SQL...');
              if (data.stage === 'executing') setStreamingText('Executing query...');
              if (data.stage === 'data_ready') setStreamingText(`Retrieved ${data.row_count || 0} rows...`);
              if (data.stage === 'generating_answer') setStreamingText('Analyzing results...');
              if (data.stage === 'synthesizing') setStreamingText('Synthesizing insights...');
              if (data.stage === 'generating_chart') setStreamingText('Preparing visualization...');
              if (data.stage === 'chart_ready' && data.chart) { charts.push(data.chart); setStreamingText(`Analysis ${charts.length}/4 complete...`); }
              if (data.stage === 'answer_ready') {
                fullAnswer = data.answer || '';
                followups = data.suggested_followups || [];
                if (data.data) charts.push({ title: data.chart_config?.title || 'Query Results', chart_type: data.chart_type || 'horizontal_bar_chart', chart_config: data.chart_config, data: data.data });
                setStreamingText(fullAnswer);
              }
              if (data.stage === 'done' || data.stage === 'complete') {
                const result = data.result || data;
                if (queryType === 'simple') {
                  fullAnswer = result.answer || fullAnswer;
                  followups = result.suggested_followups || followups;
                  if (result.data && result.chart_config) charts = [{ title: result.chart_config?.title || 'Results', chart_type: result.chart_type || 'horizontal_bar_chart', chart_config: result.chart_config, data: result.data }];
                } else {
                  executiveSummary = result.executive_summary || '';
                  keyInsights = result.key_insights || [];
                  dataQualityAlert = result.data_quality_alert;
                  charts = result.charts || charts;
                  followups = result.strategic_recommendations?.map(r => r.action) || [];
                  fullAnswer = executiveSummary;
                  if (keyInsights.length > 0) fullAnswer += '\n\n**Key Insights:**\n' + keyInsights.map((k, i) => `${i + 1}. **${k.headline}**: ${k.supporting_evidence?.[0]?.context || ''}`).join('\n');
                  if (result.root_cause_analysis?.primary_driver) fullAnswer += `\n\n**Root Cause:** ${result.root_cause_analysis.primary_driver}`;
                }
                if (data.conversation_id) setConversationId(data.conversation_id);
              }
              if (data.stage === 'error') fullAnswer = 'Error: ' + (data.message || data.error || 'Unknown error');
            } catch {}
          }
        }
      }
      setStreamingText('');
      setAgentMessages(prev => [...prev, { text: fullAnswer || 'No response received', sender: 'ai', followups, charts, queryType, dataQualityAlert }]);
    } catch (e) { if (e.message !== 'Unauthorized') { setStreamingText(''); setAgentMessages(prev => [...prev, { text: 'Error: ' + e.message, sender: 'ai' }]); } }
    finally { setIsChatLoading(false); }
  }, [conversationId]);

  const handleModalQuestion = (question, card) => { setModalCard(null); setView('ai-agent'); setActiveCard(card); setTimeout(() => handleKPICardChat(question, card), 100); };

  const handleAgentSend = () => {
    if (agentInput.trim() && !isChatLoading) {
      if (activeCard) handleKPICardChat(agentInput, activeCard);
      else handleGeneralChat(agentInput);
      setAgentInput('');
    }
  };

  // Dashboard query handler - uses conversational-bi and redirects to AI Agent
  const handleDashboardQuery = () => {
    if (dashboardQuery.trim() && !isChatLoading) {
      setView('ai-agent');
      setActiveCard(null);
      setTimeout(() => {
        handleGeneralChat(dashboardQuery);
        setDashboardQuery('');
      }, 100);
    }
  };

  const handleNewChat = () => { setAgentMessages([{ text: getAIGreeting(), sender: 'ai' }]); setActiveCard(null); setConversationId(null); };
  const clearContext = () => { setActiveCard(null); };

  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const date = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Working late';
  };

  const getPersonalizedGreeting = () => {
    const greeting = getGreeting();
    if (userName) {
      const firstName = userName.split(' ')[0].split('@')[0];
      return `${greeting}, ${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}!`;
    }
    return `${greeting}!`;
  };

  // Creative time-based and day-based messages
  const getCreativeHeadline = () => {
    const headlines = {
      // Monday headlines
      1: {
        morning: "Let's kickstart the week with clarity! 🚀",
        afternoon: "Monday momentum is building! 📈",
        evening: "Wrapping up Monday strong! 💪",
        late: "Burning the Monday midnight oil? 🌙"
      },
      // Tuesday headlines  
      2: {
        morning: "Tuesday's here — time to dig into the data! 🔍",
        afternoon: "Keep that Tuesday tempo going! 🎯",
        evening: "Tuesday insights await! ✨",
        late: "Late Tuesday hustle mode! 🔥"
      },
      // Wednesday headlines
      3: {
        morning: "Midweek check-in — how's the cash flowing? 💰",
        afternoon: "Hump day? More like insight day! 📊",
        evening: "Wednesday wisdom loading... 🧠",
        late: "Midweek midnight mission! 🌟"
      },
      // Thursday headlines
      4: {
        morning: "Thursday vibes — almost there! 🎉",
        afternoon: "Thursday's the new Friday prep day! 📋",
        evening: "Keep the momentum, Joe! 🏃",
        late: "Thursday night number crunching! 🔢"
      },
      // Friday headlines
      5: {
        morning: "TGIF! Let's close the week on a high! 🎊",
        afternoon: "Friday finance finesse time! 💼",
        evening: "Wrapping up the week beautifully! 🌅",
        late: "Friday night dedication! 🌠"
      },
      // Saturday headlines
      6: {
        morning: "Weekend warrior mode activated! ⚔️",
        afternoon: "Saturday strategizing? Impressive! 👏",
        evening: "Weekend work? You're a rockstar! 🌟",
        late: "Saturday night insights! 🎭"
      },
      // Sunday headlines
      0: {
        morning: "Sunday prep for a powerful week! ☀️",
        afternoon: "Getting ahead on Sunday — smart move! 🧩",
        evening: "Sunday planning session! 📝",
        late: "Sunday night strategy time! 🎯"
      }
    };

    const timeOfDay = hour >= 5 && hour < 12 ? 'morning' 
      : hour >= 12 && hour < 17 ? 'afternoon'
      : hour >= 17 && hour < 21 ? 'evening' 
      : 'late';

    return headlines[dayOfWeek]?.[timeOfDay] || "Ready to generate powerful insights? 💡";
  };

  const getContextualSubtext = () => {
    const subtexts = {
      // Time-based contexts
      earlyMorning: [
        "Early bird catches the insights! Your AP data is ready for analysis.",
        "Fresh coffee, fresh data — let's dive in!",
        "Starting early? Here's your financial snapshot."
      ],
      morning: [
        "Your morning briefing is ready. What would you like to explore?",
        "I've been analyzing your AP data overnight. Ask me anything!",
        "Morning! I've got fresh insights on your payables."
      ],
      afternoon: [
        "Afternoon check-in: Your AP health at a glance.",
        "Post-lunch productivity boost — let's crunch some numbers!",
        "Your afternoon financial companion is ready."
      ],
      evening: [
        "Evening review time. How can I help you wrap up?",
        "Winding down? Let me summarize today's AP highlights.",
        "Evening insights await — from cash flow to compliance."
      ],
      late: [
        "Burning the midnight oil? I'm here to help you finish strong.",
        "Late night analysis mode — your data never sleeps, and neither do I!",
        "Quiet hours are perfect for deep financial analysis."
      ],
      // Day-based special contexts
      mondayMorning: [
        "Week's starting fresh! Check overdue invoices from last week.",
        "Monday morning priorities: Let's tackle the AP backlog together."
      ],
      fridayAfternoon: [
        "End-of-week review? I can summarize this week's AP activity.",
        "Friday wrap-up: Any pending approvals before the weekend?"
      ],
      weekend: [
        "Weekend warrior! Your dedication is impressive.",
        "Taking time on the weekend? Let's make it count."
      ]
    };

    // Special day + time combinations
    if (dayOfWeek === 1 && hour >= 5 && hour < 12) {
      return subtexts.mondayMorning[Math.floor(Math.random() * subtexts.mondayMorning.length)];
    }
    if (dayOfWeek === 5 && hour >= 12 && hour < 17) {
      return subtexts.fridayAfternoon[Math.floor(Math.random() * subtexts.fridayAfternoon.length)];
    }
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return subtexts.weekend[Math.floor(Math.random() * subtexts.weekend.length)];
    }

    // Time-based selection
    const timeKey = hour >= 5 && hour < 9 ? 'earlyMorning'
      : hour >= 9 && hour < 12 ? 'morning'
      : hour >= 12 && hour < 17 ? 'afternoon'
      : hour >= 17 && hour < 21 ? 'evening'
      : 'late';

    const options = subtexts[timeKey];
    return options[Math.floor(Math.random() * options.length)];
  };

  const getActionPrompt = () => {
    const prompts = {
      1: "Start the week by checking vendor payments due this week.",
      2: "How about analyzing your top spending categories?",
      3: "Midweek is perfect for a cash flow health check.",
      4: "Let's ensure nothing slips through before Friday!",
      5: "Quick wins: Check for available early payment discounts.",
      6: "Weekend review: How did your AP metrics trend this week?",
      0: "Plan ahead: What's the payment outlook for next week?"
    };
    return prompts[dayOfWeek] || "What shall we decode today?";
  };

  const getDayMessage = () => getCreativeHeadline();
  const getContextualTip = () => `${getContextualSubtext()}\n${getActionPrompt()}`;

  const localCards = kpiCards.filter(c => c.card_type === 'local');
  const proactiveCards = kpiCards.filter(c => c.card_type === 'proactive');
  const cashFlowKpi = kpiResults.find(k => k.kpi?.title?.includes('Cash Outflow'));
  const agingKpi = kpiResults.find(k => k.kpi?.title?.includes('Aging'));
  const criticalAlerts = alerts.filter(a => a.structured_summary?.severity === 'CRITICAL');

  useEffect(() => {
    if (view === 'dashboard' && cashFlowKpi?.data && canvasRef.current && !loading) {
      const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
      const resize = () => {
        canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
        const data = cashFlowKpi.data; const values = data.map(d => d.total_outflow_inr || 0); const labels = data.map(d => d.month);
        const w = canvas.width, h = canvas.height; const pad = { t: 20, r: 20, b: 40, l: 70 }; const max = Math.max(...values) * 1.1 || 1;
        ctx.clearRect(0, 0, w, h); ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        for (let i = 0; i <= 5; i++) { const y = pad.t + (i / 5) * (h - pad.t - pad.b); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
        ctx.strokeStyle = '#b4862e'; ctx.lineWidth = 2; ctx.beginPath();
        values.forEach((v, i) => { const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r); const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
        ctx.fillStyle = 'rgba(180,134,46,0.1)'; ctx.beginPath(); ctx.moveTo(pad.l, h - pad.b);
        values.forEach((v, i) => { const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r); ctx.lineTo(x, pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b)); });
        ctx.lineTo(w - pad.r, h - pad.b); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b4862e'; values.forEach((v, i) => { const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r); const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        labels.forEach((l, i) => { if (i % 2 === 0 || labels.length <= 6) { const x = pad.l + (i / (labels.length - 1 || 1)) * (w - pad.l - pad.r); ctx.fillText(l, x, h - 10); }});
        ctx.textAlign = 'right'; for (let i = 0; i <= 5; i++) { const v = max * (5 - i) / 5; ctx.fillText((v / 1e9).toFixed(1) + 'B', pad.l - 5, pad.t + (i / 5) * (h - pad.t - pad.b) + 4); }
      };
      resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
    }
  }, [view, cashFlowKpi, loading]);

  const agingData = agingKpi?.data ? (() => {
    const buckets = {}; agingKpi.data.forEach(d => { const b = d.bucket || 'Unknown'; buckets[b] = (buckets[b] || 0) + (d.amount_inr || 0); });
    const total = Object.values(buckets).reduce((a, b) => a + b, 0); const sorted = Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0])); const maxVal = Math.max(...sorted.map(([, v]) => v));
    const colors = ['bg-gradient-to-t from-emerald-600 to-emerald-200', 'bg-gradient-to-t from-blue-600 to-blue-200', 'bg-gradient-to-t from-amber-600 to-amber-200', 'bg-gradient-to-t from-red-500 to-red-200', 'bg-gradient-to-t from-red-700 to-red-400', 'bg-gradient-to-t from-slate-500 to-slate-300'];
    return sorted.map(([label, val], i) => ({ label: label.replace(/^\d\.\s*/, ''), amount: (val / 1e9).toFixed(2) + 'B', pct: ((val / total) * 100).toFixed(1) + '%', h: (val / maxVal) * 100, color: colors[i] || colors[5] }));
  })() : [];

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center p-8 max-w-md"><Loader2 size={48} className="animate-spin text-amber-600 mx-auto mb-4" /><div className="text-lg font-medium text-slate-900 mb-2">{progressMsg}</div><div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto"><div className="h-full bg-amber-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} /></div><div className="text-sm text-slate-500 mt-2">{progress}%</div></div></div>;
  if (error || !isAuthenticated) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center p-8"><AlertTriangle size={48} className="text-red-500 mx-auto mb-4" /><div className="text-lg font-medium text-slate-900 mb-2">{!isAuthenticated ? 'Authentication Required' : 'Error'}</div><div className="text-sm text-slate-500 mb-4">{error || 'Please login'}</div>{!isAuthenticated ? <a href="/login" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Login</a> : <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 mx-auto"><RefreshCw size={16} />Retry</button>}</div></div>;

  return (
    <div className="flex w-full min-h-screen bg-slate-50">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="max-w-7xl mx-auto p-4 w-full">
          <header className="flex flex-wrap justify-between items-start mb-4 pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-medium tracking-widest uppercase text-amber-700 mb-1"><span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />Live Dashboard{criticalAlerts.length > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{criticalAlerts.length} Critical</span>}</div>
              <h1 className="font-serif text-2xl font-medium text-slate-900">Accounts Payable Command Center</h1>
              <p className="text-xs text-slate-500">Enterprise Financial Overview</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="font-mono text-xs text-slate-500">{date} · {time}</div>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex bg-slate-200 p-0.5 rounded-lg gap-0.5">
                  <button onClick={() => setView('dashboard')} className={`px-3 py-1 rounded text-xs font-medium ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Dashboard</button>
                  <button onClick={() => setView('ai-agent')} className={`px-3 py-1 rounded text-xs font-medium ${view === 'ai-agent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>AI Agent</button>
                </div>
                <button onClick={fetchData} className="flex items-center gap-1 px-2 py-1 border border-slate-200 rounded bg-white text-slate-500 text-xs hover:bg-slate-50"><RefreshCw size={12} /></button>
                <button onClick={handleLogout} className="flex items-center gap-1 px-2 py-1 border border-red-200 rounded bg-white text-red-500 text-xs hover:bg-red-50"><LogOut size={12} /></button>
              </div>
            </div>
          </header>

          {view === 'dashboard' ? (
            <>
              {/* Greeting and Query Input Section */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="text-center">
                  <h2 className="font-serif text-3xl font-semibold text-slate-900">{getPersonalizedGreeting()} 👋</h2>
                  <p className="text-base text-slate-600 mt-2">{getDayMessage()}</p>
                  <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">{getContextualTip()}</p>
                </div>
                
                {/* Query Input Box */}
                <div className="w-full max-w-2xl">
                  <div className={`bg-white border rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all ${isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'}`}>
                    <HelpCircle size={18} className="text-slate-400" />
                    <input
                      value={dashboardQuery}
                      onChange={e => setDashboardQuery(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleDashboardQuery()}
                      placeholder="Ask about your business data (e.g., 'Show me invoices over $50k from last month')"
                      className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                    />
                    <button
                      onClick={() => isListening ? stopVoiceInput() : startVoiceInput('dashboard')}
                      className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 text-slate-500'}`}
                      title={isListening ? 'Stop listening' : 'Voice input'}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                      onClick={handleDashboardQuery}
                      disabled={!dashboardQuery.trim() || isChatLoading}
                      className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                      <Send size={18} className="text-slate-500" />
                    </button>
                  </div>
                  {isListening && <div className="text-center text-xs text-red-500 mt-2 animate-pulse">🎤 Listening... Speak now</div>}
                </div>
              </div>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{localCards.map(card => <KPICard key={card.id} card={card} onClick={setModalCard} />)}</section>
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">{proactiveCards.map(card => <ProactiveCard key={card.id} card={card} />)}</section>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="font-serif text-base font-medium text-slate-900">Monthly Cash Outflows</h3></div><div className="p-4"><div className="h-52 relative"><canvas ref={canvasRef} className="w-full h-full" /></div></div></div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="font-serif text-base font-medium text-slate-900">AP Aging Distribution</h3></div><div className="p-4">{agingData.length > 0 ? (<><div className="flex gap-0.5 mb-2">{agingData.map(a => <div key={a.label} className="flex-1 text-center"><div className="font-mono text-xs font-semibold text-slate-900">{a.amount}</div><div className="text-[9px] text-slate-500">{a.pct}</div></div>)}</div><div className="flex gap-0.5 h-36 items-end mb-2">{agingData.map(a => <div key={a.label} className={`flex-1 rounded-t ${a.color} transition-all hover:opacity-80`} style={{ height: `${a.h}%` }} />)}</div><div className="flex gap-0.5">{agingData.map(a => <div key={a.label} className="flex-1 text-center text-[8px] text-slate-500 truncate">{a.label}</div>)}</div></>) : <div className="h-36 flex items-center justify-center text-slate-400 text-sm">No data</div>}</div></div>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="font-serif text-base font-medium text-slate-900">Proactive Alerts</h3><p className="text-[10px] text-slate-500">{alerts.length} findings</p></div><div className="p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">{alerts.slice(0, 5).map((alert, i) => <div key={i} onClick={() => setAlertModal(alert)} className="cursor-pointer"><AlertCard alert={alert} /></div>)}</div></div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="font-serif text-base font-medium text-slate-900">Alert Summary</h3></div><div className="p-4 grid grid-cols-2 gap-3">{alerts.slice(0, 4).map((a, i) => <div key={i} onClick={() => setAlertModal(a)} className="bg-slate-50 p-3 rounded-lg cursor-pointer hover:bg-slate-100"><div className={`text-[9px] font-semibold uppercase ${a.structured_summary?.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>{a.structured_summary?.severity}</div><div className="text-xs font-medium text-slate-900 truncate mt-1">{a.tool_name?.replace(/_/g, ' ')}</div></div>)}</div></div>
              </section>
            </>
          ) : (
            <div className="flex h-[calc(100vh-160px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="w-56 bg-slate-50 border-r border-slate-200 p-3 flex flex-col">
                <button onClick={handleNewChat} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded text-xs font-medium mb-3 hover:bg-amber-700"><Plus size={14} />New Chat</button>
                <div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Suggested Topics</div>
                <div className="flex flex-col gap-1 text-xs">
                  {['Total AP outstanding', 'Overdue invoices', 'Top vendors by spend', 'Cash flow forecast', 'Payment trends'].map((t, i) => (
                    <button key={i} onClick={() => setAgentInput(t)} className="text-left px-2 py-1.5 rounded text-slate-600 hover:bg-slate-100 truncate">{t}</button>
                  ))}
                </div>
                {activeCard && (
                  <div className="mt-auto pt-3 border-t border-slate-200">
                    <div className="text-[9px] font-semibold uppercase text-slate-500 mb-2 flex justify-between items-center">
                      <span>Active Context</span>
                      <button onClick={clearContext} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-xs font-medium text-slate-900 truncate">{activeCard.title}</div>
                      <div className="text-[10px] text-amber-600 font-semibold">{activeCard.formatted_value}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                  {agentMessages.map((m, i) => (
                    <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${m.sender === 'user' ? 'self-end items-end' : 'self-start'}`}>
                      {m.cardTitle && m.sender === 'user' && <div className="text-[9px] text-slate-400 mb-0.5">Re: {m.cardTitle}</div>}
                      <div className={`px-4 py-3 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'}`}>
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        {m.dataQualityAlert && (
                          <div className={`mt-3 p-2 rounded-lg border-l-4 ${m.dataQualityAlert.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'}`}>
                            <div className="text-[10px] font-semibold text-red-700">{m.dataQualityAlert.headline}</div>
                            <div className="text-[9px] text-slate-600 mt-1">{m.dataQualityAlert.details}</div>
                          </div>
                        )}
                        {m.charts && m.charts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-[10px] font-semibold uppercase text-slate-500 mb-2">{m.queryType === 'complex_why' ? `Analysis (${m.charts.length} charts)` : 'Visualization'}</div>
                            <div className={`grid gap-3 ${m.charts.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                              {m.charts.map((chart, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 border border-slate-200">
                                  <div className="text-[9px] font-medium text-slate-700 mb-1 truncate">{chart.title}</div>
                                  {chart.purpose && <div className="text-[8px] text-slate-400 mb-2">{chart.purpose}</div>}
                                  <ChartCanvas chartConfig={chart.chart_config} data={chart.data} chartType={chart.chart_type} title="" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {m.followups && m.followups.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-1">{m.queryType === 'complex_why' ? 'Recommended Actions:' : 'Follow-up questions:'}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {m.followups.slice(0, 3).map((f, j) => (
                                <button key={j} onClick={() => activeCard ? handleKPICardChat(f, activeCard) : handleGeneralChat(f)} disabled={isChatLoading} className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded disabled:opacity-50 text-left">{f.length > 60 ? f.substring(0, 60) + '...' : f}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {streamingText && <div className="flex flex-col items-start max-w-[85%]"><div className="px-4 py-3 rounded-2xl text-sm bg-slate-100 text-slate-900 rounded-bl-sm whitespace-pre-wrap">{streamingText}<span className="inline-block w-1.5 h-4 bg-amber-600 ml-1 animate-pulse" /></div></div>}
                  {isChatLoading && !streamingText && <div className="flex items-center gap-2 text-sm text-slate-500 self-start"><Loader2 size={14} className="animate-spin" />Analyzing...</div>}
                </div>
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className={`bg-slate-50 border rounded-xl p-3 transition-all ${isAgentListening ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'}`}>
                    <textarea value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAgentSend())} placeholder="Ask anything about your AP data..." className="w-full bg-transparent outline-none text-sm resize-none" rows={2} disabled={isChatLoading} />
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <MessageSquare size={10} />
                        {activeCard ? <span>Context: <span className="text-amber-600">{activeCard.title}</span></span> : <span>General AP Query</span>}
                        {isAgentListening && <span className="text-red-500 animate-pulse">🎤 Listening...</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => isAgentListening ? stopVoiceInput() : startVoiceInput('agent')}
                          disabled={isChatLoading}
                          className={`p-1.5 rounded transition-colors ${isAgentListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-200 text-slate-500'} disabled:opacity-50`}
                          title={isAgentListening ? 'Stop listening' : 'Voice input'}
                        >
                          {isAgentListening ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>
                        <button onClick={handleAgentSend} disabled={isChatLoading || !agentInput.trim()} className="bg-amber-600 text-white rounded px-3 py-1.5 hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"><Send size={12} />Send</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={!!modalCard} onClose={() => setModalCard(null)} card={modalCard} onAskQuestion={handleModalQuestion} />
      <AlertModal isOpen={!!alertModal} onClose={() => setAlertModal(null)} alert={alertModal} />
    </div>
  );
}