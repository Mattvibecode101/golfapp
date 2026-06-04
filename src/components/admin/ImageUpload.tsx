import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'course-images',
  folder = 'courses',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
    toast.success('Image uploaded')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const handleRemove = async () => {
    if (!value) return
    // Extract path from public URL to delete from storage
    const url = new URL(value)
    const pathParts = url.pathname.split(`/object/public/${bucket}/`)
    if (pathParts[1]) {
      await supabase.storage.from(bucket).remove([pathParts[1]])
    }
    onChange(null)
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value ? (
        <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video">
          <img src={value} alt="Course" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="hidden group-hover:flex items-center gap-1.5 bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-md shadow"
            >
              <Upload className="h-3.5 w-3.5" />
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="hidden group-hover:flex items-center gap-1.5 bg-destructive text-white text-xs font-medium px-3 py-1.5 rounded-md shadow"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed aspect-video cursor-pointer transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">Drop image here or click to upload</p>
              <p className="text-xs opacity-60">JPG, PNG, WebP · max 5 MB</p>
            </div>
          )}
        </div>
      )}

      {/* URL input as fallback */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Or paste an image URL..."
          value={value ?? ''}
          onChange={e => onChange(e.target.value || null)}
          className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
