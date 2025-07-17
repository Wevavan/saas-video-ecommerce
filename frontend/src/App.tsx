import { useState } from "react"

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Mon SaaS Vidéo</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Counter</h2>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-blue-600">{count}</div>
            <div className="flex justify-center space-x-2">
              <button 
                onClick={() => setCount(count - 1)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                -
              </button>
              <button 
                onClick={() => setCount(0)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Reset
              </button>
              <button 
                onClick={() => setCount(count + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App