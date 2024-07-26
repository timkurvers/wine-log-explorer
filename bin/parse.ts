#!/usr/bin/env vite-node

import fs from 'node:fs'
import { Readable } from 'node:stream'
import { parseArgs } from 'node:util'

import parseWineLog from '../src/parser/parseWineLog'

const { positionals } = parseArgs({ allowPositionals: true })

const [file] = positionals

const rstream = Readable.toWeb(fs.createReadStream(file)) as unknown as ReadableStream<Uint8Array>

const result = await parseWineLog(rstream)
console.log(result)
