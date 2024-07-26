import React from 'react'

import { AppShell, Badge, Button, Flex, MantineProvider, Title } from '@mantine/core'
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
        <AppShell.Header>
          <Flex align="center" direction="row" gap="md" justify="flex-start" mih={55}>
            <IconGlassFullFilled color="#A50D0D" size={36} />

            <Title order={1}>Wine Relay Explorer</Title>

            <Badge variant="light" color="blue">
              pre-alpha
            </Badge>

            <Button
              color="gray"
              component="a"
              href="https://github.com/timkurvers/wine-relay-explorer"
              leftSection={<IconBrandGithubFilled size="1rem" stroke={1.5} />}
              target="_blank"
              variant="outline"
            >
              Visit GitHub project
            </Button>
          </Flex>
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
