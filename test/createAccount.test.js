import { jest } from '@jest/globals'
import {
  createFsMock,
  createReadlineMock,
  questionMock,
  writeFileMock
} from './utils/cliMocks.js'
import { setupCliTest, teardownCliTest } from './utils/testHooks.js'

jest.unstable_mockModule('fs', () => createFsMock())
jest.unstable_mockModule('readline', () => createReadlineMock())

describe('createAccount', () => {
  let createAccount
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadModule = async () => {
    const module = await import('../src/index.js')
    createAccount = module.createAccount
  }

  test('creates a new account and saves data', async () => {
    await loadModule()

    const answers = ['Alice', '100', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    const originalRandom = Math.random
    Math.random = () => 0

    await createAccount()

    Math.random = originalRandom

    expect(writeFileMock).toHaveBeenCalledTimes(1)

    // Get filePath and content from the first call's argument array.
    const [_filepath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    expect(savedData.accounts).toHaveLength(1)

    const account = savedData.accounts[0]
    expect(account).toMatchObject({
      id: 'ACC-1000',
      holderName: 'Alice',
      balance: 100,
      createdAt: '2025-01-01T00:00:00.000Z',
    })

    expect(account.transactions).toHaveLength(1)
    expect(account.transactions[0]).toMatchObject({
      type: 'DEPOSIT',
      amount: 100,
      timestamp: '2025-01-01T00:00:00.000Z',
      balanceAfter: 100,
      description: 'Initial deposit',
    })
  })

  test('rejects empty account holder name', async () => {
    await loadModule()

    const answers = ['', '100', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await createAccount()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('defaults missing initial deposit to 0', async () => {
    const answers = ['Alice', '', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    const originalRandom = Math.random
    Math.random = () => 0

    await createAccount()

    Math.random = originalRandom

    const [_filepath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    const account = savedData.accounts[0]
    expect(account.balance).toBe(0)
    expect(account.transactions[0]).toMatchObject({
      type: 'DEPOSIT',
      amount: 0,
      balanceAfter: 0,
      description: 'Initial deposit',
    })
  })

  test('rejects negative initial deposit', async () => {
    const answers = ['Carol', '-50', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await createAccount()

    expect(writeFileMock).not.toHaveBeenCalled()
  })

  test('rejects non-numeric initial deposit', async () => {
    const answers = ['Dave', 'abc', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await createAccount()

    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
