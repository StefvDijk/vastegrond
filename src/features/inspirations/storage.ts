import { supabase } from '../../lib/supabase'

const BUCKET = 'inspirations'

// Upload een afbeelding (geplakt of geselecteerd) naar de inspirations-bucket
// en geef het object-path terug. Path: <user-id>/<timestamp>-<random>.<ext>
export async function uploadInspirationImage(file: File | Blob): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? 'anon'

  const ext = inferExtension(file)
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/png',
  })
  if (error) {
    console.error('uploadInspirationImage failed:', error)
    throw new Error(error.message)
  }
  return path
}

export async function deleteInspirationImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('deleteInspirationImage failed:', error)
    // Niet hard falen — DB-rij is belangrijker dan storage-object.
  }
}

// Vraag een signed URL aan voor een private object (1 uur geldig).
export async function getInspirationImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60)
  if (error || !data) {
    console.error('getInspirationImageUrl failed:', error)
    return null
  }
  return data.signedUrl
}

function inferExtension(file: File | Blob): string {
  if (file instanceof File && file.name.includes('.')) {
    return file.name.split('.').pop()!.toLowerCase()
  }
  const type = file.type
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  if (type === 'image/heic') return 'heic'
  return 'bin'
}
