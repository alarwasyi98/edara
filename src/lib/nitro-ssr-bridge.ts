import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
} from 'node:fs'
import path from 'node:path'

export interface SyncNitroSsrBridgeOptions {
  srcDir?: string
  destDir?: string
}

export interface SyncNitroSsrBridgeResult {
  sourceEntryPath: string
  destEntryPath: string
}

export function syncNitroSsrBridge(
  options: SyncNitroSsrBridgeOptions = {}
): SyncNitroSsrBridgeResult {
  const srcDir = options.srcDir ?? 'node_modules/.nitro/vite/services/ssr'
  const destDir = options.destDir ?? 'dist/server'

  if (!existsSync(srcDir)) {
    throw new Error(`Nitro SSR bridge source missing: ${srcDir}`)
  }

  rmSync(destDir, { recursive: true, force: true })
  mkdirSync(destDir, { recursive: true })
  cpSync(srcDir, destDir, { recursive: true })

  const destServerEntryPath = path.join(destDir, 'server.js')

  if (existsSync(destServerEntryPath)) {
    return {
      sourceEntryPath: destServerEntryPath,
      destEntryPath: destServerEntryPath,
    }
  }

  const destIndexEntryPath = path.join(destDir, 'index.js')

  if (!existsSync(destIndexEntryPath)) {
    throw new Error(
      `Nitro SSR bridge could not find index.js or server.js in ${destDir}`
    )
  }

  copyFileSync(destIndexEntryPath, destServerEntryPath)

  return {
    sourceEntryPath: destIndexEntryPath,
    destEntryPath: destServerEntryPath,
  }
}
