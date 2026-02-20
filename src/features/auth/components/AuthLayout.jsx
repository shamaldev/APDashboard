/**
 * AuthLayout Component
 * CrescentOne branded authentication layout — matches official login UI
 */

import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

const AuthLayout = ({ children }) => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#D6DEDE' }}
    >
      {/* Global style for placeholder text — matches footer color */}
      <style>{`
        .cr-input::placeholder {
          color: #7A9FA5;
          opacity: 1;
          font-style: italic;
        }
      `}</style>

      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header
        className="w-full px-6 py-2 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: '#4A7C8A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo on header — same approach as card logo */}
        <img
          src="/crescent-logo.jpg"
          alt="CrescentOne"
          style={{ height: 30, objectFit: 'contain', mixBlendMode: 'multiply' }}
        />

        {/* Culture / Language selectors */}
        <div
          className="flex items-center gap-5"
          style={{ fontSize: 12, color: '#B8D8DD' }}
        >
          <span>
            Culture:&nbsp;
            <select
              defaultValue="en-US"
              style={{
                fontSize: 12,
                color: '#D0EEF2',
                fontWeight: 500,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="en-US">English (United States)</option>
            </select>
          </span>
          <span style={{ color: '#B8D8DD' }}>&#9660;</span>
          <span>
            Language:&nbsp;
            <select
              defaultValue="en"
              style={{
                fontSize: 12,
                color: '#D0EEF2',
                fontWeight: 500,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="en">English</option>
            </select>
          </span>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <motion.div
          className="w-full overflow-hidden"
          style={{
            maxWidth: 460,
            backgroundColor: '#C4DADE',
            border: '1px solid #B0CDD2',
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Card — Logo Section */}
          <div
            className="pt-10 pb-5 px-12 flex flex-col items-center"
          >
            <img
              src="/crescent-logo.jpg"
              alt="CrescentOne"
              style={{ height: 68, objectFit: 'contain', maxWidth: '90%', mixBlendMode: 'multiply' }}
            />
            <p
              className="mt-2 text-center font-semibold"
              style={{
                fontSize: 9,
                color: '#7DAAAD',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              ERP DRIVING INDUSTRY 4.0
            </p>
          </div>

          {/* Card — Form Content */}
          <div className="px-12 pt-2 pb-6">{children}</div>

          {/* Card — Footer */}
          <div
            className="px-12 py-3 flex items-center justify-between border-t"
            style={{ borderColor: '#B0CDD2' }}
          >
            <span style={{ fontSize: 11, color: '#7A9FA5' }}>
              CrescentOne GMIAP 2.6.214.2
            </span>
            <span style={{ fontSize: 11, color: '#7A9FA5' }}>Copyright</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default AuthLayout
