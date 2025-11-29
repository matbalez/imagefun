import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Success from './Success';
import './index.css'

function Home() {
  const [word, setWord] = useState('')
  const [feeling, setFeeling] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate();

  const handleWordChange = (e) => {
    const val = e.target.value
    if (!val.includes(' ')) {
      setWord(val)
      setError('')
    }
  }

  const handleFeelingChange = (e) => {
    const val = e.target.value
    if (!val.includes(' ')) {
      setFeeling(val)
      setError('')
    }
  }

  const handleGenerate = async () => {
    if (!word || !feeling) {
      setError('Please fill in both fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Create Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, feeling })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout')
      }

      const data = await response.json()

      if (data.checkoutUrl) {
        // 2. Redirect to MoneyDevKit
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (err) {
      setError(err.message)
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="content">


        <div className="input-group">
          <input
            type="text"
            value={word}
            onChange={handleWordChange}
            placeholder="WORD"
            className="huge-input"
            disabled={loading}
          />
          <input
            type="text"
            value={feeling}
            onChange={handleFeelingChange}
            placeholder="FEELING"
            className="huge-input"
            disabled={loading}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button
          onClick={handleGenerate}
          className="make-button"
          disabled={loading || !word || !feeling}
        >
          {loading ? 'PREPARING CHECKOUT...' : 'MAKE'}
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </Router>
  )
}

export default App
