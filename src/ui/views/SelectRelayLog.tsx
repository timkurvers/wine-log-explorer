import React, { useRef } from 'react'

import { Dropzone } from '@mantine/dropzone'
import { Button, Center, Group, Text, useMantineTheme, rem } from '@mantine/core'

import { IconDownload, IconX } from '@tabler/icons-react'

interface SelectRelayLogProps {
  onSelect: (files: File[]) => void
}

const SelectRelayLog = (props: SelectRelayLogProps) => {
  const theme = useMantineTheme()
  const openRef = useRef<() => void>(null)

  // TODO: Add instructions / FAQ on how to generate relay logs

  return (
    <div>
      <Dropzone
        openRef={openRef}
        onDrop={(files) => {
          props.onSelect(files)
        }}
        onReject={(...args) => {
          // TODO: Error handling
          console.error('rejected', { props, args })
        }}
        radius="md"
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.blue[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconDownload style={{ width: rem(50), height: rem(50) }} stroke={1.5} />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Drag-and-drop relay logs here to process. Alternatively, use the button below.
            <br />
            <strong>Note</strong>: The log files selected are not uploaded to any server.
          </Text>
        </div>
      </Dropzone>

      <Center>
        <Button size="md" radius="xl" onClick={() => openRef.current?.()}>
          Select relay logs
        </Button>
      </Center>
    </div>
  )
}

export default SelectRelayLog
