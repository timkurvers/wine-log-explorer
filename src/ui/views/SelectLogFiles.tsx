import React, { useRef } from 'react'

import { Anchor, Button, Center, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'

import { IconDownload, IconX } from '@tabler/icons-react'

import Alert from '../components/Alert'
import classes from './SelectLogFiles.module.css'

interface SelectLogFilesProps {
  onSelect: (files: File[]) => void
}

const SelectLogFiles = (props: SelectLogFilesProps) => {
  const theme = useMantineTheme()
  const openRef = useRef<() => void>(null)

  const version = (
    <Anchor
      c="dimmed"
      fw="bold"
      href="https://github.com/timkurvers/wine-log-explorer/compare/v0.4.0...v0.5.0"
      opacity={0.75}
      target="_blank"
    >
      v0.5.0
    </Anchor>
  )

  return (
    <Stack flex={1} justify="space-between" align="center">
      <Stack flex={1} justify="center" maw="75%">
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
          pt={100}
          pb={100}
        >
          <Stack className={classes.dropzone}>
            <Group justify="center">
              <Dropzone.Accept>
                <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconDownload size={50} stroke={1.5} />
              </Dropzone.Idle>
            </Group>

            <Text ta="center" fz="sm" mt="xs" c="dimmed">
              Drag-and-drop one or more Wine log files here.
            </Text>
          </Stack>
        </Dropzone>

        <Center>
          <Button size="md" radius="md" onClick={() => openRef.current?.()}>
            Select Wine log files
          </Button>
        </Center>

        <Alert showLimitations>
          <Text>Files selected are parsed locally in your browser and are not uploaded.</Text>
        </Alert>
      </Stack>

      <Stack align="center" gap="xs">
        <Text size="sm" c="dimmed">
          <strong>&copy;2024 Wine Log Explorer {version}</strong>
        </Text>
        <Text ta="center" size="sm" c="dimmed">
          This project is not affiliated with Wine, the Wine Committee or CodeWeavers.
        </Text>
      </Stack>
    </Stack>
  )
}

export default SelectLogFiles
