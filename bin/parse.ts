#!/usr/bin/env vite-node

import fs from 'node:fs'
import { Readable } from 'node:stream'
import { parseArgs } from 'node:util'

import parseRelayLog from '../src/parser/parseRelayLog'

const { positionals } = parseArgs({ allowPositionals: true })

const [file] = positionals

const rstream = Readable.toWeb(
  fs.createReadStream(file),
) as unknown as ReadableStream<Uint8Array>

const result = await parseRelayLog(rstream)
console.log(result)
