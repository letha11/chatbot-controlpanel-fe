"use client"

import { useState, useRef, useCallback } from 'react'
import { useForm, type Resolver, type SubmitHandler, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Division } from '@/types/entities'
import { config } from '@/lib/environment'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml']

const divisionFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Division name must be at least 2 characters.',
  }).max(100, {
    message: 'Division name must not exceed 100 characters.',
  }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

type DivisionFormData = z.infer<typeof divisionFormSchema>

export interface DivisionFormSubmitData extends DivisionFormData {
  imageFile?: File | null
  removeImage?: boolean
}

interface DivisionFormProps {
  initialData?: Division
  onSubmit: (data: DivisionFormSubmitData) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DivisionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: DivisionFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form: UseFormReturn<DivisionFormData> = useForm<DivisionFormData>({
    resolver: zodResolver(divisionFormSchema) as Resolver<DivisionFormData>,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      is_active: initialData?.is_active ?? true,
    },
  })

  const hasExistingImage = initialData?.image_path && !removeImage

  const validateAndSetImage = useCallback((file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and SVG are allowed.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('File size exceeds 10MB limit.')
      return
    }
    setImageFile(file)
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetImage(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetImage(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClearNewImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit: SubmitHandler<DivisionFormData> = async (data: DivisionFormData): Promise<void> => {
    await onSubmit({
      ...data,
      imageFile: imageFile,
      removeImage: removeImage,
    })
  }

  const showImageUploader = !imagePreview && !hasExistingImage

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Division Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter division name" {...field} />
              </FormControl>
              <FormDescription>
                A unique name to identify this division.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter division description (optional)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of what this division represents.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Division Image</FormLabel>
          <FormDescription className="text-xs">
            Upload an image for this division. Max 10MB. JPEG, PNG, or SVG.
          </FormDescription>
          
          {imagePreview && (

            <div className="flex justify-center items-center flex-col">
              <div className="relative w-full text-center max-w-[200px]">
                <img
                  src={imagePreview}
                  alt="Division preview"
                  className="w-full h-auto rounded-lg border object-cover aspect-square"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="cursor-pointer absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {hasExistingImage && (
                <p className="text-xs text-muted-foreground mt-1">New image selected</p>
              )}
            </div>
          )}

          {!imagePreview && hasExistingImage && initialData && (
            <div className="flex justify-center items-center">
              <div className="relative w-full text-center max-w-[200px]">
                <img
                  src={`${config.apiBaseUrl}/api/v1/divisions/${initialData.id}/image?t=${new Date(initialData.updated_at).getTime()}`}
                  alt="Division image"
                  className="w-full h-auto rounded-lg border object-cover aspect-square"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="cursor-pointer absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {showImageUploader && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                {isDragOver ? (
                  <Upload className="h-8 w-8 text-primary" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  {isDragOver ? 'Drop image here' : 'Click or drag to upload image'}
                </p>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Active divisions are available for document organization and chatbot queries.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Division' : 'Create Division'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
