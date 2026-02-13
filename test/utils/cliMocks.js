import { jest } from '@jest/globals'

// fs.writeFile の非同期的な振る舞いを模したモック。書き込み後コールバックを即座に成功として呼び出す。
export const writeFileMock = jest.fn((filePath, content, callbackFn) => {
  if (typeof callbackFn === 'function') callbackFn(null)
})

// ユーザー入力を受け取る部分で呼ばれる question 関数のスタブ。
export const questionMock = jest.fn()
// readline.createInterface の戻り値を模倣し、questionMock を注入する。
export const createInterfaceMock = jest.fn(() => ({
  question: questionMock,
}))

// CLI が読み込むファイル内容を保持する変数。テストごとに書き換えて対応。
let readFileContent = '{}'
// fs.readFileSync のモック。上の変数を返すだけでファイルの有無を疑似。
export const readFileSyncMock = jest.fn(() => readFileContent)
// readFileContent を切り替えるユーティリティ。各テストで期待するファイル内容をセットする。
export function setReadFileContent(content = '{}') {
  readFileContent = content
}

// fs モジュール全体を置き換えるモック。CLI が呼び出す write/read 周りをまとめて提供する。
export function createFsMock() {
  return {
    default: {
      writeFile: writeFileMock,
      existsSync: jest.fn(() => true), // ファイルが存在するかを boolean で返す。ここでは常にtrue.
      writeFileSync: jest.fn(), // ファイルを作成する。ここでは何もしない。
      readFileSync: readFileSyncMock,
    },
  }
}

// readline モック。createInterface で questionMock を返して CLI の対話をシミュレート。
export function createReadlineMock() {
  return {
    default: {
      createInterface: createInterfaceMock,
    },
  }
}
