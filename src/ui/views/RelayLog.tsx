import React, { useState } from 'react'

import { Group, MultiSelect, Paper, RingProgress, Stack, Text } from '@mantine/core'
import { AutoSizer, List } from 'react-virtualized'

import parseRelayLog from '../../parser/parseRelayLog'
import { useAsyncEffect } from '../hooks'
import type { ExplorerFile } from '../types'

import RelayLogEntry from './RelayLogEntry'
import classes from './RelayLog.module.css'

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

  const { processes, timeline } = file.result!

  return (
    <Stack className={classes.root}>
      <MultiSelect
        data={processes.map((process) => ({
          value: process.id,
          label: process.name || process.id,
        }))}
      />
      <div className={classes.listContainer}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              width={width}
              height={height}
              overscanRowCount={30}
              rowCount={timeline.length}
              rowHeight={28}
              rowRenderer={({ key, style, index }) => (
                <RelayLogEntry key={key} style={style} entry={timeline[index]} />
              )}
            />
          )}
        </AutoSizer>
      </div>
    </Stack>
  )
}

export default RelayLog
