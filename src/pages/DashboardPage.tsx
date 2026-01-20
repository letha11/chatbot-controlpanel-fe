import { useMemo } from 'react'
import {
  useGetDivisionsQuery,
  useGetDocumentsQuery,
  useGetUsersQuery,
  useGetAllConversationsQuery,
} from '@/store/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { config } from '@/lib/environment'
import { useAppSelector } from '@/store/hooks'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth)
  const { data: divisionsResp, isLoading: isDivisionsLoading } = useGetDivisionsQuery()
  const { data: documentsResp, isLoading: isDocumentsLoading } = useGetDocumentsQuery()
  const { data: conversationsResp, isLoading: isConversationsLoading } =
    useGetAllConversationsQuery({
      limit: 200,
    })
  const { data: usersResp, isLoading: isUsersLoading } = useGetUsersQuery(undefined, {
    skip: user?.role !== 'super_admin',
  })

  const users = usersResp?.data ?? []
  const divisions = divisionsResp?.data ?? []
  const documents = documentsResp?.data ?? []
  const conversations = conversationsResp?.data?.conversations ?? []
  
  const {
    totalDocuments,
    activeDocuments,
    inactiveDocuments,
    divisionActivity,
    documentsOverTime,
    chatByDivision,
  } = useMemo(() => {
    const totalDocuments = documents.length
    const activeDocuments = documents.filter((d) => d.is_active).length
    const inactiveDocuments = totalDocuments - activeDocuments

    // Active vs inactive by division
    const divisionActivityMap = new Map<
      string,
      { divisionName: string; active: number; inactive: number }
    >()

    for (const division of divisions) {
      divisionActivityMap.set(division.id, {
        divisionName: division.name,
        active: 0,
        inactive: 0,
      })
    }

    for (const doc of documents) {
      const entry =
        divisionActivityMap.get(doc.division_id) ??
        {
          divisionName: doc.division?.name || 'Unknown',
          active: 0,
          inactive: 0,
        }

      if (doc.is_active) {
        entry.active += 1
      } else {
        entry.inactive += 1
      }

      divisionActivityMap.set(doc.division_id, entry)
    }

    const divisionActivity = Array.from(divisionActivityMap.values()).filter(
      (item) => item.active > 0 || item.inactive > 0
    )

    // Documents over time (by created_at date, using total and embedded)
    const documentsOverTimeMap = new Map<string, { date: string; total: number; embedded: number }>()
    for (const doc of documents) {
      const dateKey = new Date(doc.created_at).toISOString().slice(0, 10)
      const entry =
        documentsOverTimeMap.get(dateKey) ?? {
          date: dateKey,
          total: 0,
          embedded: 0,
        }
      entry.total += 1
      if (doc.status === 'embedded') {
        entry.embedded += 1
      }
      documentsOverTimeMap.set(dateKey, entry)
    }

    const documentsOverTime = Array.from(documentsOverTimeMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Chat activity by division (based on conversations)
    const chatByDivisionMap = new Map<string, { divisionName: string; conversations: number }>()

    for (const division of divisions) {
      chatByDivisionMap.set(division.id, {
        divisionName: division.name,
        conversations: 0,
      })
    }

    for (const conv of conversations) {
      if (!conv.division_id) continue
      const entry =
        chatByDivisionMap.get(conv.division_id) ??
        {
          divisionName:
            divisions.find((d) => d.id === conv.division_id)?.name || 'Unknown',
          conversations: 0,
        }
      entry.conversations += 1
      chatByDivisionMap.set(conv.division_id, entry)
    }

    const chatByDivision = Array.from(chatByDivisionMap.values()).filter(
      (item) => item.conversations > 0
    )

    return {
      totalDocuments,
      activeDocuments,
      inactiveDocuments,
      divisionActivity,
      documentsOverTime,
      chatByDivision,
    }
  }, [documents, divisions, conversations])

  const isLoading =
    isDivisionsLoading || isDocumentsLoading || isUsersLoading || isConversationsLoading

  const documentsByDivisionData = useMemo(
    () =>
      divisionActivity.map((item) => ({
        name: item.divisionName,
        value: item.active + item.inactive,
      })),
    [divisionActivity]
  )

  const divisionColors = ['#ED1E28', '#B6252A', '#55565B', '#959597', '#0EA5E9', '#22C55E']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

      {/* Top-level metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        { user?.role === 'super_admin' && 
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{isLoading ? '—' : users.length}</div>
            </CardContent>
          </Card>
        }

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

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Documents per division - Donut chart */}
        <Card>
          <CardHeader>
            <CardTitle>Documents per Division</CardTitle>
          </CardHeader>
          <CardContent className="h-100">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : documentsByDivisionData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No division document data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={documentsByDivisionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={4}
                  >
                    {documentsByDivisionData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={divisionColors[index % divisionColors.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Active vs inactive documents per division - Stacked bar */}
        <Card>
          <CardHeader>
            <CardTitle>Documents by Division (Active vs Inactive)</CardTitle>
          </CardHeader>
          <CardContent className="h-100">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : divisionActivity.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No division document data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={divisionActivity}
                  margin={{ top: 16, right: 16, left: 0, bottom: 40 }}
                  style={{ fontSize: '12px' }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="divisionName"
                    angle={-10}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="active" stackId="a" fill="#ED1E28" name="Active" />
                  <Bar dataKey="inactive" stackId="a" fill="#959597" name="Inactive" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Documents over time - Line chart */}
        <Card>
          <CardHeader>
            <CardTitle>Documents Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-100">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : documentsOverTime.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No historical document data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={documentsOverTime} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#ED1E28"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Total uploaded"
                  />
                  {/* <Line
                    type="monotone"
                    dataKey="embedded"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Embedded"
                  /> */}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chat activity by division - Horizontal bar */}
        <Card>
          <CardHeader>
            <CardTitle>Chat Activity by Division</CardTitle>
          </CardHeader>
          <CardContent className="h-100">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : chatByDivision.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No chat conversations yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chatByDivision}
                  layout="vertical"
                  margin={{ top: 16, right: 16, left: 80, bottom: 16 }}
                  style={{ fontSize: '12px' }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="divisionName" type="category" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="conversations"
                    fill="#B6252A"
                    name="Conversations"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
