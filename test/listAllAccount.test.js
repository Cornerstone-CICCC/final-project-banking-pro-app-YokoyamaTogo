import { jest } from '@jest/globals'
import {
  createFsMock,
  createReadlineMock,
  questionMock,
  setReadFileContent
} from './utils/cliMocks.js'
import { setupCliTest, teardownCliTest } from './utils/testHooks.js'

jest.unstable_mockModule('fs', () => createFsMock())
jest.unstable_mockModule('readline', () => createReadlineMock())

describe('listAllAccounts', () => {
  let listAllAccounts
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadListAllAccountsModule = async () => {
    const module = await import('../src/index.js')
    listAllAccounts = module.listAllAccounts
  }

  test('shows stored accounts table and totals', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 100,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadListAllAccountsModule()

    questionMock.mockImplementation((prompt, cb) => cb(''))

    await listAllAccounts()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('ACC-1000'))).toBe(true)
    expect(logs.some((text) => text.includes('Alice'))).toBe(true)
    expect(logs.some((text) => text.includes('Total accounts: 1'))).toBe(true)
    expect(logs.some((text) => text.includes('Total balance: $100.00'))).toBe(true)
  })

  test('alerts when no accounts exist', async () => {
    setReadFileContent('{}')

    await loadListAllAccountsModule()

    questionMock.mockImplementation((prompt, cb) => cb(''))

    await listAllAccounts()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('No accounts found.'))).toBe(true)
  })
})
