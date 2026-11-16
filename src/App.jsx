import { useEffect, useState } from 'react'

// The desktop shell passes the core's port as ?core=PORT.
const coreUrl = `http://127.0.0.1:${new URLSearchParams(location.search).get('core') ?? 8080}`

export default function App() {
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let timer
    // Retry until the core has finished starting.
    const load = () =>
      fetch(`${coreUrl}/api/status`)
        .then((res) => res.json())
        .then((data) => setMessage(data.message))
        .catch(() => (timer = setTimeout(load, 500)))
    load()
    return () => clearTimeout(timer)
  }, [])

  return (
    <main>
      <h1>Adertha</h1>
      <p className={message ? 'message' : 'message waiting'}>{message ?? 'Waking the core…'}</p>
    </main>
  )
}
