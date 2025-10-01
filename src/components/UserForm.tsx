"use client"

import { useForm, type Resolver } from 'react-hook-form'
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
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelectItem } from '@/components/ui/select'
import type { User } from '@/types/auth'

const userFormSchemaBase = z.object({
  name: z
    .string()
    .min(2, {
      message: 'User name must be at least 2 characters.',
    })
    .max(100, {
      message: 'User name must not exceed 100 characters.',
    }),
  username: z
    .string()
    .min(2, {
      message: 'User username must be at least 2 characters.',
    })
    .max(100, {
      message: 'User username must not exceed 100 characters.',
    }),
  password: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(5, { message: 'Password must be at least 5 characters.' }).optional()
  ),
  role: z.enum(['admin', 'super_admin', 'user']),
  is_active: z.boolean(),
})

const getUserFormSchema = (isCreating: boolean) =>
  isCreating
    ? userFormSchemaBase.refine((val) => !!val.password, {
        path: ['password'],
        message: 'Password is required.',
      })
    : userFormSchemaBase

type UserFormData = z.infer<typeof userFormSchemaBase>

interface UserFormProps {
  initialData?: User
  onSubmit: (data: UserFormData) => void | Promise<void>
  onCancel: () => void
  isCreating?: boolean
  isLoading?: boolean
}

export function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isCreating = false,
  isLoading = false,
}: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(getUserFormSchema(isCreating)) as Resolver<UserFormData>,
    defaultValues: {
      name: initialData?.name || '',
      username: initialData?.username || '',
      password: '',
      role: initialData?.role || 'user',
      is_active: initialData?.is_active ?? true,
    },
  })

  const handleSubmit = async (data: UserFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter user name" {...field} />
              </FormControl>
              <FormDescription>
                A full name to identify this user.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter user username"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A unique username to identify this user.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password {!isCreating ? ' (Optional)' : ''}</FormLabel>
              <FormControl>
                <Input
                  placeholder={`Enter user password ${!isCreating ? ' (Optional)' : ''}`}
                  type="password"
                  // type={isCreating ? 'text' : 'password'}
                  // disabled={!isCreating}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A password to login to this user. {!isCreating ? 'This field is optional.' : 'This field is required.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Select
                  {...field}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    {['admin', 'super_admin', 'user'].map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                The role of this user.
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
              <div className="space-y-0.5 mr-4">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Active users are available for document organization and chatbot queries.
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
            {isLoading ? 'Saving...' : initialData ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
