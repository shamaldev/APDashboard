/**
 * Dashboard Helper Functions
 * KPI status, formatting, greetings
 */

import { KPI_THRESHOLDS, STATUS_COLORS } from './constants'

export const getKPIStatus = (card) => {
  const cardId = card.id?.toLowerCase().replace(/[^a-z0-9]/g, '_') || ''
  const value = card.value
  const comparison = card.comparison_value

  for (const [key, config] of Object.entries(KPI_THRESHOLDS)) {
    if (cardId.includes(key) || card.title?.toLowerCase().includes(key.replace(/_/g, ' '))) {
      return config.getStatus(value, comparison)
    }
  }

  if (card.status === 'success') return 'green'
  if (card.status === 'warning') return 'amber'
  if (card.status === 'error' || card.status === 'critical') return 'red'

  const change = parseFloat(comparison) || 0
  if (Math.abs(change) <= 5) return 'green'
  if (Math.abs(change) <= 10) return 'amber'
  return 'red'
}

export const getProactiveCardStatus = (card) => {
  const titleLower = card.title?.toLowerCase() || ''
  const value = (card.value || 0) * 100

  if (titleLower.includes('stp') || titleLower.includes('straight')) {
    return value >= 70 ? 'green' : value >= 65 ? 'amber' : 'red'
  }
  if (titleLower.includes('discount')) {
    return value >= 95 ? 'green' : value >= 90 ? 'amber' : 'red'
  }
  if (titleLower.includes('first') && titleLower.includes('match')) {
    return value >= 85 ? 'green' : value >= 80 ? 'amber' : 'red'
  }
  if (titleLower.includes('exception')) {
    return value <= 15 ? 'green' : value <= 20 ? 'amber' : 'red'
  }
  return card.status === 'success' ? 'green' : card.status === 'warning' ? 'amber' : 'red'
}

export const cleanComparisonLabel = (label) => {
  if (!label) return ''
  return label.replace(/\s*\(\d{4}-\d{2}-\d{2}[^)]*\)/g, '').trim()
}

export const formatLargeNumber = (value) => {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M'
  if (value >= 1e3) return (value / 1e3).toFixed(0) + 'K'
  return value.toFixed(0)
}

export const getGreeting = (hour) => {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Working late'
}

export const getPersonalizedGreeting = (userName, hour) => {
  const greeting = getGreeting(hour)
  if (userName) {
    const firstName = userName.split(' ')[0].split('@')[0]
    return `${greeting}, ${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}!`
  }
  return `${greeting}!`
}

export const getCreativeHeadline = (dayOfWeek, hour) => {
  const headlines = {
    1: { morning: "Let's kickstart the week with clarity!", afternoon: "Monday momentum is building!", evening: "Wrapping up Monday strong!", late: "Burning the Monday midnight oil?" },
    2: { morning: "Tuesday's here — time to dig into the data!", afternoon: "Keep that Tuesday tempo going!", evening: "Tuesday insights await!", late: "Late Tuesday hustle mode!" },
    3: { morning: "Midweek check-in — how's the cash flowing?", afternoon: "Hump day? More like insight day!", evening: "Wednesday wisdom loading...", late: "Midweek midnight mission!" },
    4: { morning: "Thursday vibes — almost there!", afternoon: "Thursday's the new Friday prep day!", evening: "Keep the momentum going!", late: "Thursday night number crunching!" },
    5: { morning: "TGIF! Let's close the week on a high!", afternoon: "Friday finance finesse time!", evening: "Wrapping up the week beautifully!", late: "Friday night dedication!" },
    6: { morning: "Weekend warrior mode activated!", afternoon: "Saturday strategizing? Impressive!", evening: "Weekend work? You're a rockstar!", late: "Saturday night insights!" },
    0: { morning: "Sunday prep for a powerful week!", afternoon: "Getting ahead on Sunday — smart move!", evening: "Sunday planning session!", late: "Sunday night strategy time!" }
  }

  const timeOfDay = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'late'
  return headlines[dayOfWeek]?.[timeOfDay] || "Ready to generate powerful insights?"
}

