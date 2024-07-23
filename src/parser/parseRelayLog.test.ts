import { describe, expect, it } from 'vitest'

import { stripIndent } from '../utils/index'

import parseRelayLog from './parseRelayLog'
import { type RelayProcess } from './types'

describe('parseRelayLog', () => {
  const input = stripIndent`
    ** Thu Jul 11 21:44:13 2024
    Starting 'bin/wineloader' 'lib/wine/x86_64-windows/winewrapper.exe' '--run' '--'
    'C:\\winmemdump\\build\\winmemdump' 'nonexistent.exe'

    wineserver: using server-side synchronization.
    00c8:00cc:Call PE DLL (proc=00006FFFFFFAB810,module=00006FFFFFF40000 L"ntdll.dll",reason=PROCESS_ATTACH,res=000000000021FB00)
    00c8:00cc:Ret  PE DLL (proc=00006FFFFFFAB810,module=00006FFFFFF40000 L"ntdll.dll",reason=PROCESS_ATTACH,res=000000000021FB00) retval=1
    00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
    00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
    00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000) ret=140001656
    00c8:00cc:fixme:thread:get_thread_times not implemented on this platform
    00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
    00c8:00cc:Ret  ntdll.RtlRunOnceExecuteOnce() retval=00000000 ret=6fffffc88542
    00c8:00cc:Ret  KERNEL32.CreateToolhelp32Snapshot() retval=00000050 ret=140001656
  `

  const timeline = [
    {
      index: 0,
      pid: '00c8',
      tid: '00cc',
      class: 'trace',
      channel: 'module',
      logger: 'map_image_into_view',
      message:
        'mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000',
    },
    {
      index: 1,
      pid: '00c8',
      tid: '00cc',
      class: 'trace',
      channel: 'module',
      logger: 'map_image_into_view',
      message:
        'mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000',
    },
    {
      index: 2,
      pid: '00c8',
      tid: '00cc',
      type: 'Call',
      module: 'KERNEL32',
      func: 'CreateToolhelp32Snapshot',
      args: ['00000002', '00000000'],
      ret: '140001656',
    },
    {
      index: 3,
      pid: '00c8',
      tid: '00cc',
      class: 'fixme',
      channel: 'thread',
      logger: 'get_thread_times',
      message: 'not implemented on this platform',
    },
    {
      index: 4,
      pid: '00c8',
      tid: '00cc',
      type: 'Call',
      module: 'ntdll',
      func: 'RtlRunOnceExecuteOnce',
      args: ['6fffffcc4780', '6fffffc8b790', '00000000', '00000000'],
      ret: '6fffffc88542',
    },
    {
      index: 5,
      pid: '00c8',
      tid: '00cc',
      type: 'Ret',
      module: 'ntdll',
      func: 'RtlRunOnceExecuteOnce',
      retval: '00000000',
      ret: '6fffffc88542',
    },
    {
      index: 6,
      pid: '00c8',
      tid: '00cc',
      type: 'Ret',
      module: 'KERNEL32',
      func: 'CreateToolhelp32Snapshot',
      retval: '00000050',
      ret: '140001656',
    },
  ]

  const processes: RelayProcess[] = []

  it('parses given relay log', async () => {
    const result = await parseRelayLog(input)

    expect(result.processes).toEqual(processes)
    expect(result.timeline).toEqual(timeline)
  })

  describe('when input is intertwined due to multi-threaded logging', () => {
    const malformed = stripIndent`
      ** Thu Jul 11 21:44:13 2024
      Starting 'bin/wineloader' 'lib/wine/x86_64-windows/winewrapper.exe' '--run' '--'
      'C:\\winmemdump\\build\\winmemdump' 'nonexistent.exe'

      wineserver: using server-side synchronization.

      00c8:00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
      00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000) ret=140001656
      00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
      00c8:00cc:fix00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
      me:thread:get_thread_times not implemented on this platform
      00c8:00cc:Ret  ntdll.RtlRunOnceExecuteOnce() ret00c8:00cc:Ret  KERNEL32.CreateToolhelp32Snapshot() retval=00000050 ret=140001656
      val=00000000 ret=6fffffc88542
    `

    it('reconstructs and parses given relay log regardless', async () => {
      const result = await parseRelayLog(malformed)

      expect(result.processes).toEqual(processes)
      expect(result.timeline).toEqual(timeline)
    })
  })

  describe('when input contains multi-byte utf8 characters', () => {
    it('preserves these in the parsed result', async () => {
      const fancy = stripIndent`
        ** Thu Jul 11 21:44:13 2024
        00c8:00cc:trace:locale:print_fancy_chars (a Ā 𐀀 文 🦄)
      `

      const result = await parseRelayLog(fancy)

      expect(result.processes).toEqual([])
      expect(result.timeline).toEqual([
        {
          channel: 'locale',
          class: 'trace',
          index: 0,
          logger: 'print_fancy_chars',
          message: '(a Ā 𐀀 文 🦄)',
          pid: '00c8',
          tid: '00cc',
        },
      ])
    })
  })
})
