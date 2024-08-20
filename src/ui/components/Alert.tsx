import React from 'react'

import { Anchor, Blockquote, Box, Code, MantineColor, Text, Title } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'

interface AlertProps {
  children?: React.ReactNode
  c?: MantineColor
  details?: React.ReactNode
  encourageBugReport?: boolean
  icon?: React.ReactNode
  showLimitations?: boolean
  title?: string
}

const Alert = (props: AlertProps) => {
  const {
    c = 'blue',
    children,
    details,
    encourageBugReport,
    icon = <IconInfoCircle />,
    showLimitations,
    title,
  } = props

  const openissue = (
    <Anchor c={c} fw="bold" href="https://github.com/timkurvers/wine-log-explorer/issues" target="_blank">
      open an issue
    </Anchor>
  )

  const wine = (
    <Anchor
      c={c}
      fw="bold"
      href="https://wiki.winehq.org/FAQ#How_can_I_get_a_debugging_log_(a.k.a._terminal_output)?"
      target="_blank"
    >
      Wine
    </Anchor>
  )

  const cxmac = (
    <Anchor
      c={c}
      fw="bold"
      href="https://support.codeweavers.com/en_US/troubleshooting/creating-a-debug-log"
      target="_blank"
    >
      CrossOver Mac
    </Anchor>
  )

  const cxlinux = (
    <Anchor
      c={c}
      fw="bold"
      href="https://support.codeweavers.com/en_US/2-creating-a-debug-log"
      target="_blank"
    >
      CrossOver Linux
    </Anchor>
  )

  const proton = (
    <Anchor
      c={c}
      fw="bold"
      href="https://github.com/ValveSoftware/Proton/wiki/Proton-FAQ#how-to-enable-proton-logs"
      target="_blank"
    >
      Proton
    </Anchor>
  )

  return (
    <Box p="md">
      <Blockquote variant="light" color={c} icon={icon}>
        {title && (
          <Title order={4} c={c} mb="md">
            {title}
          </Title>
        )}

        {children}

        {showLimitations && (
          <>
            <Text mt="md">
              Currently, log files must be generated with <em>at least</em> <Code>+pid</Code>.
            </Text>
            <Text mt="md">
              Instructions on how to generate logs for {wine}, {cxmac}, {cxlinux} and {proton}.
            </Text>
          </>
        )}

        {encourageBugReport && (
          <Text mt="md">If you believe this to be a bug in Wine Log Explorer, please {openissue}.</Text>
        )}

        {details}
      </Blockquote>
    </Box>
  )
}

export default Alert
