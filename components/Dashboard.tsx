"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Wallet,
  Receipt,
  UserPlus,
  Percent,
  Calculator,
} from "lucide-react"

type Project = {
  id: string
  nombre: string
  cliente: string | null
  client_id: string | null
  estatus: string
  margen: number
  monto_adelanto: number | null
  saldo: number | null
  fecha_entrega: string | null
  fecha_real: string | null
  utilidad_real: number | null
  created_at: string
}

type Lead = {
  id: string
  nombre_empresa: string
  estado: string
  created_at: string
}

type Client = {
  id: string
  nombre_empresa: string
  estado: string
  created_at: string
}

type QuotationItem = {
  id: string
  element_id: string
  product_id: number
  cantidad: number
  products: {
    Costo: number
  }
}

type Element = {
  id: string
  project_id: string
}

const STATUS_COLORS: { [key: string]: string } = {
  Borrador: "#9CA3AF",
  Enviado: "#F59E0B",
  Aceptado: "#10B981",
  Produccion: "#3B82F6",
  Entregado: "#8B5CF6",
  Pagado: "#14B8A6",
  Rechazado: "#EF4444",
  Finalizado: "#1F2937",
}

const LEAD_STATUS_COLORS: { [key: string]: string } = {
  Nuevo: "#3B82F6",
  Contactado: "#F59E0B",
  Calificado: "#10B981",
  "En Seguimiento": "#8B5CF6",
  Convertido: "#3D5A6E",
  Perdido: "#EF4444",
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projectTotals, setProjectTotals] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const paidStatuses = ["Pagado", "Finalizado"]

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch elements
      const { data: elementsData } = await supabase.from("elements").select("id, project_id")

      // Fetch quotation items with products
      const { data: itemsData } = await supabase
        .from("quotation_items")
        .select("*, products(Costo)")

      setProjects(projectsData || [])
      setLeads(leadsData || [])
      setClients(clientsData || [])

      // Calculate project totals from quotation_items -> elements -> projects
      const elementToProject: { [key: string]: string } = {}
      elementsData?.forEach((el) => {
        elementToProject[el.id] = el.project_id
      })

      const totals: { [key: string]: number } = {}
      itemsData?.forEach((item: any) => {
        const projectId = elementToProject[item.element_id]
        if (projectId) {
          const cost = item.products?.Costo || 0
          totals[projectId] = (totals[projectId] || 0) + cost * item.cantidad
        }
      })

      // Apply margin to get sale price
      const saleTotals: { [key: string]: number } = {}
      projectsData?.forEach((p) => {
        const cost = totals[p.id] || 0
        const marginDecimal = p.margen / 100
        saleTotals[p.id] = marginDecimal < 1 ? cost / (1 - marginDecimal) : cost
      })

      setProjectTotals(saleTotals)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Status filters
  const acceptedStatuses = ["Aceptado", "Produccion", "Entregado", "Pagado", "Finalizado"]
  const pipelineStatuses = ["Borrador", "Enviado"]

  // 1. VENTAS TOTALES - Projects with status Aceptado+
  const ventasProjects = projects.filter((p) => acceptedStatuses.includes(p.estatus))
  const ventasTotales = ventasProjects.reduce((sum, p) => sum + (projectTotals[p.id] || 0), 0)
  const ventasProjectCount = ventasProjects.length
  const ventasClientCount = new Set(ventasProjects.map((p) => p.client_id || p.cliente).filter(Boolean)).size

  // 2. VENTAS MENSUALES - Average of last 12 months
  const getMonthlyAverage = () => {
    const now = new Date()
    const monthsData: { [key: string]: number } = {}
    
    ventasProjects.forEach((p) => {
      const date = new Date(p.created_at)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      monthsData[monthKey] = (monthsData[monthKey] || 0) + (projectTotals[p.id] || 0)
    })

    const monthCount = Math.max(Object.keys(monthsData).length, 1)
    const totalVentas = Object.values(monthsData).reduce((sum, v) => sum + v, 0)
    return totalVentas / monthCount
  }
  const ventasMensuales = getMonthlyAverage()

  // 3. TICKET PROMEDIO
  const ticketPromedio = ventasProjectCount > 0 ? ventasTotales / ventasProjectCount : 0

  // 4. UTILIDAD - Pagado/Finalizado projects
  const paidProjects = projects.filter((p) => paidStatuses.includes(p.estatus))
  const utilidadEsperada = paidProjects.reduce((sum, p) => {
    const total = projectTotals[p.id] || 0
    return sum + total * (p.margen / 100)
  }, 0)
  const utilidadReal = paidProjects.reduce((sum, p) => sum + (p.utilidad_real || 0), 0)
  const totalPaidProjects = paidProjects.reduce((sum, p) => sum + (projectTotals[p.id] || 0), 0)
  const utilidadEsperadaPct = totalPaidProjects > 0 ? (utilidadEsperada / totalPaidProjects) * 100 : 0
  const utilidadRealPct = totalPaidProjects > 0 ? (utilidadReal / totalPaidProjects) * 100 : 0
  const utilidadVarianza = utilidadReal - utilidadEsperada
  const utilidadVarianzaPct = utilidadRealPct - utilidadEsperadaPct

  // 5. TASA CONVERSION
  const projectsAceptadosPlus = projects.filter((p) => acceptedStatuses.includes(p.estatus)).length
  const projectsRechazados = projects.filter((p) => p.estatus === "Rechazado").length
  const tasaConversion = projectsAceptadosPlus + projectsRechazados > 0
    ? (projectsAceptadosPlus / (projectsAceptadosPlus + projectsRechazados)) * 100
    : 0

  // 6. COSTOS - Pagado/Finalizado projects
  const costosEsperados = totalPaidProjects - utilidadEsperada
  const costosReales = totalPaidProjects - utilidadReal
  const costosEsperadosPct = totalPaidProjects > 0 ? (costosEsperados / totalPaidProjects) * 100 : 0
  const costosRealesPct = totalPaidProjects > 0 ? (costosReales / totalPaidProjects) * 100 : 0
  const costosVarianza = costosReales - costosEsperados
  const costosVarianzaPct = costosRealesPct - costosEsperadosPct

  // 7. INGRESOS CONFIRMADOS (Efectivo)
  // Efectivo recibido = adelanto + saldo (cuando el saldo ya fue pagado)
  // El saldo se considera PAGADO solo si el proyecto está en Pagado o Finalizado
  const ingresosProjects = projects.filter((p) => acceptedStatuses.includes(p.estatus))
  const ingresosConfirmados = ingresosProjects.reduce((sum, p) => {
    const adelanto = p.monto_adelanto || 0
    const saldo = p.saldo || 0
    // El saldo solo cuenta como pagado si el proyecto está en Pagado o Finalizado
    const saldoPagado = paidStatuses.includes(p.estatus) ? saldo : 0
    return sum + adelanto + saldoPagado
  }, 0)
  // Contar solo proyectos que realmente han recibido dinero
  const ingresosProjectsConPago = ingresosProjects.filter((p) => {
    const adelanto = p.monto_adelanto || 0
    const saldo = p.saldo || 0
    const saldoPagado = paidStatuses.includes(p.estatus) ? saldo : 0
    return adelanto > 0 || saldoPagado > 0
  })
  const ingresosProjectCount = ingresosProjectsConPago.length
  const ingresosClientCount = new Set(
    ingresosProjectsConPago.map((p) => p.client_id || p.cliente).filter(Boolean)
  ).size

  // 8. CXC - Cuentas x Cobrar
  // CxC (Entregados): Proyectos Entregados que tienen saldo pendiente
  // Saldo pendiente = Total - Adelanto (lo que falta por pagar)
  const cxcProjects = projects.filter((p) => {
    if (p.estatus !== "Entregado") return false
    const total = projectTotals[p.id] || 0
    const adelanto = p.monto_adelanto || 0
    const pendiente = total - adelanto
    return pendiente > 0
  })
  const cxc = cxcProjects.reduce((sum, p) => {
    const total = projectTotals[p.id] || 0
    const adelanto = p.monto_adelanto || 0
    return sum + (total - adelanto)
  }, 0)
  
  // Saldo Pendiente: Proyectos Aceptados/Produccion que no han pagado todo
  // Saldo pendiente = Total - Adelanto
  const saldoPendienteProjects = projects.filter((p) => {
    if (!["Aceptado", "Produccion"].includes(p.estatus)) return false
    const total = projectTotals[p.id] || 0
    const adelanto = p.monto_adelanto || 0
    const pendiente = total - adelanto
    return pendiente > 0
  })
  const saldoPendiente = saldoPendienteProjects.reduce((sum, p) => {
    const total = projectTotals[p.id] || 0
    const adelanto = p.monto_adelanto || 0
    return sum + (total - adelanto)
  }, 0)
  
  // Total CxC
  const totalCxC = cxc + saldoPendiente

  // 9. PIPELINE - Borrador/Enviado
  const pipelineProjects = projects.filter((p) => pipelineStatuses.includes(p.estatus))
  const pipelineValor = pipelineProjects.reduce((sum, p) => sum + (projectTotals[p.id] || 0), 0)
  const pipelineUtilidadPct = pipelineProjects.length > 0
    ? pipelineProjects.reduce((sum, p) => sum + p.margen, 0) / pipelineProjects.length
    : 0
  const pipelineUtilidad = pipelineProjects.reduce((sum, p) => {
    const total = projectTotals[p.id] || 0
    return sum + total * (p.margen / 100)
  }, 0)
  const pipelineProjectCount = pipelineProjects.length
  const pipelineClientCount = new Set(pipelineProjects.map((p) => p.client_id || p.cliente).filter(Boolean)).size

  // 10. LEADS
  const leadsCalificados = leads.filter((l) => l.estado === "Calificado").length
  const leadsContactados = leads.filter((l) => l.estado === "Contactado").length
  const leadsEnSeguimiento = leads.filter((l) => l.estado === "En Seguimiento").length
  const leadsNuevos = leads.filter((l) => l.estado === "Nuevo").length

  // Projects by status for pie chart
  const projectsByStatus = Object.entries(
    projects.reduce((acc, p) => {
      acc[p.estatus] = (acc[p.estatus] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || "#3D5A6E" }))

  // Leads by status for pie chart
  const leadsByStatus = Object.entries(
    leads.reduce((acc, l) => {
      acc[l.estado] = (acc[l.estado] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
  ).map(([name, value]) => ({ name, value, color: LEAD_STATUS_COLORS[name] || "#3D5A6E" }))

  // Revenue by month (last 6 months)
  const getMonthlyData = () => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const now = new Date()
    const data = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthProjects = projects.filter((p) => {
        const projectDate = new Date(p.created_at)
        return (
          projectDate.getMonth() === date.getMonth() &&
          projectDate.getFullYear() === date.getFullYear() &&
          acceptedStatuses.includes(p.estatus)
        )
      })

      const revenue = monthProjects.reduce((sum, p) => sum + (projectTotals[p.id] || 0), 0)
      const profit = monthProjects.reduce((sum, p) => sum + (projectTotals[p.id] || 0) * (p.margen / 100), 0)

      data.push({
        month: months[date.getMonth()],
        ingresos: revenue,
        utilidad: profit,
      })
    }

    return data
  }

  // Recent projects
  const recentProjects = projects.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D5A6E]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Scorecard Title */}
      <h2 className="text-xl font-bold text-gray-900">Scorecard</h2>

      {/* Scorecard - 10 KPI Chips in 2 rows of 5 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* 1. Ventas Totales */}
        <Card className="border-t-4 border-t-[#3D5A6E]">
          <CardContent className="pt-2 pb-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#3D5A6E] uppercase tracking-wide font-bold">Ventas Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{formatCurrency(ventasTotales)}</p>
                <p className="text-xs text-gray-400 mt-1">{ventasProjectCount} proyectos | {ventasClientCount} clientes</p>
              </div>
              <div className="p-2 bg-[#3D5A6E]/10 rounded-full shrink-0">
                <DollarSign className="h-4 w-4 text-[#3D5A6E]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Ventas Mensuales */}
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="pt-2 pb-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-500 uppercase tracking-wide font-bold">Ventas Mensuales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{formatCurrency(ventasMensuales)}</p>
                <p className="text-xs text-gray-400 mt-1">Promedio mensual</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Ticket Promedio */}
        <Card className="border-t-4 border-t-purple-500">
          <CardContent className="pt-2 pb-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-500 uppercase tracking-wide font-bold">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{formatCurrency(ticketPromedio)}</p>
                <p className="text-xs text-gray-400 mt-1">{ventasProjectCount} proyectos</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full shrink-0">
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Tasa Conversion */}
        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="pt-2 pb-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-orange-500 uppercase tracking-wide font-bold">Tasa Conversion</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tasaConversion.toFixed(1)}%</p>
                <p className="text-xs text-gray-400 mt-1">{projectsAceptadosPlus} de {projectsAceptadosPlus + projectsRechazados}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Ingresos Confirmados (Efectivo) */}
        <Card className="border-t-4 border-t-teal-500">
          <CardContent className="pt-2 pb-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-teal-500 uppercase tracking-wide font-bold">Ingresos (Efectivo)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{formatCurrency(ingresosConfirmados)}</p>
                <p className="text-xs text-gray-400 mt-1">{ingresosProjectCount} proyectos | {ingresosClientCount} clientes</p>
              </div>
              <div className="p-2 bg-teal-100 rounded-full shrink-0">
                <Wallet className="h-4 w-4 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Utilidad */}
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="pt-2 pb-3 px-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-green-500 uppercase tracking-wide font-bold">Utilidad</p>
              <div className="p-1.5 bg-green-100 rounded-full">
                <Percent className="h-3 w-3 text-green-600" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Esperada:</span>
                <span className="font-semibold">{formatCurrency(utilidadEsperada)} ({utilidadEsperadaPct.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Real:</span>
                <span className="font-semibold">{formatCurrency(utilidadReal)} ({utilidadRealPct.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-500">Diferencia:</span>
                <span className={`font-bold ${utilidadVarianza >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {utilidadVarianza >= 0 ? "+" : ""}{formatCurrency(utilidadVarianza)} ({utilidadVarianzaPct >= 0 ? "+" : ""}{utilidadVarianzaPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Costos */}
        <Card className="border-t-4 border-t-red-500">
          <CardContent className="pt-2 pb-3 px-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-red-500 uppercase tracking-wide font-bold">Costos</p>
              <div className="p-1.5 bg-red-100 rounded-full">
                <Calculator className="h-3 w-3 text-red-600" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Esperados:</span>
                <span className="font-semibold">{formatCurrency(costosEsperados)} ({costosEsperadosPct.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reales:</span>
                <span className="font-semibold">{formatCurrency(costosReales)} ({costosRealesPct.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-500">Diferencia:</span>
                <span className={`font-bold ${costosVarianza <= 0 ? "text-green-600" : "text-red-600"}`}>
                  {costosVarianza >= 0 ? "+" : ""}{formatCurrency(costosVarianza)} ({costosVarianzaPct >= 0 ? "+" : ""}{costosVarianzaPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8. CxC */}
        <Card className="border-t-4 border-t-amber-500">
          <CardContent className="pt-2 pb-3 px-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-amber-500 uppercase tracking-wide font-bold">Cuentas x Cobrar</p>
              <div className="p-1.5 bg-amber-100 rounded-full">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">CxC (Entregados):</span>
                <span className="font-semibold text-amber-600">{formatCurrency(cxc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saldo Pendiente:</span>
                <span className="font-semibold">{formatCurrency(saldoPendiente)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-600 font-medium">Total CxC:</span>
                <span className="font-bold text-amber-600">{formatCurrency(totalCxC)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 9. Pipeline */}
        <Card className="border-t-4 border-t-yellow-500">
          <CardContent className="pt-2 pb-3 px-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-yellow-600 uppercase tracking-wide font-bold">Pipeline</p>
              <div className="p-1.5 bg-yellow-100 rounded-full">
                <Clock className="h-3 w-3 text-yellow-600" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Valor Total:</span>
                <span className="font-bold">{formatCurrency(pipelineValor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Utilidad Promedio:</span>
                <span className="font-semibold">{pipelineUtilidadPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Utilidad Esperada:</span>
                <span className="font-semibold">{formatCurrency(pipelineUtilidad)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-xs">
                <span className="text-gray-400">{pipelineProjectCount} proyectos | {pipelineClientCount} clientes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 10. Leads */}
        <Card className="border-t-4 border-t-indigo-500">
          <CardContent className="pt-2 pb-3 px-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-indigo-500 uppercase tracking-wide font-bold">Leads</p>
              <div className="p-1.5 bg-indigo-100 rounded-full">
                <UserPlus className="h-3 w-3 text-indigo-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Calificados:</span>
                <span className="font-bold text-green-600">{leadsCalificados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contactados:</span>
                <span className="font-semibold">{leadsContactados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seguimiento:</span>
                <span className="font-semibold">{leadsEnSeguimiento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nuevos:</span>
                <span className="font-semibold">{leadsNuevos}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos y Utilidad (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₡${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => `₡${value.toLocaleString("es-CR")}`} contentStyle={{ fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3D5A6E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilidad" name="Utilidad" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Proyectos por Estatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {projectsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Leads por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {leadsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Utilidad Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilidad: Esperada vs Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Esperada</span>
                  <span className="font-medium">{formatCurrency(utilidadEsperada)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-[#3D5A6E] h-3 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Real</span>
                  <span className="font-medium">{formatCurrency(utilidadReal)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${utilidadEsperada > 0 ? Math.min((utilidadReal / utilidadEsperada) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Diferencia</span>
                  <span className={`font-bold ${utilidadVarianza >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {utilidadVarianza >= 0 ? "+" : ""}
                    {formatCurrency(utilidadVarianza)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Proyectos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Proyecto</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Cliente</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Total</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{project.nombre}</td>
                    <td className="py-2 px-2 text-gray-600">{project.cliente || "-"}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(projectTotals[project.id] || 0)}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLORS[project.estatus]}20`,
                          color: STATUS_COLORS[project.estatus],
                        }}
                      >
                        {project.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
