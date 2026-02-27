import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function SimpleLogin() {
  const [email, setEmail] = useState('kcittda151021@st.uel.edu.vn')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setStatus('Logging in...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
        return
      }

      setStatus(`Success! User: ${data.user.email}`)
      
      // Redirect after 1 second
      setTimeout(() => {
        window.location.href = '/app'
      }, 1000)
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        width: '400px'
      }}>
        <h1>Simple Login Test</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Login
          </button>
        </form>
        {status && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#f0f0f0',
            borderRadius: '6px'
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleLogin
