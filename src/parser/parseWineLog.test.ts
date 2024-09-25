import { beforeEach, describe, expect, it } from 'vitest'

import { stripIndent } from '../utils/index'

import parseWineLog from './parseWineLog'
import { type LogProcess, type LogEntry, LogEntryType, type LogEntryCall, type LogEntryReturn } from './types'

describe('parseWineLog', () => {
  const input = stripIndent`
    00c8:00cc:Call PE DLL (proc=00006FFFFFFAB810,module=00006FFFFFF40000 L"ntdll.dll",reason=PROCESS_ATTACH,res=000000000021FB00)
    00c8:00cc:Ret  PE DLL (proc=00006FFFFFFAB810,module=00006FFFFFF40000 L"ntdll.dll",reason=PROCESS_ATTACH,res=000000000021FB00) retval=1
    00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
    00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
    00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000 L"Random String with )") ret=140001656
    00c8:00cc:fixme:thread:get_thread_times not implemented on this platform
    00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
    00c8:00ff:fixme:thread:inline_disruptor this should not interfere with inlinability (different thread)
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
        {
          id: '00ff',
          name: null,
        },
      ],
    },
  ]

  const [process00c8] = processes
  const [thread00cc, thread00ff] = process00c8.threads

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
      thread: thread00ff,
      class: 'fixme',
      channel: 'thread',
      logger: 'inline_disruptor',
      message: 'this should not interfere with inlinability (different thread)',
    },
    {
      id: 6,
      process: process00c8,
      thread: thread00cc,
      type: LogEntryType.RETURN,
      module: 'ntdll',
      func: 'RtlRunOnceExecuteOnce',
      retval: '00000000',
      callsite: '6fffffc88542',
    },
    {
      id: 7,
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
  const ____ntdllExecRet = entries[6] as LogEntryReturn
  const __kernelSnapshotRet = entries[7] as LogEntryReturn

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

  it('parses edge-case entries correctly', async () => {
    const edgecases = stripIndent`
      00c8:00cc:fixme:d3d:wined3d_guess_card_vendor Received unrecognized GL_VENDOR "Apple". Returning HW_VENDOR_NVIDIA.
      00c8:00cc:Starting thread proc 00006FFFFDA19130 (arg=000000002D0F0040)
      00c8:00cc:trace:msvcrt:_initialize_wide_environment
      00c8:00ff:fixme:secur32:get_cipher_algid unknown algorithm 23
    `

    const result = await parseWineLog(edgecases)

    expect(result.processes).toEqual(processes)
    expect(result.entries).toEqual([
      {
        id: 0,
        process: process00c8,
        thread: thread00cc,
        channel: 'd3d',
        class: 'fixme',
        logger: 'wined3d_guess_card_vendor',
        message: 'Received unrecognized GL_VENDOR "Apple". Returning HW_VENDOR_NVIDIA.',
      },
      {
        id: 1,
        process: process00c8,
        thread: thread00cc,
        channel: '',
        // Defaulting to `trace` as `Starting` is not a Wine debug class
        class: 'trace',
        logger: '',
        message: 'Starting thread proc 00006FFFFDA19130 (arg=000000002D0F0040)',
      },
      {
        id: 2,
        process: process00c8,
        thread: thread00cc,
        channel: 'msvcrt',
        class: 'trace',
        logger: '_initialize_wide_environment',
        message: '',
      },
      {
        id: 3,
        process: process00c8,
        thread: thread00ff,
        channel: 'secur32',
        class: 'fixme',
        logger: 'get_cipher_algid',
        message: 'unknown algorithm 23',
      },
    ])
  })

  describe('when Wine log is intertwined due to multi-threaded logging', () => {
    const malformed = stripIndent`
      00c8:00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
      00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000 L"Random String with )") ret=140001656
      00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
      00c8:00cc:fix00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
      me:thread:get_thread_times not implemented on this platform
      00c8:00ff:fixme:thread:inline_disruptor this should not interfere with inlinability (different thread)
      00c8:00cc:Ret  ntdll.RtlRunOnceExecuteOnce() ret00c8:00cc:Ret  KERNEL32.CreateToolhelp32Snapshot() retval=00000050 ret=140001656
      val=00000000 ret=6fffffc88542
    `

    it('reconstructs and parses given Wine log regardless', async () => {
      const result = await parseWineLog(malformed)

      expect(result.processes).toEqual(processes)
      expect(result.entries).toEqual(entries)
    })
  })

  describe('when Wine log contains timestamps', () => {
    const timestamped = stripIndent`
      202122.112:00c8:202122.337:00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\windows\\\\system32\\\\ntdll.dll" at 0x6ffffff40000-0x6ffffffe6000
      202122.562:00c8:00cc:Call KERNEL32.CreateToolhelp32Snapshot(00000002,00000000 L"Random String with )") ret=140001656
      00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
      202122.787:00c8:00cc:fix202123.012:00c8:00cc:Call ntdll.RtlRunOnceExecuteOnce(6fffffcc4780,6fffffc8b790,00000000,00000000) ret=6fffffc88542
      me:thread:get_thread_times not implemented on this platform
      202123.237:00c8:00ff:fixme:thread:inline_disruptor this should not interfere with inlinability (different thread)
      202123.462:00c8:00cc:Ret  ntdll.RtlRunOnceExecuteOnce() ret202123.687:00c8:00cc:Ret  KERNEL32.CreateToolhelp32Snapshot() retval=00000050 ret=140001656
      val=00000000 ret=6fffffc88542
    `

    beforeEach(() => {
      for (const entry of entries) {
        // Above input is constructed such that each entry is timestamped 225ms after the previous one
        entry.time = entry.id * 225
      }
    })

    it('exposes these timestamps in the parsed result', async () => {
      const result = await parseWineLog(timestamped)

      expect(result.processes).toEqual(processes)
      expect(result.entries).toEqual(entries)
    })
  })

  describe('when Wine log contains multi-byte utf8 characters', () => {
    it('preserves these in the parsed result', async () => {
      const fancy = stripIndent`
        00c8:00cc:trace:locale:print_fancy_chars (a Ā 𐀀)
        00c8:00ff:trace:locale:print_fancy_chars (文 🦄)
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
          message: '(a Ā 𐀀)',
        },
        {
          id: 1,
          process: process00c8,
          thread: thread00ff,
          channel: 'locale',
          class: 'trace',
          logger: 'print_fancy_chars',
          message: '(文 🦄)',
        },
      ])
    })
  })

  describe('when Wine log contains process and thread information', () => {
    it('exposes this in the parsed result', async () => {
      const info = stripIndent`
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

      const [process00aa] = processes
      const [thread00aa] = process00aa.threads

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

  describe('when Wine log contains text / non-formatted output', () => {
    it('includes these as text entries in the parsed result', async () => {
      const input = stripIndent`
        ** Thu Jul 11 21:44:13 2024
        Starting 'bin/wineloader' 'lib/wine/x86_64-windows/winewrapper.exe' '--run' '--'
        'C:\\winmemdump\\build\\winmemdump' 'nonexistent.exe'

        wineserver: using server-side synchronization.
        00c8:00cc:trace:module:map_image_into_view mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000
        00c8:00ff:fixme:thread:creator a random message
      `

      const result = await parseWineLog(input)

      expect(result.processes).toEqual(processes)
      expect(result.entries).toEqual([
        {
          id: 0,
          type: LogEntryType.TEXT,
          text: '** Thu Jul 11 21:44:13 2024',
        },
        {
          id: 1,
          type: LogEntryType.TEXT,
          text: "Starting 'bin/wineloader' 'lib/wine/x86_64-windows/winewrapper.exe' '--run' '--'",
        },
        {
          id: 2,
          type: LogEntryType.TEXT,
          text: "'C:\\winmemdump\\build\\winmemdump' 'nonexistent.exe'",
        },
        {
          id: 3,
          type: LogEntryType.TEXT,
          text: '',
        },
        {
          id: 4,
          type: LogEntryType.TEXT,
          text: 'wineserver: using server-side synchronization.',
        },
        {
          id: 5,
          process: process00c8,
          thread: thread00cc,
          channel: 'module',
          class: 'trace',
          logger: 'map_image_into_view',
          message:
            'mapping PE file L"\\\\??\\\\C:\\\\winmemdump\\\\build\\\\winmemdump.exe" at 0x140000000-0x140a84000',
        },
        {
          id: 6,
          process: process00c8,
          thread: thread00ff,
          channel: 'thread',
          class: 'fixme',
          logger: 'creator',
          message: 'a random message',
        },
      ])
    })
  })
})
