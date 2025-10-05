import { useMemo } from 'react'
import { useGetDivisionsQuery, useGetDocumentsQuery, useGetUsersQuery } from '@/store/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { config } from '@/lib/environment'

export default function DashboardPage() {
  const { data: divisionsResp, isLoading: isDivisionsLoading } = useGetDivisionsQuery()
  const { data: documentsResp, isLoading: isDocumentsLoading } = useGetDocumentsQuery()
  const { data: usersResp, isLoading: isUsersLoading } = useGetUsersQuery()

  const users = usersResp?.data ?? []
  const divisions = divisionsResp?.data ?? []
  
  const { totalDocuments, activeDocuments, inactiveDocuments, byStatus } = useMemo(() => {
    const documents = documentsResp?.data ?? []
    const totalDocuments = documents.length
    const activeDocuments = documents.filter((d) => d.is_active).length
    const inactiveDocuments = totalDocuments - activeDocuments

    const byStatus: Record<string, number> = {}
    for (const doc of documents) {
      byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1
    }

    return { totalDocuments, activeDocuments, inactiveDocuments, byStatus }
  }, [documentsResp?.data])

  const isLoading = isDivisionsLoading || isDocumentsLoading || isUsersLoading

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

      {/* Top-level metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{isLoading ? '—' : users.length}</div>
          </CardContent>
        </Card>

        {config.division_enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Divisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{isLoading ? '—' : divisions.length}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Documents (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{isLoading ? '—' : totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">{isLoading ? '—' : activeDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Inactive Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{isLoading ? '—' : inactiveDocuments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents by status */}
      <Card>
        <CardHeader>
          <CardTitle>Documents by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(byStatus).length === 0 ? (
                <div className="text-muted-foreground">No documents found.</div>
              ) : (
                Object.entries(byStatus).map(([status, count]) => (
                  <Badge key={status} variant="secondary" className="px-3 py-1">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="ml-2 font-semibold">{count}</span>
                  </Badge>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
