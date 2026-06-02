import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { syncNitroSsrBridge } from '@/lib/nitro-ssr-bridge'

const tempDirs: string[] = []

function createTempDir(): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'nitro-ssr-bridge-'))
  tempDirs.push(tempDir)
  return tempDir
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

describe('syncNitroSsrBridge', () => {
  it('throws when source directory is missing', () => {
    const tempDir = createTempDir()
    const missingSrcDir = path.join(tempDir, 'missing-ssr')
    const destDir = path.join(tempDir, 'dist', 'server')

    expect(() =>
      syncNitroSsrBridge({
        srcDir: missingSrcDir,
        destDir,
      })
    ).toThrow(`Nitro SSR bridge source missing: ${missingSrcDir}`)
  })

  it('cleans stale destination and materializes server.js from index.js', () => {
    const tempDir = createTempDir()
    const srcDir = path.join(tempDir, 'node_modules', '.nitro', 'vite', 'services', 'ssr')
    const destDir = path.join(tempDir, 'dist', 'server')

    mkdirSync(path.join(srcDir, 'assets'), { recursive: true })
    writeFileSync(path.join(srcDir, 'index.js'), 'fresh index payload')
    writeFileSync(path.join(srcDir, 'assets', 'manifest.json'), '{"fresh":true}')

    mkdirSync(destDir, { recursive: true })
    writeFileSync(path.join(destDir, 'server.js'), 'stale payload')
    writeFileSync(path.join(destDir, 'stale.txt'), 'remove me')

    const result = syncNitroSsrBridge({ srcDir, destDir })

    expect(result.sourceEntryPath).toBe(path.join(destDir, 'index.js'))
    expect(result.destEntryPath).toBe(path.join(destDir, 'server.js'))
    expect(readFileSync(path.join(destDir, 'server.js'), 'utf8')).toBe(
      'fresh index payload'
    )
    expect(readFileSync(path.join(destDir, 'index.js'), 'utf8')).toBe(
      'fresh index payload'
    )
    expect(readFileSync(path.join(destDir, 'assets', 'manifest.json'), 'utf8')).toBe(
      '{"fresh":true}'
    )
    expect(existsSync(path.join(destDir, 'stale.txt'))).toBe(false)
  })

  it('preserves source server.js when Nitro already emits expected entry', () => {
    const tempDir = createTempDir()
    const srcDir = path.join(tempDir, 'node_modules', '.nitro', 'vite', 'services', 'ssr')
    const destDir = path.join(tempDir, 'dist', 'server')

    mkdirSync(srcDir, { recursive: true })
    writeFileSync(path.join(srcDir, 'server.js'), 'native server entry')

    const result = syncNitroSsrBridge({ srcDir, destDir })

    expect(result.sourceEntryPath).toBe(path.join(destDir, 'server.js'))
    expect(result.destEntryPath).toBe(path.join(destDir, 'server.js'))
    expect(readFileSync(path.join(destDir, 'server.js'), 'utf8')).toBe(
      'native server entry'
    )
  })
})
