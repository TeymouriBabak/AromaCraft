import fs from 'fs/promises'
import path from 'path'
import { StorageProvider } from '../storageProvider'

const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads')

function resolveSafeRelativePath(relativePath: string): string {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('Invalid storage path.')
  }

  if (path.isAbsolute(relativePath) || relativePath.startsWith('/')) {
    throw new Error('Storage paths must be relative.')
  }

  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalized) {
    throw new Error('Storage path is empty.')
  }

  const segments = normalized.split('/').filter(Boolean)
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('Storage paths must not contain traversal segments.')
  }

  const candidate = path.resolve(uploadsRoot, ...segments)
  const root = path.resolve(uploadsRoot)
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    throw new Error('Storage path escapes uploads root.')
  }

  return segments.join('/')
}

export const localStorageProvider: StorageProvider = {
  saveFile: async (relativePath, buffer, _mimeType) => {
    void _mimeType
    const safeRelativePath = resolveSafeRelativePath(relativePath)
    const filePath = path.resolve(uploadsRoot, safeRelativePath)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    return `/uploads/${safeRelativePath.replace(/\\/g, '/')}`
  },
  deleteFile: async (relativePath) => {
    const safeRelativePath = resolveSafeRelativePath(relativePath)
    const filePath = path.resolve(uploadsRoot, safeRelativePath)
    await fs.unlink(filePath).catch(() => undefined)
  },
}
