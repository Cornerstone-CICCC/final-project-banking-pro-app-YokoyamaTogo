import { jest } from '@jest/globals'

const buildReadlineMock = (answers) => {
  const question = jest.fn((prompt, cb) => {
    const next = answers.shift()
    if (next !== undefined) cb(next)
  })
  const close = jest.fn()
  const createInterface = jest.fn(() => ({ question, close }))
  return { question, close, createInterface }
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve))

const runMainWithAnswers = async (answers, data = { accounts: [] }) => {
  const readlineMock = buildReadlineMock(answers)
  const fsMock = {
    existsSync: jest.fn(() => true),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(() => JSON.stringify(data)),
    writeFile: jest.fn((filePath, content, callbackFn) => {
      if (typeof callbackFn === 'function') callbackFn(null)
    }),
  }

  jest.unstable_mockModule('readline', () => ({
    default: { createInterface: readlineMock.createInterface },
  }))
  jest.unstable_mockModule('fs', () => ({ default: fsMock }))

  await import('../src/index.js')
  await flushMicrotasks()

  return { readlineMock, fsMock }
}

describe('main', () => {
  let consoleLogSpy
  let exitSpy
  let priorSigintListeners

  beforeEach(() => {
    priorSigintListeners = process.listeners('SIGINT')
    process.removeAllListeners('SIGINT')

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    exitSpy.mockRestore()

    process.removeAllListeners('SIGINT')
    priorSigintListeners.forEach((listener) => process.on('SIGINT', listener))
  })

  test('covers menu options 1-9 and default in a single run', async () => {
    jest.resetModules()

    const answers = [
      '1',
      'Alice',
      '100',
      '',
      '2',
      'ACC-9999',
      '',
      '3',
      '',
      '4',
      'ACC-9999',
      '',
      '5',
      'ACC-9999',
      '',
      '6',
      'ACC-9999',
      'ACC-2000',
      '50',
      '',
      '7',
      'ACC-9999',
      '',
      '8',
      'ACC-9999',
      '',
      '0',
      '',
      '9',
    ]

    await runMainWithAnswers([...answers])

    const logs = consoleLogSpy.mock.calls.map(([message]) => message)
    expect(logs.some((text) => text.includes('Create New Account'))).toBe(true)
    expect(logs.some((text) => text.includes('View Account Details'))).toBe(true)
    expect(logs.some((text) => text.includes('All Accounts'))).toBe(true)
    expect(logs.some((text) => text.includes('Deposit Funds'))).toBe(true)
    expect(logs.some((text) => text.includes('Withdraw Funds'))).toBe(true)
    expect(logs.some((text) => text.includes('Transfer Between Accounts'))).toBe(true)
    expect(logs.some((text) => text.includes('Transaction History'))).toBe(true)
    expect(logs.some((text) => text.includes('Delete Account'))).toBe(true)
    expect(logs.some((text) => text.includes('Invalid option. Please select 1-9.'))).toBe(true)
    expect(exitSpy).toHaveBeenCalledWith(0)
  })
})
