import Feed from './components/Feed'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex justify-center">
      {/* Phone frame for desktop */}
      <div className="w-full max-w-[420px] bg-gray-100 min-h-screen shadow-2xl relative">
        <Feed />
      </div>
    </div>
  )
}

export default App
