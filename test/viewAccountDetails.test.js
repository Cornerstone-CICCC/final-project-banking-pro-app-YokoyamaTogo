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

describe('viewAccountDetails', () => {
  let viewAccountDetails
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadModule = async () => {
    const module = await import('../src/index.js')
    viewAccountDetails = module.viewAccountDetails
  }

  test('displays stored account details', async () => {
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

    await viewAccountDetails()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)

    expect(logs.some((text) => text.includes('Account: ACC-1000'))).toBe(true)
    expect(logs.some((text) => text.includes('Holder: Alice'))).toBe(true)
    expect(logs.some((text) => text.includes('Balance: $100.00'))).toBe(true)
    expect(logs.some((text) => text.includes('Opened: 2025-01-01'))).toBe(true)
  })

  test('error for missing account', async () => {
    setReadFileContent(JSON.stringify({ accounts: [] }))

    await loadModule()

    const answers = ['ACC-9999', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await viewAccountDetails()

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('Account not found.'))).toBe(true)
  })
})
