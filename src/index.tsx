import React from 'react'
import { createRoot } from 'react-dom/client'

import Explorer from './ui/Explorer'

const root = createRoot(document.querySelector('.explorer')!)
root.render(<Explorer />)
