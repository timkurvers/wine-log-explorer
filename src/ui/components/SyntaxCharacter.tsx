import React from 'react'

import { MantineSize, Text } from '@mantine/core'

interface SyntaxCharacterProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  size?: MantineSize
}

const SyntaxCharacter = (props: SyntaxCharacterProps) => {
  const { children, size } = props

  const textProps = size ? { size } : { span: true, inherit: true }

  return (
    <Text fw="bold" c="dimmed" pl="0.12em" pr="0.12em" {...textProps}>
      {children}
    </Text>
  )
}

export default SyntaxCharacter
