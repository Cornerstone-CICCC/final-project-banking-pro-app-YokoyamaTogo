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

describe('deleteAccount', () => {
  let deleteAccount
  let consoleLogSpy
  let consoleClearSpy

  beforeEach(() => ({ consoleLogSpy, consoleClearSpy } = setupCliTest()))
  afterEach(() => teardownCliTest({ consoleLogSpy, consoleClearSpy }))

  const loadModule = async () => {
    const module = await import('../src/index.js')
    deleteAccount = module.deleteAccount
  }

  test('removes an existing account', async () => {
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

    await deleteAccount()

    const [_filePath, content] = writeFileMock.mock.calls[0]
    const savedData = JSON.parse(content)
    expect(savedData.accounts).toHaveLength(0)
  })

  test('reports error when the account is absent', async () => {
    setReadFileContent(
      JSON.stringify({
        accounts: [
          {
            id: 'ACC-1000',
            holderName: 'Alice',
            balance: 0,
            createdAt: '2025-01-01T00:00:00.000Z',
            transactions: [],
          },
        ],
      })
    )

    await loadModule()

    const answers = ['ACC-9999', '']
    questionMock.mockImplementation((prompt, cb) => cb(answers.shift()))

    await deleteAccount()

    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
