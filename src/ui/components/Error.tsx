import React from 'react'

import { Anchor, Blockquote, Box, Text, Title } from '@mantine/core'
import { IconExclamationCircle } from '@tabler/icons-react'

import classes from './Error.module.css'

interface ErrorProps {
  error: Error
}

const Error = (props: ErrorProps) => {
  const { error } = props

  const openissue = (
    <Anchor c="red" fw="bold" href="https://github.com/timkurvers/wine-log-explorer/issues">
      open an issue
    </Anchor>
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
    <Box p="md">
      <Blockquote variant="light" color="red" icon={<IconExclamationCircle />}>
        <Title order={4} c="red" mb="md">
          Whoops, an error occurred!
        </Title>

        <Text>If you believe this to be a bug in Wine Log Explorer, please {openissue}.</Text>

        <pre className={classes.pre}>
          {label}
          {stack}
        </pre>
      </Blockquote>
    </Box>
  )
}

export default Error
