import React, { useCallback } from 'react'

import { MantineColorScheme, SegmentedControl, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun, IconSunMoon } from '@tabler/icons-react'

const iconProps = {
  display: 'block',
  size: 20,
}

const data = [
  {
    value: 'auto',
    label: (
      <Tooltip label="Auto (browser preference)" offset={10} withArrow={true}>
        <IconSunMoon {...iconProps} />
      </Tooltip>
    ),
  },
  {
    value: 'light',
    label: (
      <Tooltip label="Light" offset={10} withArrow={true}>
        <IconSun {...iconProps} />
      </Tooltip>
    ),
  },
  {
    value: 'dark',
    label: (
      <Tooltip label="Dark" offset={10} withArrow={true}>
        <IconMoon {...iconProps} />
      </Tooltip>
    ),
  },
]

const ColorSchemeSwitcher = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const onSelectColorScheme = useCallback(
    (value: string) => {
      setColorScheme(value as MantineColorScheme)
    },
    [setColorScheme],
  )

  return (
    <SegmentedControl
      data={data}
      onChange={onSelectColorScheme}
      size="sm"
      value={colorScheme}
      withItemsBorders={false}
    />
  )
}

export default ColorSchemeSwitcher
