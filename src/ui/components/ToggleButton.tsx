import React from 'react'

import { ActionIcon, MantineColor, Tooltip } from '@mantine/core'

interface ToggleButtonProps extends React.DOMAttributes<HTMLButtonElement> {
  active?: boolean
  children?: React.ReactNode
  c?: MantineColor
  tooltip: string
}

const ToggleButton = (props: ToggleButtonProps) => {
  const { active = true, c, children, tooltip, ...rest } = props

  const stateProps = active
    ? {
        c,
        color: 'dimmed',
        variant: 'default',
      }
    : {
        c: 'dimmed',
        color: 'dimmed',
        variant: 'default',
        opacity: 0.5,
      }

  return (
    <Tooltip label={tooltip} withArrow>
      <ActionIcon size={36} {...stateProps} {...rest}>
        {children}
      </ActionIcon>
    </Tooltip>
  )
}

ToggleButton.Group = ActionIcon.Group

export default ToggleButton
