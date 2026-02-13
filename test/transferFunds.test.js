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

describe('transferFunds', () => {
  let transferFunds
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadTransferModule = async () => {
    const module = await import('../src/index.js')
    transferFunds = module.transferFunds
  }

  test('moves funds between two existing accounts', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 200,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
        {
          id: 'ACC-2000',
          holderName: 'Bob',
          balance: 50,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-2000', '50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    const [_filePath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    const fromAccount = savedData.accounts.find((account) => account.id === 'ACC-1000')
    const toAccount = savedData.accounts.find((account) => account.id === 'ACC-2000')

    expect(fromAccount.balance).toBe(150)
    expect(fromAccount.transactions[0]).toMatchObject({
      type: 'TRANSFER_OUT',
      amount: 50,
      balanceAfter: 150,
      description: 'To ACC-2000',
    })

    expect(toAccount.balance).toBe(100)
    expect(toAccount.transactions[0]).toMatchObject({
      type: 'TRANSFER_IN',
      amount: 50,
      balanceAfter: 100,
      description: 'From ACC-1000',
    })
  })

  test('credits destination accounts ending with 7 as normal transfers', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 200,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
        {
          id: 'ACC-1007',
          holderName: 'Eve',
          balance: 25,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-1007', '50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    const [_filepath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    const toAccount = savedData.accounts.find((account) => account.id === 'ACC-1007')

    expect(toAccount.balance).toBe(75)
    expect(toAccount.transactions[0]).toMatchObject({
      type: 'TRANSFER_IN',
      amount: 50,
      balanceAfter: 75,
      description: 'From ACC-1000',
    })
  })

  test('records transfer-in transactions even when amount exceeds 500', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 1000,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
        {
          id: 'ACC-2000',
          holderName: 'Bob',
          balance: 50,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-2000', '600', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    const [_filepath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    const toAccount = savedData.accounts.find((account) => account.id === 'ACC-2000')

    expect(toAccount.balance).toBe(650)
    expect(toAccount.transactions[0]).toMatchObject({
      type: 'TRANSFER_IN',
      amount: 600,
      balanceAfter: 650,
      description: 'From ACC-1000',
    })
  })

  test('error when the source account does not exist', async () => {
    setReadFileContent(JSON.stringify({ accounts: [] }))

    await loadTransferModule()

    const answers = ['ACC-9999', 'ACC-2000', '50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects negative value', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 200,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
        {
          id: 'ACC-2000',
          holderName: 'Bob',
          balance: 50,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-2000', '-50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects non-numeric value', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 200,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
        {
          id: 'ACC-2000',
          holderName: 'Bob',
          balance: 50,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-2000', 'abc', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects transfers that exceed the source balance', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 100,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
        {
          id: 'ACC-2000',
          holderName: 'Bob',
          balance: 50,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-2000', '150', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('error when the destination account does not exist', async () => {
    const dummyData = {
      accounts: [
        {
          id: 'ACC-1000',
          holderName: 'Alice',
          balance: 200,
          createdAt: '2025-01-01T00:00:00.000Z',
          transactions: [],
        },
      ],
    }
    setReadFileContent(JSON.stringify(dummyData))

    await loadTransferModule()

    const answers = ['ACC-1000', 'ACC-9999', '50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await transferFunds()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

})
