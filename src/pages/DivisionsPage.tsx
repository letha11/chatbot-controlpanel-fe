"use client"

import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { DataTable } from '@/components/DataTable'
import { DivisionForm } from '@/components/DivisionForm'
import {
  useGetDivisionsQuery,
  useCreateDivisionMutation,
  useUpdateDivisionMutation,
  useDeleteDivisionMutation,
} from '@/store/api'
import type { Division } from '@/types/entities'

export default function DivisionsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)

  const { data: divisionsResponse, isLoading, error } = useGetDivisionsQuery()
  const [createDivision, { isLoading: isCreating }] = useCreateDivisionMutation()
  const [updateDivision, { isLoading: isUpdating }] = useUpdateDivisionMutation()
  const [deleteDivision, { isLoading: isDeleting }] = useDeleteDivisionMutation()

  const divisions = divisionsResponse?.data || []

  const handleCreateDivision = async (data: { name: string; description?: string; is_active: boolean }) => {
    try {
      await createDivision(data).unwrap()
      toast.success('Division created successfully')
      setCreateDialogOpen(false)
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to create division')
    }
  }

  const handleUpdateDivision = async (data: { name: string; description?: string; is_active: boolean }) => {
    if (!editingDivision) return
    
    try {
      await updateDivision({ id: editingDivision.id, data }).unwrap()
      toast.success('Division updated successfully')
      setEditDialogOpen(false)
      setEditingDivision(null)
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to update division')
    }
  }

  const handleDeleteDivision = async (id: string) => {
    try {
      await deleteDivision(id).unwrap()
      toast.success('Division deleted successfully')
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to delete division')
    }
  }

  const handleEditDivision = (division: Division) => {
    setEditingDivision(division)
    setEditDialogOpen(true)
  }

  const columns: ColumnDef<Division>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string
        return (
          <div className="text-sm text-muted-foreground max-w-[300px] truncate">
            {description || 'No description'}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const division = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditDivision(division)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the division
                      "{division.name}" and may affect associated documents.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteDivision(division.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Error loading divisions</h2>
          <p className="text-muted-foreground">
            {(error as any)?.data?.error || 'Failed to load divisions'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Divisions</h1>
          <p className="text-muted-foreground">
            Manage your organizational divisions and their settings.
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Division
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Division</DialogTitle>
              <DialogDescription>
                Add a new division to organize your documents and chatbot knowledge base.
              </DialogDescription>
            </DialogHeader>
            <DivisionForm
              onSubmit={handleCreateDivision}
              isLoading={isCreating}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{divisions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {divisions.filter(d => d.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {divisions.filter(d => !d.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Divisions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={divisions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Edit Division Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Division</DialogTitle>
            <DialogDescription>
              Update the division details and settings.
            </DialogDescription>
          </DialogHeader>
          {editingDivision && (
            <DivisionForm
              initialData={editingDivision}
              onSubmit={handleUpdateDivision}
              isLoading={isUpdating}
              onCancel={() => {
                setEditDialogOpen(false)
                setEditingDivision(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
