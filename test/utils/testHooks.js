import { jest } from '@jest/globals'
import {
  createInterfaceMock,
  questionMock,
  setReadFileContent,
  writeFileMock,
} from './cliMocks.js'

export function setupCliTest() {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

  questionMock.mockReset()
  writeFileMock.mockClear()
  createInterfaceMock.mockClear()

  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  const consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {})

  jest.resetModules()
  setReadFileContent('{}')

  return { consoleLogSpy, consoleClearSpy }
}

export function teardownCliTest({ consoleLogSpy, consoleClearSpy }) {
  jest.useRealTimers()
  consoleLogSpy?.mockRestore()
  consoleClearSpy?.mockRestore()
}