export const getContextualSubtext = (dayOfWeek, hour) => {
  const subtexts = {
    earlyMorning: ["Early bird catches the insights! Your AP data is ready for analysis.", "Fresh coffee, fresh data — let's dive in!", "Starting early? Here's your financial snapshot."],
    morning: ["Your morning briefing is ready. What would you like to explore?", "I've been analyzing your AP data overnight. Ask me anything!", "Morning! I've got fresh insights on your payables."],
    afternoon: ["Afternoon check-in: Your AP health at a glance.", "Post-lunch productivity boost — let's crunch some numbers!", "Your afternoon financial companion is ready."],
    evening: ["Evening review time. How can I help you wrap up?", "Winding down? Let me summarize today's AP highlights.", "Evening insights await — from cash flow to compliance."],
    late: ["Burning the midnight oil? I'm here to help you finish strong.", "Late night analysis mode — your data never sleeps, and neither do I!", "Quiet hours are perfect for deep financial analysis."],
    mondayMorning: ["Week's starting fresh! Check overdue invoices from last week.", "Monday morning priorities: Let's tackle the AP backlog together."],
    fridayAfternoon: ["End-of-week review? I can summarize this week's AP activity.", "Friday wrap-up: Any pending approvals before the weekend?"],
    weekend: ["Weekend warrior! Your dedication is impressive.", "Taking time on the weekend? Let's make it count."]
  }

  if (dayOfWeek === 1 && hour >= 5 && hour < 12) return subtexts.mondayMorning[Math.floor(Math.random() * subtexts.mondayMorning.length)]
  if (dayOfWeek === 5 && hour >= 12 && hour < 17) return subtexts.fridayAfternoon[Math.floor(Math.random() * subtexts.fridayAfternoon.length)]
  if (dayOfWeek === 0 || dayOfWeek === 6) return subtexts.weekend[Math.floor(Math.random() * subtexts.weekend.length)]

  const timeKey = hour >= 5 && hour < 9 ? 'earlyMorning' : hour >= 9 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'late'
  const options = subtexts[timeKey]
  return options[Math.floor(Math.random() * options.length)]
}

export const getActionPrompt = (dayOfWeek) => {
  const prompts = {
    1: "Start the week by checking vendor payments due this week.",
    2: "How about analyzing your top spending categories?",
    3: "Midweek is perfect for a cash flow health check.",
    4: "Let's ensure nothing slips through before Friday!",
    5: "Quick wins: Check for available early payment discounts.",
    6: "Weekend review: How did your AP metrics trend this week?",
    0: "Plan ahead: What's the payment outlook for next week?"
  }
  return prompts[dayOfWeek] || "What shall we decode today?"
}

export const getAIGreeting = (userName, hour, dayOfWeek) => {
  const greet = getGreeting(hour)
  const nameGreet = userName
    ? `, ${userName.split(' ')[0].split('@')[0].charAt(0).toUpperCase() + userName.split(' ')[0].split('@')[0].slice(1).toLowerCase()}`
    : ''

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
  }

  let introPool
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    introPool = aiIntros.weekend
  } else if (dayOfWeek === 1) {
    introPool = aiIntros.monday
  } else if (dayOfWeek === 5) {
    introPool = aiIntros.friday
  } else if (hour >= 5 && hour < 9) {
    introPool = aiIntros.earlyMorning
  } else if (hour >= 9 && hour < 12) {
    introPool = aiIntros.morning
  } else if (hour >= 12 && hour < 17) {
    introPool = aiIntros.afternoon
  } else if (hour >= 17 && hour < 21) {
    introPool = aiIntros.evening
  } else {
    introPool = aiIntros.late
  }

  const intro = introPool[Math.floor(Math.random() * introPool.length)]
  return `${greet}${nameGreet}! ${intro}`
}
