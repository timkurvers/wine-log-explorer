import React from 'react'

import { Text } from '@mantine/core'

import classes from './ChevronCharacter.module.css'

interface ChevronCharacterProps {
  expanded: boolean
  onClick: React.MouseEventHandler<HTMLElement>
}

const ChevronCharacter = (props: ChevronCharacterProps) => {
  const { expanded = false, onClick } = props

  return (
    <Text className={classes.chevron} ff="monospace" c="dimmed" onClick={onClick} span>
      {expanded ? '▼' : '▶'}
    </Text>
  )
}

export default ChevronCharacter
