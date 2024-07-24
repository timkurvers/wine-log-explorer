import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './ui/App'

const root = createRoot(document.querySelector('#container')!)
root.render(<App />)
