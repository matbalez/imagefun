import { useState } from 'react'
import './index.css'

function App() {
  const [word, setWord] = useState('')
  const [feeling, setFeeling] = useState('')
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')

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
    setImage(null)

    try {
      // Call backend API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word, feeling })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()

      if (data.image) {
        setImage(data.image)
      } else {
        throw new Error('No image data received from server')
      }

    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
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
          {loading ? 'GENERATING...' : 'MAKE'}
        </button>

        {image && (
          <div className="result-container">
            <img src={image} alt={`${word} with ${feeling} feeling`} className="generated-image" />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
