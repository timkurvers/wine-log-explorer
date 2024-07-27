import React from 'react'

import { AppShell, Badge, Button, Group, MantineProvider, Title } from '@mantine/core'
import { IconBrandGithubFilled, IconGlassFullFilled } from '@tabler/icons-react'

import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'

import ErrorBoundary from './components/ErrorBoundary'
import Explorer from './Explorer'

import classes from './App.module.css'

const App = () => {
  return (
    <MantineProvider forceColorScheme="dark">
      <AppShell header={{ height: 60 }}>
        <AppShell.Header className={classes.header}>
          <Group mih={55} justify="space-between">
            <Group gap="xs">
              <IconGlassFullFilled color="#A50D0D" size={36} />

              <Title order={1}>Wine Log Explorer</Title>

              <Badge variant="light" color="blue">
                pre-alpha
              </Badge>
            </Group>

            <Group>
              {/* TODO: Color scheme switching */}
              {/* <Button disabled pl="xs" pr="xs" >
                <IconSun />
              </Button> */}

              <Button
                color="gray"
                component="a"
                href="https://github.com/timkurvers/wine-log-explorer"
                leftSection={<IconBrandGithubFilled size="1rem" stroke={1.5} />}
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
