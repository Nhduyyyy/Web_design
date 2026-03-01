// Simple test component to verify Tailwind CSS is working
const TheaterTest = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 border border-yellow-500">
        <h1 className="text-3xl font-bold text-yellow-500 mb-4">
          Theater Dashboard Test
        </h1>
        <p className="text-slate-300 mb-4">
          If you can see this styled correctly, Tailwind CSS is working!
        </p>
        <button className="w-full bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  )
}

export default TheaterTest
