import { api, uploadFile } from '../../lib/api'

export async function uploadInspirationImage(file: File | Blob): Promise<string> {
  const { path } = await uploadFile('/inspirations/upload', file)
  return path
}

export async function deleteInspirationImage(path: string): Promise<void> {
  try {
    await api.delete(`/inspirations/upload/${encodeURIComponent(path)}`)
  } catch (err) {
    console.error('deleteInspirationImage failed:', err)
  }
}

export function getInspirationImageUrl(path: string): string {
  return `/api/inspirations/images/${encodeURIComponent(path)}`
}
