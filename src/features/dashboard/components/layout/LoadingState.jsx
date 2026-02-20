/**
 * LoadingState Component
 * CrescentOne branded full-page loading indicator with progress
 */

const LoadingState = ({ message, progress }) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#D7EBEE' }}
    >
      {/* Logo — same as login card */}
      <img
        src="/crescent-logo.jpg"
        alt="CrescentOne"
        style={{ height: 48, objectFit: 'contain', marginBottom: 32, mixBlendMode: 'multiply' }}
      />

      {/* Spinner ring */}
      <div
        className="rounded-full animate-spin mb-6"
        style={{
          width: 44,
          height: 44,
          border: '3px solid #B8D9DE',
          borderTopColor: '#1B5272',
        }}
      />

      {/* Message */}
      <div
        className="font-medium mb-4 text-center"
        style={{ fontSize: 15, color: '#1B5272' }}
      >
        {message}
      </div>

      {/* Progress bar */}
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 240, height: 6, backgroundColor: '#B8D9DE' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: '#1B5272' }}
        />
      </div>

      <div
        className="mt-2"
        style={{ fontSize: 12, color: '#7DAAAD' }}
      >
        {progress}%
      </div>
    </div>
  )
}

export default LoadingState
