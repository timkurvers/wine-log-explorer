import React, { useCallback, useState } from 'react'

import { CloseButton, Tabs } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'

import RelayLog from './views/RelayLog'
import SelectRelayLog from './views/SelectRelayLog'
import type { ExplorerFile } from './types'

import classes from './Explorer.module.css'

const Explorer = () => {
  const [files, setFiles] = useState<ExplorerFile[]>([])
  const [activeTab, setActiveTab] = useState<string | null>('new')

  const parseSelectedFiles = useCallback(
    (selectedFiles: File[]) => {
      const added = selectedFiles.map((file) => ({
        uuid: crypto.randomUUID(),
        name: file.name,
        file,
      }))
      setFiles(files.concat(added))

      if (activeTab === 'new') {
        setActiveTab(added[0].uuid)
      }
    },
    [activeTab, files],
  )

  const onFileClose = useCallback(
    (e: React.MouseEvent, fileToClose: ExplorerFile) => {
      e.stopPropagation()

      const remaining = files.filter((file) => file !== fileToClose)
      setFiles(remaining)

      if (activeTab === fileToClose.uuid) {
        const index = files.findIndex((file) => file === fileToClose)
        setActiveTab(remaining[index]?.uuid || 'new')
      }
    },
    [activeTab, files],
  )

  return (
    <Tabs radius="xs" value={activeTab} onChange={setActiveTab} className={classes.tabs}>
      <Tabs.List>
        {files.map((file) => (
          <Tabs.Tab
            key={file.uuid}
            value={file.uuid}
            // TODO: Add hover state
            rightSection={<CloseButton size="sm" onClick={(e) => onFileClose(e, file)} />}
          >
            {file.name}
          </Tabs.Tab>
        ))}
        <Tabs.Tab value="new">
          <IconPlus size={16} />
        </Tabs.Tab>
      </Tabs.List>

      {files.map((file) => (
        <Tabs.Panel key={file.uuid} value={file.uuid} p="md" className={classes.tabsPanel}>
          <RelayLog file={file} />
        </Tabs.Panel>
      ))}

      <Tabs.Panel value="new" p="md" className={classes.tabsPanel}>
        <SelectRelayLog onSelect={parseSelectedFiles} />
      </Tabs.Panel>
    </Tabs>
  )
}

export default Explorer
