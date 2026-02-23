/**
 * AuthLayout Component
 * Novigo branded authentication layout
 */

import { motion } from 'framer-motion'
import novigoLogo from '../../../../NovigoLogo.png'

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
      style={{ backgroundColor: '#EEEDF5' }}
    >
      {/* Global style for placeholder text */}
      <style>{`
        .cr-input::placeholder {
          color: #8B87B8;
          opacity: 1;
          font-style: italic;
        }
      `}</style>

      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header
        className="w-full px-6 py-2 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: '#2B2570',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      >
        <div className="rounded-md px-2 py-1" style={{ backgroundColor: '#ffffff' }}>
          <img
            src={novigoLogo}
            alt="Novigo"
            style={{ height: 22, objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Culture / Language selectors */}
        <div
          className="flex items-center gap-5"
          style={{ fontSize: 12, color: '#D0CDE5' }}
        >
          <span>
            Culture:&nbsp;
            <select
              defaultValue="en-US"
              style={{
                fontSize: 12,
                color: '#E0DEF5',
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
          <span style={{ color: '#D0CDE5' }}>&#9660;</span>
          <span>
            Language:&nbsp;
            <select
              defaultValue="en"
              style={{
                fontSize: 12,
                color: '#E0DEF5',
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
            backgroundColor: '#E4E2F0',
            border: '1px solid #C8C4E0',
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
              src={novigoLogo}
              alt="Novigo"
              style={{ height: 68, objectFit: 'contain', maxWidth: '90%', mixBlendMode: 'multiply' }}
            />
          </div>

          {/* Card — Form Content */}
          <div className="px-12 pt-2 pb-6">{children}</div>

          {/* Card — Footer */}
          <div
            className="px-12 py-3 flex items-center justify-between border-t"
            style={{ borderColor: '#C8C4E0' }}
          >
            <span style={{ fontSize: 11, color: '#8B87B8' }}>
              Novigo
            </span>
            <span style={{ fontSize: 11, color: '#8B87B8' }}>Copyright</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default AuthLayout
