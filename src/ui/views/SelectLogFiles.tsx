import React, { useRef } from 'react'

import { Dropzone } from '@mantine/dropzone'
import { Button, Center, Group, Stack, Text, useMantineTheme, rem } from '@mantine/core'

import { IconDownload, IconX } from '@tabler/icons-react'

import classes from './SelectLogFiles.module.css'

interface SelectLogFilesProps {
  onSelect: (files: File[]) => void
}

const SelectLogFiles = (props: SelectLogFilesProps) => {
  const theme = useMantineTheme()
  const openRef = useRef<() => void>(null)

  // TODO: Add instructions / FAQ on how to generate compatible Wine logs (incl. relay)

  return (
    <Stack flex={1} justify="space-between" align="center">
      <Stack flex={1} justify="center" maw="50%">
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
          p="xl"
        >
          <Stack className={classes.dropzone}>
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
              Drag-and-drop one or more Wine log files here.
              <br />
              <strong>Note</strong>: The log files selected are not uploaded to any server.
            </Text>
          </Stack>
        </Dropzone>

        <Center>
          <Button size="md" radius="md" onClick={() => openRef.current?.()}>
            Select Wine log files
          </Button>
        </Center>
      </Stack>

      <Stack align="center" gap="xs">
        <Text size="sm" c="dimmed">
          {/* TODO: Version information and comparison link */}
          <strong>&copy;2024 Wine Log Explorer</strong>
        </Text>
        <Text ta="center" size="sm" c="dimmed">
          This project is not affiliated with Wine, the Wine Committee or CodeWeavers.
        </Text>
      </Stack>
    </Stack>
  )
}

export default SelectLogFiles
