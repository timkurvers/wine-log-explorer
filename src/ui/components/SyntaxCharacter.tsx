import React from 'react'

import { Text } from '@mantine/core'

interface SyntaxCharacterProps {
  children: React.ReactNode
}

const SyntaxCharacter = (props: SyntaxCharacterProps) => {
  const { children } = props
  return (
    <Text fw="bold" c="dimmed" span inherit pl="0.12em" pr="0.12em">
      {children}
    </Text>
  )
}

export default SyntaxCharacter
