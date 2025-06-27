// src/index.js
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './style.css'   // your existing panels/forms CSS
import App from './App'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
