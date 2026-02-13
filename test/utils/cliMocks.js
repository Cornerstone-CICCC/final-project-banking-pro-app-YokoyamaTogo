import { jest } from '@jest/globals'

// Mock async fs.writeFile behavior. Invoke callback immediately as success after write.
export const writeFileMock = jest.fn((filePath, content, callbackFn) => {
  if (typeof callbackFn === 'function') callbackFn(null)
})

// Stub for the question function called when receiving user input.
export const questionMock = jest.fn()
// Emulate readline.createInterface return and inject questionMock.
export const createInterfaceMock = jest.fn(() => ({
  question: questionMock,
}))

// Holds file content read by the CLI. Overwritten per test as needed.
let readFileContent = '{}'
// Mock for fs.readFileSync. Returns the variable above to simulate file presence.
export const readFileSyncMock = jest.fn(() => readFileContent)
// Utility to switch readFileContent. Set expected file content per test.
export function setReadFileContent(content = '{}') {
  readFileContent = content
}

// Mock replacing the entire fs module. Provides write/read used by the CLI.
export function createFsMock() {
  return {
    default: {
      writeFile: writeFileMock,
      existsSync: jest.fn(() => true), // Returns whether file exists as boolean. Always true here.
      writeFileSync: jest.fn(), // Creates a file. No-op here.
      readFileSync: readFileSyncMock,
    },
  }
}

// readline mock. createInterface returns questionMock to simulate CLI interaction.
export function createReadlineMock() {
  return {
    default: {
      createInterface: createInterfaceMock,
    },
  }
}
