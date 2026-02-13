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

describe('withdrawFunds', () => {
  let withdrawFunds
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadWithdrawModule = async () => {
    const module = await import('../src/index.js')
    withdrawFunds = module.withdrawFunds
  }

  test('withdraws from an existing account', async () => {
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

    await loadWithdrawModule()

    const answers = ['ACC-1000', '40', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await withdrawFunds()

    const [_filePath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    const account = savedData.accounts[0]
    expect(account.balance).toBe(60)
    expect(account.transactions[0]).toMatchObject({
      type: 'WITHDRAWAL',
      amount: 40,
      balanceAfter: 60,
      description: 'Withdrawal',
    })
  })

  test('error when account does not exist', async () => {
    setReadFileContent(JSON.stringify({ accounts: [] }))

    await loadWithdrawModule()

    const answers = ['ACC-9999', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await withdrawFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects withdrawals that exceed the balance', async () => {
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

    await loadWithdrawModule()

    const answers = ['ACC-1000', '150', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await withdrawFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects negative value', async () => {
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

    await loadWithdrawModule()

    const answers = ['ACC-1000', '-20', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await withdrawFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects non-numeric value', async () => {
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

    await loadWithdrawModule()

    const answers = ['ACC-1000', 'abc', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await withdrawFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
