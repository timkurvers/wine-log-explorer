import { describe, expect, it } from 'vitest'

import { stripIndent } from '../utils/index'

import parseWineLog from './parseWineLog'
import {
  type LogProcess,
  type LogEntry,
  LogEntryType,
  type LogEntryCall,
  type LogEntryReturn,
} from './types'

describe('parseWineLog', () => {
  const input = stripIndent`
    ** Thu Jul 11 21:44:13 2024
    Starting 'bin/wineloader' 'lib/wine/x86_64-windows/winewrapper.exe' '--run' '--'
    'C:\\winmemdump\\build\\winmemdump' 'nonexistent.exe'

    wineserver: using server-side synchronization.
    00c8:00cc:Call PE DLL (proc=00006FFFFFFAB810,module=00006FFFFFF40000 L"ntdll.dll",reason=PROCESS_ATTACH,res=000000000021FB00)
    00c8:00cc:Ret  PE DLL (proc=00006FFFFFFAB810,module=00006FFFFFF40000 L"ntdll.dll",reason=PROCESS_ATTACH,res=000000000021FB00) retval=1
    00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
    00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
    00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000 L"Random String with )") ret=140001656
    00c8:00cc:fixme:thread:get_thread_times not implemented on this platform
    00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
    00c8:00cc:Ret  ntdll.RtlRunOnceExecuteOnce() retval=00000000 ret=6fffffc88542
    00c8:00cc:Ret  KERNEL32.CreateToolhelp32Snapshot() retval=00000050 ret=140001656
  `

  const processes: LogProcess[] = [
    {
      id: '00c8',
      name: null,
      threads: [
        {
          id: '00cc',
          name: null,
        },
      ],
    },
  ]

  const process00c8 = processes[0]
  const thread00cc = process00c8.threads[0]

  const entries: LogEntry[] = [
    {
      id: 0,
      process: process00c8,
      thread: thread00cc,
      class: 'trace',
      channel: 'module',
      logger: 'map_image_into_view',
      message:
        'mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000',
    },
    {
      id: 1,
      process: process00c8,
      thread: thread00cc,
      class: 'trace',
      channel: 'module',
      logger: 'map_image_into_view',
      message:
        'mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000',
    },
    {
      id: 2,
      process: process00c8,
      thread: thread00cc,
      type: LogEntryType.CALL,
      module: 'KERNEL32',
      func: 'CreateToolhelp32Snapshot',
      args: ['00000002', '00000000 L"Random String with )"'],
      callsite: '140001656',
    },
    {
      id: 3,
      process: process00c8,
      thread: thread00cc,
      class: 'fixme',
      channel: 'thread',
      logger: 'get_thread_times',
      message: 'not implemented on this platform',
    },
    {
      id: 4,
      process: process00c8,
      thread: thread00cc,
      type: LogEntryType.CALL,
      module: 'ntdll',
      func: 'RtlRunOnceExecuteOnce',
      args: ['6fffffcc4780', '6fffffc8b790', '00000000', '00000000'],
      callsite: '6fffffc88542',
      inlinable: true,
    },
    {
      id: 5,
      process: process00c8,
      thread: thread00cc,
      type: LogEntryType.RETURN,
      module: 'ntdll',
      func: 'RtlRunOnceExecuteOnce',
      retval: '00000000',
      callsite: '6fffffc88542',
    },
    {
      id: 6,
      process: process00c8,
      thread: thread00cc,
      type: LogEntryType.RETURN,
      module: 'KERNEL32',
      func: 'CreateToolhelp32Snapshot',
      retval: '00000050',
      callsite: '140001656',
    },
  ]

  // Restore circular references
  const kernelSnapshotCall = entries[2] as LogEntryCall
  const __threadTimes = entries[3]
  const __ntdllExecCall = entries[4] as LogEntryCall
  const ____ntdllExecRet = entries[5] as LogEntryReturn
  const __kernelSnapshotRet = entries[6] as LogEntryReturn

  __threadTimes.parent = kernelSnapshotCall
  __ntdllExecCall.parent = kernelSnapshotCall
  ____ntdllExecRet.parent = __ntdllExecCall
  __kernelSnapshotRet.parent = kernelSnapshotCall

  kernelSnapshotCall.return = __kernelSnapshotRet
  __ntdllExecCall.return = ____ntdllExecRet

  it('parses given Wine log', async () => {
    const result = await parseWineLog(input)

    expect(result.processes).toEqual(processes)
    expect(result.entries).toEqual(entries)
  })

  describe('when Wine log is intertwined due to multi-threaded logging', () => {
    const malformed = stripIndent`
      ** Thu Jul 11 21:44:13 2024
      Starting 'bin/wineloader' 'lib/wine/x86_64-windows/winewrapper.exe' '--run' '--'
      'C:\\winmemdump\\build\\winmemdump' 'nonexistent.exe'

      wineserver: using server-side synchronization.

      00c8:00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
      00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000 L"Random String with )") ret=140001656
      00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
      00c8:00cc:fix00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
      me:thread:get_thread_times not implemented on this platform
      00c8:00cc:Ret  ntdll.RtlRunOnceExecuteOnce() ret00c8:00cc:Ret  KERNEL32.CreateToolhelp32Snapshot() retval=00000050 ret=140001656
      val=00000000 ret=6fffffc88542
    `

    it('reconstructs and parses given Wine log regardless', async () => {
      const result = await parseWineLog(malformed)

      expect(result.processes).toEqual(processes)
      expect(result.entries).toEqual(entries)
    })
  })

  describe('when Wine log contains multi-byte utf8 characters', () => {
    it('preserves these in the parsed result', async () => {
      const fancy = stripIndent`
        ** Thu Jul 11 21:44:13 2024
        00c8:00cc:trace:locale:print_fancy_chars (a Ā 𐀀 文 🦄)
      `

      const result = await parseWineLog(fancy)

      expect(result.processes).toEqual(processes)
      expect(result.entries).toEqual([
        {
          id: 0,
          process: process00c8,
          thread: thread00cc,
          channel: 'locale',
          class: 'trace',
          logger: 'print_fancy_chars',
          message: '(a Ā 𐀀 文 🦄)',
        },
      ])
    })
  })

  describe('when Wine log contains process and thread information', () => {
    it('exposes this in the parsed result', async () => {
      const info = stripIndent`
        ** Thu Jul 11 21:44:13 2024
        00aa:00aa:trace:module:get_load_order looking for L"C:\\\\path\\\\to\\\\process.exe"
        00aa:00aa:trace:module:get_load_order looking for L"C:\\\\windows\\\\system32\\\\kernel32.dll"
        00aa:00aa:warn:threadname:NtSetInformationThread Thread renamed to L"initial thread name"
        00aa:00aa:warn:threadname:NtSetInformationThread Thread renamed to L"thread name"
      `

      const result = await parseWineLog(info)

      const processes: LogProcess[] = [
        {
          id: '00aa',
          name: 'process.exe',
          path: 'C:\\path\\to\\process.exe',
          threads: [
            {
              id: '00aa',
              name: 'thread name',
            },
          ],
        },
      ]

      const process00aa = processes[0]
      const thread00aa = process00aa.threads[0]

      expect(result.processes).toEqual(processes)
      expect(result.entries).toEqual([
        {
          id: 0,
          process: process00aa,
          thread: thread00aa,
          channel: 'module',
          class: 'trace',
          logger: 'get_load_order',
          message: 'looking for L"C:\\\\path\\\\to\\\\process.exe"',
        },
        {
          id: 1,
          process: process00aa,
          thread: thread00aa,
          channel: 'module',
          class: 'trace',
          logger: 'get_load_order',
          message: 'looking for L"C:\\\\windows\\\\system32\\\\kernel32.dll"',
        },
        {
          id: 2,
          process: process00aa,
          thread: thread00aa,
          channel: 'threadname',
          class: 'warn',
          logger: 'NtSetInformationThread',
          message: 'Thread renamed to L"initial thread name"',
        },
        {
          id: 3,
          process: process00aa,
          thread: thread00aa,
          channel: 'threadname',
          class: 'warn',
          logger: 'NtSetInformationThread',
          message: 'Thread renamed to L"thread name"',
        },
      ])
    })
  })
})
