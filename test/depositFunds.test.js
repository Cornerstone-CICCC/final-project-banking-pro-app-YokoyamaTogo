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

describe('depositFunds', () => {
  let depositFunds
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadDepositModule = async () => {
    const module = await import('../src/index.js')
    depositFunds = module.depositFunds
  }

  test('deposits a positive amount to an existing account', async () => {
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

    await loadDepositModule()

    const answers = ['ACC-1000', '50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await depositFunds()

    const [_filePath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    const account = savedData.accounts[0]
    expect(account.balance).toBe(150)
    expect(account.transactions[0]).toMatchObject({
      type: 'DEPOSIT',
      amount: 50,
      balanceAfter: 150,
      description: 'Deposit',
    })
  })

  test('error when the target account does not exist', async () => {
    setReadFileContent(JSON.stringify({ accounts: [] }))

    await loadDepositModule()

    const answers = ['ACC-9999', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await depositFunds()

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

    await loadDepositModule()

    const answers = ['ACC-1000', '-50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await depositFunds()

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

    await loadDepositModule()

    const answers = ['ACC-1000', 'abc', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await depositFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
