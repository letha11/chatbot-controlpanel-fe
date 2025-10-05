"use client"

import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/DataTable'
import { toast } from 'sonner'
import { MoreHorizontal, Upload, Trash2, Power } from 'lucide-react'

import { useGetDivisionsQuery, useGetDocumentsQuery, useUploadDocumentMutation, useToggleDocumentActiveMutation, useDeleteDocumentMutation } from '@/store/api'
import type { Division, DocumentItem } from '@/types/entities'
import { config } from '@/lib/environment'

export default function DocumentsPage() {
  const { data: divisionsResp } = useGetDivisionsQuery()
  const divisions = divisionsResp?.data || []

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('')
  const [onlyActive, setOnlyActive] = useState<boolean>(false)

  const { data: documentsResp, isLoading, error, refetch } = useGetDocumentsQuery(
    { division_id: selectedDivisionId || undefined, is_active: onlyActive ? true : undefined }
  )
  const documents = documentsResp?.data || []

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadDivision, setUploadDivision] = useState<string>('')
  const [uploadDocument] = useUploadDocumentMutation()
  const [toggleActive, { isLoading: isToggling }] = useToggleDocumentActiveMutation()
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation()

  let divisionMap
  // if (config.division_enabled) {
  //   divisionMap = new Map(divisions.map((d) => [d.id, d.name]))
  // }
  if (config.division_enabled) {
    divisionMap = useMemo(() => new Map(divisions.map((d) => [d.id, d.name])), [divisions])
  } else {
    divisionMap = new Map()
  }

  const handleUpload = async () => {
    if (config.division_enabled) {
      if (!selectedFile || !uploadDivision) {
        toast.error('Please choose a file and division')
        return
      }
    } else {
      if (!selectedFile) {
        toast.error('Please choose a file')
        return
      }
    }
    try {
      setUploading(true)
      await uploadDocument({ file: selectedFile, division_id: uploadDivision }).unwrap()
      toast.success('Document uploaded')
      setUploadOpen(false)
      setSelectedFile(null)
      setUploadDivision('')
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleActive = async (doc: DocumentItem) => {
    try {
      await toggleActive({ id: doc.id, is_active: !doc.is_active }).unwrap()
      toast.success(doc.is_active ? 'Deactivated' : 'Activated')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to toggle')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id).unwrap()
      toast.success('Document deleted')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to delete')
    }
  }

  const renderStatusBadge = (status: DocumentItem['status']) => {
    const variant = status === 'embedded' ? 'default' : status === 'uploaded' || status === 'parsing' ? 'secondary' : 'destructive'
    const text = status.replace('_', ' ')
    return <Badge variant={variant as any}>{text}</Badge>
  }

  const columns: ColumnDef<DocumentItem>[] = [
    {
      accessorKey: 'original_filename',
      header: 'Filename',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.original_filename}</div>
      ),
    },
    {
      accessorKey: 'division_id',
      header: 'Division',
      cell: ({ row }) => (
        <div className="text-sm">{divisionMap.get(row.original.division_id) || row.original.division?.name || '—'}</div>
      ),
    },
    {
      accessorKey: 'file_type',
      header: 'Type',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'uploaded_by',
      header: 'Uploaded By',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at)
        return <div className="text-sm">{date.toLocaleString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const doc = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleToggleActive(doc)}
                disabled={isToggling || (doc.is_active === false && doc.status !== 'embedded')}
              >
                <Power className="mr-2 h-4 w-4" />
                {doc.is_active ? 'Deactivate' : 'Activate'}
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
                    <AlertDialogTitle>Delete document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone and will permanently remove the document and its data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(doc.id)} disabled={isDeleting}>
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
          <h2 className="text-lg font-semibold mb-2">Error loading documents</h2>
          <p className="text-muted-foreground">{(error as any)?.data?.error || 'Failed to load documents'}</p>
        </div>
      </div>
    )
  }

  const total = documents.length
  const activeCount = documents.filter((d) => d.is_active).length
  const inactiveCount = total - activeCount
  const failedCount = documents.filter((d) => d.status === 'failed' || d.status === 'parsing_failed').length

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Upload and manage knowledge base documents.</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              
              <DialogDescription>{config.division_enabled ? 'Select a division and file to upload.' : 'Select a file to upload.'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {config.division_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <select
                    id="division"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={uploadDivision}
                    onChange={(e) => setUploadDivision(e.target.value)}
                  >
                    <option value="">Select division</option>
                    {divisions.map((d: Division) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {config.division_enabled && (
      // {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-division">Division</Label>
              <select
                id="filter-division"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedDivisionId}
                onChange={(e) => setSelectedDivisionId(e.target.value)}
              >
                <option value="">All divisions</option>
                {divisions.map((d: Division) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Active Only</Label>
              <div className="flex items-center gap-3">
                <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
                <span className="text-sm text-muted-foreground">Show only active documents</span>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={config.division_enabled ? columns : columns.filter((c) => c.header !== 'Division')}
            data={documents}
            isLoading={isLoading}
            searchKey="original_filename"
            searchPlaceholder="Search filename..."
          />
        </CardContent>
      </Card>
    </div>
  )
}


