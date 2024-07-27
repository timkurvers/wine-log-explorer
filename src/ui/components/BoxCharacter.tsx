import React from 'react'

import { Text } from '@mantine/core'

interface BoxCharacterProps {
  children: React.ReactNode
}

const BoxCharacter = (props: BoxCharacterProps) => {
  const { children } = props
  return (
    <Text ff="monospace" c="dimmed" opacity={0.5} pl="0.5em">
      {children}
    </Text>
  )
}

const BoxCharacterEnd = () => {
  return <BoxCharacter>┗</BoxCharacter>
}

const BoxCharacterPipe = () => {
  return <BoxCharacter>┃</BoxCharacter>
}

BoxCharacter.End = BoxCharacterEnd
BoxCharacter.Pipe = BoxCharacterPipe

export default BoxCharacter
