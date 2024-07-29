import React from 'react'

import { IconExclamationCircle } from '@tabler/icons-react'

import classes from './Error.module.css'

import Alert from './Alert'

interface ErrorProps {
  error: Error
}

const Error = (props: ErrorProps) => {
  const { error } = props

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
    <Alert
      c="red"
      details={
        <pre className={classes.pre}>
          {label}
          {stack}
        </pre>
      }
      encourageBugReport
      icon={<IconExclamationCircle />}
      title="Whoops, an error occurred!"
    />
  )
}

export default Error
