import React from 'react'

import { Paper } from '@mantine/core'

interface ErrorProps {
  error: Error
}

const Error = (props: ErrorProps) => {
  const { error } = props

  const openissue = (
    <a href="https://github.com/timkurvers/wine-relay-explorer/issues">open an issue</a>
  )

  const { name, message } = error
  const label = `${name ? `${name}: ` : ''}${message}\n`

  // Normalize stack between V8-based browsers and Firefox/Safari
  let { stack } = error
  if (stack) {
    if (stack.startsWith(label)) {
      stack = stack.replace(label, '')
    } else {
      stack = stack.replace(/^/gm, '    at ')
    }
  }

  return (
    <Paper>
      <div>
        <h3>Whoops, an error occurred!</h3>

        <p>If you believe this to be a bug in Wine Relay Explorer, please {openissue}.</p>

        <details>
          <summary>Technical details</summary>
          <pre>
            {label}
            {stack}
          </pre>
        </details>
      </div>
    </Paper>
  )
}

export default Error
