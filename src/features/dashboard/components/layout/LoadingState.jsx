/**
 * LoadingState Component
 * Novigo branded full-page loading indicator with progress
 */

import novigoLogo from '../../../../../NovigoLogo.png'

const LoadingState = ({ message, progress }) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#EEEDF5' }}
    >
      {/* Logo — same as login card */}
      <img
        src={novigoLogo}
        alt="Novigo"
        style={{ height: 48, objectFit: 'contain', marginBottom: 32, mixBlendMode: 'multiply' }}
      />

      {/* Spinner ring */}
      <div
        className="rounded-full animate-spin mb-6"
        style={{
          width: 44,
          height: 44,
          border: '3px solid #D0CDE5',
          borderTopColor: '#2B2570',
        }}
      />

      {/* Message */}
      <div
        className="font-medium mb-4 text-center"
        style={{ fontSize: 15, color: '#2B2570' }}
      >
        {message}
      </div>

      {/* Progress bar */}
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 240, height: 6, backgroundColor: '#D0CDE5' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: '#2B2570' }}
        />
      </div>

      <div
        className="mt-2"
        style={{ fontSize: 12, color: '#8B87B8' }}
      >
        {progress}%
      </div>
    </div>
  )
}

export default LoadingState
