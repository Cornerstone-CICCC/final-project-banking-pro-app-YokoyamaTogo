import { jest } from '@jest/globals'
import {
  createFsMock,
  createReadlineMock,
  questionMock,
  setReadFileContent,
  writeFileMock,
} from './utils/cliMocks.js'
import { setupCliTest, teardownCliTest } from './utils/testHooks.js'

jest.unstable_mockModule('fs', () => createFsMock())
jest.unstable_mockModule('readline', () => createReadlineMock())

describe('viewTransactionHistory', () => {
  let viewTransactionHistory
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadModule = async () => {
    const module = await import('../src/index.js')
    viewTransactionHistory = module.viewTransactionHistory
  }

  test('prints the transaction table when transactions exist', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 100,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [
            {
              type: 'DEPOSIT',
              amount: 100,
              timestamp: '2025-01-01T00:00:00.000Z',
              balanceAfter: 100,
            },
            {
              type: 'WITHDRAWAL',
              amount: 20,
              timestamp: '2025-01-01T00:00:00.000Z',
              balanceAfter: 80,
            },
          ],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadModule()

    const answers = ['ACC-1000', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await viewTransactionHistory()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('DEPOSIT'))).toBe(true)
    expect(logs.some((text) => text.includes('WITHDRAWAL'))).toBe(true)
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('logs an error when the account is missing', async () => {
    setReadFileContent(JSON.stringify({ accounts: [] }))

    await loadModule()

    const answers = ['ACC-9999', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await viewTransactionHistory()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('Account not found.'))).toBe(true)
  })

  test('warns when no transactions exist', async () => {
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

    await loadModule()

    const answers = ['ACC-1000', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await viewTransactionHistory()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('No transactions found.'))).toBe(true)
  })
})
