import React from 'react'

import { AppShell, Badge, Button, Group, MantineProvider, Title } from '@mantine/core'
import { IconBrandGithubFilled, IconGlassFullFilled } from '@tabler/icons-react'

import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'

import ColorSchemeSwitcher from './components/ColorSchemeSwitcher'
import ErrorBoundary from './components/ErrorBoundary'
import Explorer from './Explorer'

import classes from './App.module.css'

const App = () => {
  return (
    <MantineProvider defaultColorScheme="auto">
      <AppShell header={{ height: 60 }}>
        <AppShell.Header className={classes.header}>
          <Group mih={55} justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <IconGlassFullFilled color="#A50D0D" size={36} />

              <Title order={1} textWrap="nowrap" visibleFrom="sm">
                Wine Log Explorer
              </Title>

              <Badge variant="light" color="blue" visibleFrom="sm">
                alpha
              </Badge>
            </Group>

            <Group wrap="nowrap">
              <ColorSchemeSwitcher />

              <Button
                color="gray"
                component="a"
                href="https://github.com/timkurvers/wine-log-explorer"
                leftSection={<IconBrandGithubFilled size="16" stroke={1.5} />}
                target="_blank"
                variant="outline"
              >
                Visit GitHub project
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main className={classes.main}>
          <ErrorBoundary>
            <Explorer />
          </ErrorBoundary>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  )
}

export default App
