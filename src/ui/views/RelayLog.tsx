import React, { useState } from 'react'

import { Group, Paper, RingProgress, Text } from '@mantine/core'

import parseRelayLog from '../../parser/parseRelayLog'
import { useAsyncEffect } from '../hooks'
import { type ExplorerFile } from '../types'

interface RelayLog {
  file: ExplorerFile
}

const RelayLog = (props: RelayLog) => {
  const { file } = props

  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)

  // TODO: Abort parsing on unmount

  useAsyncEffect(async () => {
    if (file.result) {
      return
    }

    file.result = await parseRelayLog(file.file, {
      onReadProgress(bytesRead: number) {
        setProgress((bytesRead / file.file.size) * 100)
      },
    })

    setReady(true)
  }, [])

  if (!ready) {
    return (
      <Group>
        <Paper>
          <RingProgress
            label={
              <Text size="md" ta="center">
                {Math.ceil(progress)} %
              </Text>
            }
            sections={[{ value: progress, color: 'blue' }]}
          />
        </Paper>

        <Text size="xs" ta="center">
          TODO: Waiting for file to be parsed...
        </Text>
      </Group>
    )
  }

  return (
    <div>
      This is the content of the <strong>{file.name}</strong> panel
    </div>
  )
}

export default RelayLog
