"use client"

import { useForm, type Resolver, type SubmitHandler, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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

interface DivisionFormProps {
  initialData?: Division
  onSubmit: (data: DivisionFormData) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DivisionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: DivisionFormProps) {
  const form: UseFormReturn<DivisionFormData> = useForm<DivisionFormData>({
    resolver: zodResolver(divisionFormSchema) as Resolver<DivisionFormData>,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      is_active: initialData?.is_active ?? true,
    },
  })

  const handleSubmit: SubmitHandler<DivisionFormData> = async (data: DivisionFormData): Promise<void> => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      {/* <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6"> */}
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
