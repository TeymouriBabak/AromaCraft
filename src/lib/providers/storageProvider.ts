export interface StorageProvider {
  saveFile: (path: string, buffer: Buffer, mimeType: string) => Promise<string> // returns public path/url
  deleteFile?: (path: string) => Promise<void>
}

export type StorageProviderName = 'local_files' | 's3'
