"use client"

import React, { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Trash2,
  FileText,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowLeftIcon,
  Download,
  ArrowLeft,
  Search,
  Copy,
  Users,
  UserPlus,
  ArrowRightCircle,
  FolderOpen,
  Package,
  LayoutDashboard,
  Eye,
} from "lucide-react"
import Image from "next/image"
import { createBrowserClient } from "@supabase/ssr"
import jsPDF from "jspdf"
import Dashboard from "@/components/Dashboard"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

type ActiveView = "dashboard" | "proyectos" | "clientes" | "leads" | "productos" | "tareas" | "calendario" | "configuracion"

const formatDateInSpanish = (dateString: string, formatType: "short" | "year" | "full"): string => {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  // Parse as UTC and convert to local timezone (Costa Rica)
  const date = new Date(dateString.includes("Z") ? dateString : dateString.replace(" ", "T") + "Z")
  
  if (formatType === "short") {
    return `${date.getDate()} ${months[date.getMonth()]}`
  } else if (formatType === "year") {
    return `${date.getFullYear()}`
  } else {
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }
}

type Project = {
  id: string
  nombre: string
  cliente: string | null
  client_id: string | null
  descripcion: string | null
  margen: number
  estatus: string
  razon_perdida: string | null
  competidor: string | null
  detalle_perdida: string | null
  adelanto: string | null
  porcentaje_adelanto: number | null
  monto_adelanto: number | null
  saldo: number | null
  fecha_entrega: string | null
  fecha_real: string | null
  utilidad_real: number | null
  created_at: string
  updated_at: string
}

// Assuming Element type and its properties based on usage
type Element = {
  id: string
  project_id: string
  nombre: string
  tipo: string
  imagen_url: string | null
  descripcion?: string | null
}

const STATUS_CONFIG = {
  Borrador: { label: "Borrador", color: "text-gray-400 font-bold" },
  Enviado: { label: "Enviado", color: "text-yellow-600 font-bold" },
  Aceptado: { label: "Aceptado", color: "text-green-600 font-bold" },
  Produccion: { label: "Producción", color: "text-blue-600 font-bold" },
  Entregado: { label: "Entregado", color: "text-purple-600 font-bold" },
  Pagado: { label: "Pagado", color: "text-teal-600 font-bold" },
  Rechazado: { label: "Rechazado", color: "text-red-600 font-bold" },
  Finalizado: { label: "Finalizado", color: "text-black font-bold" },
}

const RAZON_PERDIDA_OPTIONS = [
  "Precio",
  "Calidad",
  "Capacidad",
  "Tiempo de Entrega",
  "Financiamiento",
  "Servicio al Cliente",
  "Otro",
]

type Lead = {
  id: string
  nombre_empresa: string
  tipo_cliente: string
  tipo_cliente_otro: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  origen: string
  estado: string
  prioridad: string
  notas: string | null
  created_at: string
  ultimo_contacto: string | null
  convertido: boolean
  proyecto_id: string | null
}
// </CHANGE>

const LEAD_ESTADO_CONFIG: { [key: string]: { label: string; color: string } } = {
  Nuevo: { label: "Nuevo", color: "bg-blue-100 text-blue-800" },
  "En Seguimiento": { label: "En Seguimiento", color: "bg-yellow-100 text-yellow-800" },
  Contactado: { label: "Contactado", color: "bg-purple-100 text-purple-800" },
  Calificado: { label: "Calificado", color: "bg-green-100 text-green-800" },
  Descartado: { label: "Descartado", color: "bg-gray-100 text-gray-800" },
  Convertido: { label: "Convertido", color: "bg-teal-100 text-teal-800" },
}

const LEAD_PRIORIDAD_CONFIG: { [key: string]: { label: string; color: string } } = {
  Alta: { label: "Alta", color: "bg-red-100 text-red-800" },
  Media: { label: "Media", color: "bg-yellow-100 text-yellow-800" },
  Baja: { label: "Baja", color: "bg-gray-100 text-gray-800" },
}

const LEAD_ORIGEN_OPTIONS = ["Referido", "Redes Sociales", "Sitio Web", "Evento", "Otro"]

const LEAD_TIPO_CLIENTE_OPTIONS = [
  "Firma de Arquitectura",
  "Firma de Interiorismo",
  "Constructora",
  "Desarrolladora",
  "Cliente Final",
  "Intermediario",
  "Otro",
]

// Client types and configuration
type Client = {
  id: string
  lead_id: string
  nombre_empresa: string
  tipo_cliente: string
  tipo_cliente_otro: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  estado: string
  notas: string | null
  created_at: string
  updated_at: string
}

const CLIENT_ESTADO_CONFIG: { [key: string]: { label: string; color: string } } = {
  Convertido: { label: "Convertido", color: "bg-[#3D5A6E] text-white" },
  Activo: { label: "Activo", color: "bg-green-500 text-white" },
}

export default function QuotationApp() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>("dashboard")
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    // Corrected: newProject was undeclared
    nombre: "",
    cliente: "",
    descripcion: "",
    margen: 40,
    estatus: "Borrador" as "Borrador" | "Enviado" | "Aceptado" | "Rechazado" | "Cerrado",
    // Added fields for lost reasons
    razon_perdida: "",
    competidor: "",
    detalle_perdida: "",
    // Added fields for product creation (used in the Dialog for New Product)
    categoria: "",
    subcategoria: "",
    item: "",
    proveedor: "",
    costo: 0,
  })
  // const [newProduct, setNewProduct] = useState({ // This was the original declaration of newProduct
  //   categoria: "",
  //   subcategoria: "",
  //   item: "",
  //   proveedor: "",
  //   costo: 0,
  // }) // Removed, replaced by newProductData for ProductsManagementView

  const [projectTotals, setProjectTotals] = useState<{ [key: string]: number }>({})

  const [sortField, setSortField] = useState<keyof Project>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterText, setFilterText] = useState("")

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  // const [showProductManager, setShowProductManager] = useState(false) // Removed, replaced by showProductsView
  // const [products, setProducts] = useState<any[]>([]) // Removed, replaced by allProducts
  // const [editingProductId, setEditingProductId] = useState<number | null>(null) // Removed
  // const [editingProduct, setEditingProduct] = useState<any>(null) // Removed
  // const [isAddingNewProduct, setIsAddingNewProduct] = useState(false) // Removed

  const [allProducts, setAllProducts] = useState<any[]>([])
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null) // Changed to string to match product IDs
  const [editingProductData, setEditingProductData] = useState<any>({})
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProductData, setNewProductData] = useState({
    Categoria: "",
    Subcategoria: "",
    Item: "",
    Proveedor: "",
    Costo: "",
  })
  // </CHANGE>
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all")
  const [showProductDialog, setShowProductDialog] = useState(false) // State to control the product dialog

  const [showFinalSummary, setShowFinalSummary] = useState(false)

  const [leads, setLeads] = useState<Lead[]>([])
  const [leadFilterText, setLeadFilterText] = useState("")
  const [leadEstadoFilter, setLeadEstadoFilter] = useState<string>("all")
  const [leadPrioridadFilter, setLeadPrioridadFilter] = useState<string>("all")
  const [leadOrigenFilter, setLeadOrigenFilter] = useState<string>("all")
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false)
  const [showEditLeadDialog, setShowEditLeadDialog] = useState(false)
  const [showConvertLeadDialog, setShowConvertLeadDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    nombre_empresa: "",
    tipo_cliente: "Cliente Final",
    tipo_cliente_otro: "",
    contacto: "",
    telefono: "",
    email: "",
    origen: "Otro",
    estado: "Nuevo",
    prioridad: "Media",
    notas: "",
  })

  // Client management states
  const [clients, setClients] = useState<Client[]>([])
  const [clientFilterText, setClientFilterText] = useState("")
  const [clientEstadoFilter, setClientEstadoFilter] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientProjects, setClientProjects] = useState<Project[]>([])

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      loadProjectTotals()
    }
  }, [projects])

  useEffect(() => {
    if (activeView === "leads") {
      fetchLeads()
    }
  }, [activeView])

  const fetchAllProducts = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true })

      if (error) {
        console.error("Error fetching products:", error)
        return
      }

      setAllProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  useEffect(() => {
    if (activeView === "productos") {
      fetchAllProducts()
    }
  }, [activeView])

  const fetchLeads = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching leads:", error)
        return
      }

      setLeads(data || [])
    } catch (error) {
      console.error("Error fetching leads:", error)
    }
  }

  const handleUpdateProductAPI = async (productId: string) => {
    if (!editingProductData) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Categoria: editingProductData.Categoria,
          Subcategoria: editingProductData.Subcategoria,
          Item: editingProductData.Item,
          Proveedor: editingProductData.Proveedor,
          Costo: Number(editingProductData.Costo) || 0,
        }),
      })

      if (response.ok) {
        await fetchAllProducts()
        setIsEditingProduct(null)
        setEditingProductData({})
        setShowProductDialog(false)
      } else {
        console.error("Error updating product:", response.statusText)
      }
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProductAPI = async (productId: string) => {
    // Changed productId to string
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAllProducts()
        setIsEditingProduct(null) // Ensure editing mode is closed
      } else {
        console.error("Error deleting product:", response.statusText)
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const handleCreateProductAPI = async () => {
    console.log("[v0] handleCreateProductAPI called with data:", newProductData)
    try {
      const payload = {
        Categoria: newProductData.Categoria,
        Subcategoria: newProductData.Subcategoria,
        Item: newProductData.Item,
        Proveedor: newProductData.Proveedor,
        Costo: Number(newProductData.Costo) || 0,
      }
      console.log("[v0] Sending payload:", payload)
      
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response status:", response.status)
      const responseData = await response.json()
      console.log("[v0] Response data:", responseData)

      if (response.ok) {
        setNewProductData({ Categoria: "", Subcategoria: "", Item: "", Proveedor: "", Costo: "" })
        setIsAddingProduct(false)
        await fetchAllProducts()
        setShowProductDialog(false)
      } else {
        console.error("[v0] Error creating product:", responseData)
        alert("Error al crear producto: " + (responseData.error || response.statusText))
      }
    } catch (error) {
      console.error("[v0] Error creating product:", error)
      alert("Error al crear producto: " + error)
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesText =
        leadFilterText === "" ||
        lead.nombre_empresa?.toLowerCase().includes(leadFilterText.toLowerCase()) ||
        lead.contacto?.toLowerCase().includes(leadFilterText.toLowerCase()) ||
        lead.email?.toLowerCase().includes(leadFilterText.toLowerCase())

      const matchesEstado = leadEstadoFilter === "all" || lead.estado === leadEstadoFilter
      const matchesPrioridad = leadPrioridadFilter === "all" || lead.prioridad === leadPrioridadFilter
      const matchesOrigen = leadOrigenFilter === "all" || lead.origen === leadOrigenFilter

      return matchesText && matchesEstado && matchesPrioridad && matchesOrigen
    })
  }, [leads, leadFilterText, leadEstadoFilter, leadPrioridadFilter, leadOrigenFilter])

  const loadProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading projects:", error)
    } else {
      setProjects(data || [])
    }
  }

  const loadProjectTotals = async () => {
    const totals: { [key: string]: number } = {}

    for (const project of projects) {
      const { data: elements } = await supabase.from("elements").select("id").eq("project_id", project.id)

      if (elements && elements.length > 0) {
        const elementIds = elements.map((e) => e.id)
        const { data: items } = await supabase
          .from("quotation_items")
          .select("cantidad, products(Costo)")
          .in("element_id", elementIds)

        if (items) {
          const totalVenta = items.reduce((sum, item) => {
            const costo = item.products?.Costo || 0
            const costoTotal = costo * item.cantidad
            const margenDecimal = project.margen / 100
            // </CHANGE> Formula: Costo / (1 - Margen)
            const venta = margenDecimal < 1 ? costoTotal / (1 - margenDecimal) : costoTotal
            return sum + venta
          }, 0)

          totals[project.id] = totalVenta
        }
      } else {
        totals[project.id] = 0
      }
    }

    setProjectTotals(totals)
  }

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading projects:", error)
    } else {
      setProjects(data || [])
    }
  }

  const handleCreateLead = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.from("leads").insert([
        {
          nombre_empresa: newLead.nombre_empresa,
          tipo_cliente: newLead.tipo_cliente,
          tipo_cliente_otro: newLead.tipo_cliente === "Otro" ? newLead.tipo_cliente_otro : null,
          contacto: newLead.contacto,
          telefono: newLead.telefono,
          email: newLead.email,
          origen: newLead.origen,
          estado: newLead.estado,
          prioridad: newLead.prioridad,
          notas: newLead.notas,
        },
      ])

      if (error) {
        console.error("Error creating lead:", error)
        alert("Error al crear el lead: " + error.message)
        return
      }

      setShowNewLeadDialog(false)
      setNewLead({
        nombre_empresa: "",
        tipo_cliente: "Cliente Final",
        tipo_cliente_otro: "",
        contacto: "",
        telefono: "",
        email: "",
        origen: "Otro",
        estado: "Nuevo",
        prioridad: "Media",
        notas: "",
      })
      await fetchLeads()
    } catch (error) {
      console.error("Error creating lead:", error)
    }
  }

  async function handleCreateProject() {
    if (!newProject.nombre.trim() || !newProject.cliente.trim() || !newProject.margen || !newProject.estatus) {
      return
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          nombre: newProject.nombre,
          cliente: newProject.cliente,
          descripcion: newProject.descripcion || null,
          margen: newProject.margen,
          estatus: newProject.estatus,
          // Add new fields for insertion
          razon_perdida: newProject.razon_perdida || null,
          competidor: newProject.competidor || null,
          detalle_perdida: newProject.detalle_perdida || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating project:", error)
      return
    }

    setSelectedProject(data)
    setShowNewProjectDialog(false)
    setNewProject({
      // Corrected: setNewProject was undeclared
      nombre: "",
      cliente: "",
      descripcion: "",
      margen: 40,
      estatus: "Borrador",
      // Reset new fields
      razon_perdida: "",
      competidor: "",
      detalle_perdida: "",
      // Reset product fields
      categoria: "",
      subcategoria: "",
      item: "",
      proveedor: "",
      costo: 0,
    })

    await fetchProjects()
  }

  const handleUpdateLead = async () => {
    if (!editingLead) return

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase
        .from("leads")
        .update({
          nombre_empresa: editingLead.nombre_empresa,
          tipo_cliente: editingLead.tipo_cliente,
          tipo_cliente_otro: editingLead.tipo_cliente === "Otro" ? editingLead.tipo_cliente_otro : null,
          contacto: editingLead.contacto,
          telefono: editingLead.telefono,
          email: editingLead.email,
          origen: editingLead.origen,
          estado: editingLead.estado,
          prioridad: editingLead.prioridad,
          notas: editingLead.notas,
          ultimo_contacto: new Date().toISOString(),
        })
        .eq("id", editingLead.id)

      if (error) {
        console.error("Error updating lead:", error)
        alert("Error al actualizar el lead: " + error.message)
        return
      }

      setShowEditLeadDialog(false)
      setEditingLead(null)
      await fetchLeads()
    } catch (error) {
      console.error("Error updating lead:", error)
    }
  }

  // Client management functions
  const fetchClients = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching clients:", error)
        return
      }

      // Update client status based on their projects
      const updatedClients = await Promise.all(
        (data || []).map(async (client) => {
          // Get projects for this client by client_id OR by matching client name
          const { data: projectsByClientId } = await supabase
            .from("projects")
            .select("*")
            .eq("client_id", client.id)

          const { data: projectsByName } = await supabase
            .from("projects")
            .select("*")
            .ilike("cliente", `%${client.nombre_empresa}%`)

          // Combine and deduplicate projects
          const allProjects = [...(projectsByClientId || []), ...(projectsByName || [])]
          const uniqueProjects = allProjects.filter(
            (project, index, self) => index === self.findIndex((p) => p.id === project.id)
          )
          
          // Check if any project is Aceptado or Cerrado
          const hasActiveProject = uniqueProjects.some(
            (p) => ["Aceptado", "Produccion", "Entregado", "Pagado", "Finalizado"].includes(p.estatus)
          )

          const newStatus = hasActiveProject ? "Activo" : "Convertido"
          
          // Update status in DB if changed
          if (client.estado !== newStatus) {
            await supabase
              .from("clients")
              .update({ estado: newStatus })
              .eq("id", client.id)
            return { ...client, estado: newStatus }
          }
          
          return client
        })
      )

      setClients(updatedClients)
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const loadClientProjects = async (clientId: string, clientName: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Get projects by client_id
      const { data: projectsByClientId } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)

      // Get projects by matching client name
      const { data: projectsByName } = await supabase
        .from("projects")
        .select("*")
        .ilike("cliente", `%${clientName}%`)

      // Combine and deduplicate projects
      const allProjects = [...(projectsByClientId || []), ...(projectsByName || [])]
      const uniqueProjects = allProjects.filter(
        (project, index, self) => index === self.findIndex((p) => p.id === project.id)
      )

      // Sort by created_at descending
      uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setClientProjects(uniqueProjects)
    } catch (error) {
      console.error("Error loading client projects:", error)
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.nombre_empresa.toLowerCase().includes(clientFilterText.toLowerCase()) ||
        (client.contacto && client.contacto.toLowerCase().includes(clientFilterText.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(clientFilterText.toLowerCase()))

      const matchesEstado = clientEstadoFilter === "all" || client.estado === clientEstadoFilter

      return matchesSearch && matchesEstado
    })
  }, [clients, clientFilterText, clientEstadoFilter])

  useEffect(() => {
    if (activeView === "clientes") {
      fetchClients()
    }
  }, [activeView])

  const handleEditProject = async (project: any) => {
    // Load clients and leads for dropdown
    await fetchClients()
    await fetchLeads()
    
    setEditingProject({
      id: project.id,
      nombre: project.nombre,
      cliente: project.cliente,
      client_id: project.client_id || "",
      descripcion: project.descripcion || "",
      margen: project.margen || 0,
      estatus: project.estatus || "Borrador",
      razon_perdida: project.razon_perdida || "",
      competidor: project.competidor || "",
      detalle_perdida: project.detalle_perdida || "",
      adelanto: project.adelanto || "No",
      porcentaje_adelanto: project.porcentaje_adelanto || 0,
      monto_adelanto: project.monto_adelanto || 0,
      saldo: project.saldo || 0,
      fecha_entrega: project.fecha_entrega || "",
      fecha_real: project.fecha_real || "",
      utilidad_real: project.utilidad_real || 0,
    })
    setIsEditProjectOpen(true)
  }

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("¿Estás seguro de eliminar este lead?")) return

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.from("leads").delete().eq("id", leadId)

      if (error) {
        console.error("Error deleting lead:", error)
        alert("Error al eliminar el lead: " + error.message)
        return
      }

      await fetchLeads()
    } catch (error) {
      console.error("Error deleting lead:", error)
    }
  }

  const handleUpdateProject = async () => {
    if (!editingProject?.id) return

    const activeStatuses = ["Aceptado", "Produccion", "Entregado", "Pagado", "Finalizado"]
    const isActiveStatus = activeStatuses.includes(editingProject.estatus)
    const needsFechaReal = ["Entregado", "Pagado", "Finalizado"].includes(editingProject.estatus)
    const needsUtilidadReal = ["Pagado", "Finalizado"].includes(editingProject.estatus)

    const { error } = await supabase
      .from("projects")
      .update({
        nombre: editingProject.nombre,
        cliente: editingProject.cliente,
        descripcion: editingProject.descripcion,
        margen: editingProject.margen,
        estatus: editingProject.estatus,
        razon_perdida: editingProject.estatus === "Rechazado" ? editingProject.razon_perdida : null,
        competidor: editingProject.estatus === "Rechazado" ? editingProject.competidor : null,
        detalle_perdida: editingProject.estatus === "Rechazado" ? editingProject.detalle_perdida : null,
        adelanto: isActiveStatus ? editingProject.adelanto : null,
        porcentaje_adelanto: isActiveStatus ? editingProject.porcentaje_adelanto : null,
        monto_adelanto: isActiveStatus ? editingProject.monto_adelanto : null,
        saldo: isActiveStatus ? editingProject.saldo : null,
        fecha_entrega: isActiveStatus ? editingProject.fecha_entrega : null,
        fecha_real: needsFechaReal ? editingProject.fecha_real : null,
        utilidad_real: needsUtilidadReal ? editingProject.utilidad_real : null,
      })
      .eq("id", editingProject.id)

    if (error) {
      console.error("Error updating project:", error)
      alert("Error al actualizar el proyecto")
    } else {
      setIsEditProjectOpen(false)
      setEditingProject(null)
      fetchProjects()
      // Update client status if needed
      fetchClients()
    }
  }

  // </CHANGE> Add handleConvertLead function
  const handleConvertLead = async () => {
    if (!convertingLead) return

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // First, create the client from lead
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert([
          {
            lead_id: convertingLead.id,
            nombre_empresa: convertingLead.nombre_empresa,
            tipo_cliente: convertingLead.tipo_cliente,
            tipo_cliente_otro: convertingLead.tipo_cliente_otro,
  contacto: convertingLead.contacto,
  telefono: convertingLead.telefono,
  email: convertingLead.email,
  estado: "Convertido",
  notas: convertingLead.notas,
          },
        ])
        .select()
        .single()

      if (clientError) {
        console.error("Error creating client from lead:", clientError)
        alert("Error al crear el cliente: " + clientError.message)
        return
      }

      // Create new project from lead linked to the client
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            nombre: convertingLead.nombre_empresa,
            cliente: convertingLead.contacto || convertingLead.nombre_empresa,
            client_id: newClient.id,
            descripcion: `Convertido desde lead. ${convertingLead.notas || ""}`,
            margen: 40,
            estatus: "Borrador",
          },
        ])
        .select()
        .single()

      if (projectError) {
        console.error("Error creating project from lead:", projectError)
        alert("Error al crear el proyecto: " + projectError.message)
        return
      }

      // Update lead to mark as converted
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          estado: "Convertido",
          convertido: true,
          proyecto_id: newProject.id,
        })
        .eq("id", convertingLead.id)

      if (leadError) {
        console.error("Error updating lead:", leadError)
      }

      setShowConvertLeadDialog(false)
      setConvertingLead(null)
      await fetchLeads()
      await loadProjects()

      // Navigate to clients view
      setActiveView("clientes")
      alert(`Cliente "${newClient.nombre_empresa}" creado exitosamente!`)
    } catch (error) {
      console.error("Error converting lead:", error)
    }
  }

  // Removed the old handleCreateProduct function and replaced it with the updated one above.

  async function handleDeleteProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting project:", error)
      return
    }

    setProjects(projects.filter((p) => p.id !== id))
    if (selectedProject?.id === id) {
      setSelectedProject(null)
    }
  }

  const handleDuplicateProject = async (project: Project) => {
    try {
      // 1. Create a copy of the project
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          nombre: `${project.nombre} (Copia)`,
          cliente: project.cliente,
          descripcion: project.descripcion,
          margen: project.margen,
          estatus: "Borrador",
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 2. Get all elements from the original project
      const { data: elements, error: elementsError } = await supabase
        .from("elements")
        .select("*")
        .eq("project_id", project.id)

      if (elementsError) throw elementsError

      // 3. Copy each element and its quotation_items
      for (const element of elements || []) {
        const { data: newElement, error: newElementError } = await supabase
          .from("elements")
          .insert({
            project_id: newProject.id,
            nombre: element.nombre,
            tipo: element.tipo,
            imagen_url: element.imagen_url, // Corrected from image_url to imagen_url
            descripcion: element.descripcion,
          })
          .select()
          .single()

        if (newElementError) throw newElementError

        // Get quotation_items for this element
        const { data: items, error: itemsError } = await supabase
          .from("quotation_items")
          .select("*")
          .eq("element_id", element.id)

        if (itemsError) throw itemsError

        if (items && items.length > 0) {
          const newItems = items.map((item) => ({
            element_id: newElement.id,
            product_id: item.product_id,
            cantidad: item.cantidad,
          }))

          const { error: insertItemsError } = await supabase.from("quotation_items").insert(newItems)

          if (insertItemsError) throw insertItemsError
        }
      }

      // 4. Refresh projects list
      await fetchProjects()
      await loadProjectTotals()
      alert(`Proyecto "${project.nombre}" duplicado exitosamente`)
    } catch (error) {
      console.error("Error duplicating project:", error)
      alert(`Error al duplicar el proyecto: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const sortedAndFilteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      const searchText = filterText.toLowerCase()
      // Removed filterField check from here. Now it only filters by filterText.
      return (
        project.nombre.toLowerCase().includes(searchText) ||
        project.cliente?.toLowerCase().includes(searchText) ||
        project.descripcion?.toLowerCase().includes(searchText) ||
        project.estatus.toLowerCase().includes(searchText)
      )
    })

    return filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [projects, sortField, sortDirection, filterText]) // Removed filterField from dependencies

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const formatCurrency = (amount: number): string => {
    return `₡${amount.toLocaleString("es-CR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const handleDownloadCSV = () => {
    const headers = [
      "Nombre del Proyecto",
      "Cliente",
      "Descripción",
      "Margen",
      "Total Venta",
      "Estatus",
      "Razón de Pérdida",
      "Competidor",
      "Detalle Pérdida",
    ]

    const rows = sortedAndFilteredProjects.map((project) => {
      const totalVenta = projectTotals[project.id] || 0
      const isRechazado = project.estatus === "Rechazado"

      return [
        project.nombre || "",
        project.cliente || "",
        project.descripcion || "",
        `${project.margen || 0}%`,
        totalVenta.toString(),
        project.estatus || "",
        isRechazado ? project.razon_perdida || "" : "",
        isRechazado ? project.competidor || "" : "",
        isRechazado ? project.detalle_perdida || "" : "",
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `proyectos_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CR")
  }

  // Dashboard View - Default
  if (activeView === "dashboard" && !selectedProject) {
    return (
      <SidebarProvider>
        <AppSidebar activeView={activeView} onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }} />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <div className="w-full px-4 md:px-8 py-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-[#3D5A6E]" />
                  <h1 className="text-3xl font-bold text-[#3D5A6E]">Dashboard</h1>
                </div>
                <Image
                  src="/mate-living-logo.png"
                  alt="Mate Living"
                  width={200}
                  height={24}
                  className="h-11 w-auto"
                  priority
                />
              </div>
              
              {/* Dashboard Content */}
              <Dashboard />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Clients Management View
  if (activeView === "clientes" && !selectedProject) {
    // If a client is selected, show their details and projects
    if (selectedClient) {
      return (
        <SidebarProvider>
          <AppSidebar activeView={activeView} onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }} />
          <SidebarInset>
            <div className="min-h-screen bg-gray-50">
              <div className="w-full px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-1" />
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedClient(null)
                        setClientProjects([])
                      }}
                      className="text-[#3D5A6E] hover:text-[#2D4A5E]"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a Clientes
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold text-[#3D5A6E]">{selectedClient.nombre_empresa}</h1>
                      <p className="text-gray-500">
                        {selectedClient.tipo_cliente === "Otro" ? selectedClient.tipo_cliente_otro : selectedClient.tipo_cliente}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${CLIENT_ESTADO_CONFIG[selectedClient.estado]?.color || "bg-gray-100 text-gray-800"}`}
                    >
                      {selectedClient.estado}
                    </span>
                    <Image
                      src="/mate-living-logo.png"
                      alt="Mate Living"
                      width={200}
                      height={24}
                      className="h-11 w-auto"
                    />
                  </div>
                </div>

            {/* Client Info Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-[#3D5A6E]">Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contacto</p>
                    <p className="font-medium">{selectedClient.contacto || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{selectedClient.telefono || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedClient.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Registro</p>
                    <p className="font-medium">{new Date(selectedClient.created_at).toLocaleDateString("es-CR")}</p>
                  </div>
                </div>
                {selectedClient.notas && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Notas</p>
                    <p className="font-medium">{selectedClient.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#3D5A6E]">Proyectos del Cliente</CardTitle>
                <Button
                  onClick={async () => {
                    // Create new project for this client
                    const supabaseClient = createBrowserClient(
                      process.env.NEXT_PUBLIC_SUPABASE_URL!,
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    )
                    
                    const { data: newProj, error } = await supabaseClient
                      .from("projects")
                      .insert([
                        {
                          nombre: `Nuevo Proyecto - ${selectedClient.nombre_empresa}`,
                          cliente: selectedClient.contacto || selectedClient.nombre_empresa,
                          client_id: selectedClient.id,
                          descripcion: "",
                          margen: 40,
                          estatus: "Borrador",
                        },
                      ])
                      .select()
                      .single()
                    
if (!error && newProj) {
  await loadClientProjects(selectedClient.id, selectedClient.nombre_empresa)
  await loadProjects()
  }
                  }}
                  className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cotización
                </Button>
              </CardHeader>
              <CardContent>
                {clientProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No hay proyectos para este cliente.</p>
                    <p className="text-sm">Crea una nueva cotización para comenzar.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedClient(null)
                          setSelectedProject(project)
                        }}
                      >
                        <div>
                          <p className="font-semibold">{project.nombre}</p>
                          <p className="text-sm text-gray-500">{project.descripcion || "Sin descripción"}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[project.estatus as keyof typeof STATUS_CONFIG]?.color || "text-gray-600"}`}
                          >
                            {project.estatus}
                          </span>
                          <span className="text-[#3D5A6E] font-bold">
                            ₡{(projectTotals[project.id] || 0).toLocaleString("es-CR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      )
    }

    // Clients list view (when no client is selected)
    return (
      <SidebarProvider>
        <AppSidebar activeView={activeView} onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }} />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <div className="w-full px-8 py-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-[#3D5A6E]" />
                  <h1 className="text-3xl font-bold text-[#3D5A6E]">Gestión de Clientes</h1>
                </div>
                <Image
                  src="/mate-living-logo.png"
                  alt="Mate Living"
                  width={200}
                  height={24}
                  className="h-11 w-auto"
                />
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                <Input
                  placeholder="Buscar clientes..."
                  value={clientFilterText}
                  onChange={(e) => setClientFilterText(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {/* Clients Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#3D5A6E] text-white">
                        <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo Cliente</th>
                        <th className="px-4 py-3 text-left font-semibold">Contacto</th>
                        <th className="px-4 py-3 text-left font-semibold">Estado</th>
                        <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                        <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr
                          key={client.id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedClient(client)
                            loadClientProjects(client.id, client.nombre_empresa)
                          }}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold">{client.nombre_empresa}</p>
                              <p className="text-sm text-gray-500">{client.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{client.tipo_cliente}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{client.contacto}</p>
                              <p className="text-sm text-gray-500">{client.telefono}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${CLIENT_ESTADO_CONFIG[client.estado]?.color || "bg-gray-100 text-gray-800"}`}>
                              {client.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(client.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedClient(client)
                                  loadClientProjects(client.id, client.nombre_empresa)
                                }}
                                className="h-8 w-8 text-gray-500 hover:text-[#3D5A6E] hover:bg-[#3D5A6E]/10"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No se encontraron clientes.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Products Management View
  if (activeView === "productos" && !selectedProject) {
  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }} />
      <SidebarInset>
        <div className="min-h-screen bg-gray-50">
          <div className="w-full px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-[#3D5A6E]" />
              <h1 className="text-3xl font-bold text-[#3D5A6E]">Gestión de Productos</h1>
                  <Button
                    onClick={() => {
                      setEditingProductData({}) // Clear previous data
                      setIsEditingProduct(null) // Ensure no product is marked as editing
                      setIsAddingProduct(true) // Open the form to add a new product
                      setShowProductDialog(true) // Open the dialog
                    }}
                    className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Producto
                  </Button>
                </div>
                <Image
                  src="/mate-living-logo.png"
                  alt="Mate Living"
                  width={200}
                  height={24}
                  className="h-11 w-auto"
                />
              </div>
            </div>

        <div className="px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Free text search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cualquier campo..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D5A6E] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setSubcategoryFilter("all")
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D5A6E] focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  {Array.from(new Set(allProducts.map((p) => p.Categoria)))
                    .sort()
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              {/* Subcategory filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría</label>
                <select
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D5A6E] focus:border-transparent"
                  disabled={categoryFilter === "all"}
                >
                  <option value="all">Todas</option>
                  {Array.from(
                    new Set(
                      allProducts
                        .filter((p) => categoryFilter === "all" || p.Categoria === categoryFilter)
                        .map((p) => p.Subcategoria),
                    ),
                  )
                    .sort()
                    .map((subcat) => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Clear filters button */}
            {(productSearchTerm || categoryFilter !== "all" || subcategoryFilter !== "all") && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProductSearchTerm("")
                    setCategoryFilter("all")
                    setSubcategoryFilter("all")
                  }}
                  className="text-gray-600"
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#3D5A6E]">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Categoría</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Subcategoría</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Item</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Proveedor</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Costo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allProducts
                    .filter((product) => {
                      // Apply search filter
                      const searchLower = productSearchTerm.toLowerCase()
                      const matchesSearch =
                        !productSearchTerm ||
                        product.Categoria?.toLowerCase().includes(searchLower) ||
                        product.Subcategoria?.toLowerCase().includes(searchLower) ||
                        product.Item?.toLowerCase().includes(searchLower) ||
                        product.Proveedor?.toLowerCase().includes(searchLower)

                      // Apply category filter
                      const matchesCategory = categoryFilter === "all" || product.Categoria === categoryFilter

                      // Apply subcategory filter
                      const matchesSubcategory =
                        subcategoryFilter === "all" || product.Subcategoria === subcategoryFilter

                      return matchesSearch && matchesCategory && matchesSubcategory
                    })
                    .map((product) => (
                      <tr className="hover:bg-gray-50" key={product.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.Categoria}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.Subcategoria}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.Item}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.Proveedor}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#3D5A6E] text-right">
                          {formatCurrency(product.Costo)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProductData({
                                  Categoria: product.Categoria || "",
                                  Subcategoria: product.Subcategoria || "",
                                  Item: product.Item || "",
                                  Proveedor: product.Proveedor || "",
                                  Costo: product.Costo || 0,
                                })
                                setIsEditingProduct(product.id)
                                setShowProductDialog(true)
                              }}
                              className="text-[#3D5A6E] hover:text-[#2D4A5E] hover:bg-[#3D5A6E]/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProductAPI(product.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {allProducts.filter((product) => {
                const searchLower = productSearchTerm.toLowerCase()
                const matchesSearch =
                  !productSearchTerm ||
                  product.Categoria?.toLowerCase().includes(searchLower) ||
                  product.Subcategoria?.toLowerCase().includes(searchLower) ||
                  product.Item?.toLowerCase().includes(searchLower) ||
                  product.Proveedor?.toLowerCase().includes(searchLower)
                const matchesCategory = categoryFilter === "all" || product.Categoria === categoryFilter
                const matchesSubcategory = subcategoryFilter === "all" || product.Subcategoria === subcategoryFilter
                return matchesSearch && matchesCategory && matchesSubcategory
              }).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se encontraron productos con los filtros aplicados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ProductDialog
          isOpen={showProductDialog}
          onClose={() => {
            setShowProductDialog(false)
            setIsEditingProduct(null)
            setIsAddingProduct(false)
          }}
          isEditing={isEditingProduct !== null}
          productData={isEditingProduct ? editingProductData : newProductData}
          setProductData={isEditingProduct ? setEditingProductData : setNewProductData}
          onSave={isEditingProduct ? () => handleUpdateProductAPI(isEditingProduct) : handleCreateProductAPI}
          initialProductData={isEditingProduct ? editingProductData : newProductData}
        />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (activeView === "leads" && !selectedProject) {
    return (
      <SidebarProvider>
        <AppSidebar activeView={activeView} onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }} />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <div className="w-full px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-[#3D5A6E]" />
                <h1 className="text-3xl font-bold text-[#3D5A6E]">Gestión de Leads</h1>
              </div>
  <Image
  src="/mate-living-logo.png"
  alt="Mate Living"
  width={200}
  height={24}
  className="h-11 w-auto"
  />
  </div>
  
  {/* Filters */}
  <div className="mb-6 flex flex-wrap gap-4 items-center">
  <Input
  placeholder="Buscar leads..."
              value={leadFilterText}
              onChange={(e) => setLeadFilterText(e.target.value)}
              className="max-w-xs"
            />
            <Select value={leadEstadoFilter} onValueChange={setLeadEstadoFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                {Object.keys(LEAD_ESTADO_CONFIG).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={leadPrioridadFilter} onValueChange={setLeadPrioridadFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Prioridades</SelectItem>
                {Object.keys(LEAD_PRIORIDAD_CONFIG).map((prioridad) => (
                  <SelectItem key={prioridad} value={prioridad}>
                    {prioridad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={leadOrigenFilter} onValueChange={setLeadOrigenFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Orígenes</SelectItem>
                {LEAD_ORIGEN_OPTIONS.map((origen) => (
                  <SelectItem key={origen} value={origen}>
                    {origen}
                  </SelectItem>
                ))}
  </SelectContent>
  </Select>
  <Button onClick={() => setShowNewLeadDialog(true)} className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white ml-auto">
  <UserPlus className="mr-2 h-4 w-4" />
  Nuevo Lead
  </Button>
  </div>
  
  {/* Leads Table */}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {leadFilterText ||
              leadEstadoFilter !== "all" ||
              leadPrioridadFilter !== "all" ||
              leadOrigenFilter !== "all"
                ? "No se encontraron leads con los filtros aplicados"
                : "No hay leads aún. Crea uno nuevo para comenzar."}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#3D5A6E] text-white font-semibold rounded-t-lg text-sm">
                <div className="col-span-2">Empresa</div>
                <div className="col-span-2">Tipo Cliente</div>
                <div className="col-span-2">Contacto</div>
                <div className="col-span-1">Origen</div>
                <div className="col-span-1">Estado</div>
                <div className="col-span-1">Prioridad</div>
                <div className="col-span-1">Fecha</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>

              {/* Table Body */}
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow items-center text-sm"
                >
                  <div className="col-span-2">
                    <p className="font-semibold truncate">{lead.nombre_empresa}</p>
                    {lead.email && <p className="text-xs text-gray-500 truncate">{lead.email}</p>}
                  </div>
                  <div className="col-span-2 text-gray-600 truncate">
                    {lead.tipo_cliente === "Otro" ? lead.tipo_cliente_otro : lead.tipo_cliente}
                  </div>
                  <div className="col-span-2">
                    <p className="truncate">{lead.contacto || "-"}</p>
                    {lead.telefono && <p className="text-xs text-gray-500">{lead.telefono}</p>}
                  </div>
                  <div className="col-span-1 text-gray-600 text-xs">{lead.origen}</div>
                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${LEAD_ESTADO_CONFIG[lead.estado]?.color || "bg-gray-100"}`}
                    >
                      {lead.estado}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${LEAD_PRIORIDAD_CONFIG[lead.prioridad]?.color || "bg-gray-100"}`}
                    >
                      {lead.prioridad}
                    </span>
                  </div>
                  <div className="col-span-1 text-gray-500 text-xs">
                    {new Date(lead.created_at).toLocaleDateString("es-CR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="col-span-2 flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingLead(lead)
                        setShowEditLeadDialog(true)
                      }}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4 text-[#3D5A6E]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setConvertingLead(lead)
                        setShowConvertLeadDialog(true)
                      }}
                      title="Convertir a Proyecto"
                    >
                      <ArrowRightCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLead(lead.id)} title="Eliminar">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Lead Dialog */}
        <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-[#3D5A6E]">
                  Nombre / Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newLead.nombre_empresa}
                  onChange={(e) => setNewLead({ ...newLead, nombre_empresa: e.target.value })}
                  placeholder="Ej: Constructora ABC"
                />
              </div>
              <div>
                <Label className="text-[#3D5A6E]">Tipo de Cliente</Label>
                <Select
                  value={newLead.tipo_cliente}
                  onValueChange={(value) => setNewLead({ ...newLead, tipo_cliente: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_TIPO_CLIENTE_OPTIONS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newLead.tipo_cliente === "Otro" && (
                <div>
                  <Label className="text-[#3D5A6E]">
                    Especificar Tipo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newLead.tipo_cliente_otro}
                    onChange={(e) => setNewLead({ ...newLead, tipo_cliente_otro: e.target.value })}
                    placeholder="Especifique el tipo de cliente"
                    className="border-red-300"
                  />
                </div>
              )}
              <div>
                <Label className="text-[#3D5A6E]">Contacto</Label>
                <Input
                  value={newLead.contacto}
                  onChange={(e) => setNewLead({ ...newLead, contacto: e.target.value })}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#3D5A6E]">Teléfono</Label>
                  <Input
                    value={newLead.telefono}
                    onChange={(e) => setNewLead({ ...newLead, telefono: e.target.value })}
                    placeholder="8888-8888"
                  />
                </div>
                <div>
                  <Label className="text-[#3D5A6E]">Email</Label>
                  <Input
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#3D5A6E]">Origen</Label>
                  <Select value={newLead.origen} onValueChange={(value) => setNewLead({ ...newLead, origen: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_ORIGEN_OPTIONS.map((origen) => (
                        <SelectItem key={origen} value={origen}>
                          {origen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#3D5A6E]">Estado</Label>
                  <Select value={newLead.estado} onValueChange={(value) => setNewLead({ ...newLead, estado: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LEAD_ESTADO_CONFIG)
                        .filter((e) => e !== "Convertido")
                        .map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#3D5A6E]">Prioridad</Label>
                  <Select
                    value={newLead.prioridad}
                    onValueChange={(value) => setNewLead({ ...newLead, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LEAD_PRIORIDAD_CONFIG).map((prioridad) => (
                        <SelectItem key={prioridad} value={prioridad}>
                          {prioridad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[#3D5A6E]">Notas</Label>
                <Textarea
                  value={newLead.notas}
                  onChange={(e) => setNewLead({ ...newLead, notas: e.target.value })}
                  placeholder="Notas adicionales sobre el lead..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateLead}
                className="w-full bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
                disabled={!newLead.nombre_empresa || (newLead.tipo_cliente === "Otro" && !newLead.tipo_cliente_otro)}
              >
                Crear Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={showEditLeadDialog} onOpenChange={setShowEditLeadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Lead</DialogTitle>
            </DialogHeader>
            {editingLead && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#3D5A6E]">
                    Nombre / Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editingLead.nombre_empresa}
                    onChange={(e) => setEditingLead({ ...editingLead, nombre_empresa: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-[#3D5A6E]">Tipo de Cliente</Label>
                  <Select
                    value={editingLead.tipo_cliente}
                    onValueChange={(value) => setEditingLead({ ...editingLead, tipo_cliente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_TIPO_CLIENTE_OPTIONS.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingLead.tipo_cliente === "Otro" && (
                  <div>
                    <Label className="text-[#3D5A6E]">
                      Especificar Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={editingLead.tipo_cliente_otro || ""}
                      onChange={(e) => setEditingLead({ ...editingLead, tipo_cliente_otro: e.target.value })}
                      className="border-red-300"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-[#3D5A6E]">Contacto</Label>
                  <Input
                    value={editingLead.contacto || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, contacto: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#3D5A6E]">Teléfono</Label>
                    <Input
                      value={editingLead.telefono || ""}
                      onChange={(e) => setEditingLead({ ...editingLead, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-[#3D5A6E]">Email</Label>
                    <Input
                      value={editingLead.email || ""}
                      onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#3D5A6E]">Origen</Label>
                    <Select
                      value={editingLead.origen}
                      onValueChange={(value) => setEditingLead({ ...editingLead, origen: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_ORIGEN_OPTIONS.map((origen) => (
                          <SelectItem key={origen} value={origen}>
                            {origen}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#3D5A6E]">Estado</Label>
                    <Select
                      value={editingLead.estado}
                      onValueChange={(value) => setEditingLead({ ...editingLead, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(LEAD_ESTADO_CONFIG).map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#3D5A6E]">Prioridad</Label>
                    <Select
                      value={editingLead.prioridad}
                      onValueChange={(value) => setEditingLead({ ...editingLead, prioridad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(LEAD_PRIORIDAD_CONFIG).map((prioridad) => (
                          <SelectItem key={prioridad} value={prioridad}>
                            {prioridad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[#3D5A6E]">Notas</Label>
                  <Textarea
                    value={editingLead.notas || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, notas: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleUpdateLead}
                  className="w-full bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
                  disabled={
                    !editingLead.nombre_empresa ||
                    (editingLead.tipo_cliente === "Otro" && !editingLead.tipo_cliente_otro)
                  }
                >
                  Actualizar Lead
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Convert Lead to Project Dialog */}
        <Dialog open={showConvertLeadDialog} onOpenChange={setShowConvertLeadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Convertir Lead a Proyecto</DialogTitle>
            </DialogHeader>
            {convertingLead && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  ¿Deseas convertir el lead <strong>{convertingLead.nombre_empresa}</strong> en un nuevo proyecto?
                </p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>
                    <strong>Nombre del Proyecto:</strong> {convertingLead.nombre_empresa}
                  </p>
                  <p>
                    <strong>Cliente:</strong> {convertingLead.contacto || convertingLead.nombre_empresa}
                  </p>
                  <p>
                    <strong>Margen inicial:</strong> 40%
                  </p>
                  <p>
                    <strong>Estatus:</strong> Borrador
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowConvertLeadDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleConvertLead} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <ArrowRightCircle className="mr-2 h-4 w-4" />
                    Convertir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null)
          setShowFinalSummary(false) // Reset summary state when going back
        }}
        showFinalSummary={showFinalSummary}
        setShowFinalSummary={setShowFinalSummary}
      />
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }} />
      <SidebarInset>
        <div className="min-h-screen bg-white">
          {/* Projects View */}
          <div className="w-full px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-[#3D5A6E]" />
                <h1 className="text-3xl font-bold text-[#3D5A6E]">Proyectos</h1>
              </div>
              <Image
                src="/mate-living-logo.png"
                alt="Mate Living"
                width={200}
                height={24}
                className="h-11 w-auto"
              />
            </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Buscar proyectos..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Ordenar por:</label>
              <Select value={sortField} onValueChange={(value) => setSortField(value as keyof Project)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="estatus">Estatus</SelectItem>
                  <SelectItem value="created_at">Fecha Creación</SelectItem>
                  <SelectItem value="updated_at">Última Modificación</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                className="border-[#3D5A6E] text-[#3D5A6E] hover:bg-[#3D5A6E] hover:text-white"
              >
                {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>
            {/* </CHANGE> Added CSV download button */}
            <Button onClick={handleDownloadCSV} className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => setShowNewProjectDialog(true)}
              className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white ml-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        {sortedAndFilteredProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {filterText ? "No se encontraron proyectos" : "No hay proyectos aún. Crea uno nuevo para comenzar."}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-13 gap-4 px-4 py-3 bg-[#3D5A6E] text-white font-semibold rounded-t-lg text-sm">
              <div className="col-span-2">Nombre</div>
              <div className="col-span-1">Cliente</div>
              <div className="col-span-3">Descripción</div>
              <div className="col-span-2 text-right">Total Venta</div>
              <div className="col-span-1">Estatus</div>
              <div className="col-span-1">
                <div>Fecha</div>
                <div>Creación</div>
              </div>
              <div className="col-span-1">
                <div>Ultimo</div>
                <div>Cambio</div>
              </div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            {/* Table Rows */}
            {sortedAndFilteredProjects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-13 gap-4 px-4 py-3 border border-[#3D5A6E]/20 hover:bg-[#3D5A6E]/5 transition-colors cursor-pointer rounded-lg items-center"
                onClick={() => setSelectedProject(project)}
                data-project-detail // Added for selecting project detail view
              >
                <div className="col-span-2 font-semibold text-black truncate">{project.nombre}</div>
                <div className="col-span-1 text-sm text-gray-700 truncate">{project.cliente || "-"}</div>
                <div className="col-span-3 text-sm text-gray-600 truncate">{project.descripcion || "-"}</div>
<div className="col-span-2 text-[#3D5A6E] font-semibold text-right">
                          {formatCurrency(projectTotals[project.id] || 0)}
                </div>
                {/* </CHANGE> */}
                <div className="col-span-1">
                  <span
                    className={`text-xs ${STATUS_CONFIG[project.estatus as keyof typeof STATUS_CONFIG]?.color || ""}`}
                  >
                    {project.estatus}
                  </span>
                </div>
                <div className="col-span-1 text-xs text-gray-600">
                  <div>{formatDateInSpanish(project.created_at, "short")}</div>
                  <div>{formatDateInSpanish(project.created_at, "year")}</div>
                </div>
                <div className="col-span-1 text-xs text-gray-600">
                  <div>{formatDateInSpanish(project.updated_at, "short")}</div>
                  <div>{formatDateInSpanish(project.updated_at, "year")}</div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditProject(project)
                    }}
                    className="h-7 w-7 text-[#3D5A6E] hover:text-[#2D4A5E] hover:bg-[#3D5A6E]/10"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {/* Add duplicate button after edit button in the actions column */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicateProject(project)
                    }}
                    className="h-7 w-7 text-[#3D5A6E] hover:text-[#2D4A5E] hover:bg-[#3D5A6E]/10"
                    title="Duplicar"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProject(project)
                      setShowFinalSummary(true)
                    }}
                    className="h-7 w-7 text-[#3D5A6E] hover:text-[#2D4A5E] hover:bg-[#3D5A6E]/10"
                    title="Ver Resumen"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {/* Replace the simple product dialog with a full products management view */}
      {/* Removed Dialog for showProductManager, replaced by ProductsManagementView */}

      {/* New Product Dialog (kept for now as it's distinct from the product manager) */}
      <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#3D5A6E]">Agregar Nuevo Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Input
                id="categoria"
                placeholder="Ej: Acabados"
                value={newProject.categoria}
                onChange={(e) => setNewProject({ ...newProject, categoria: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategoria">
                Subcategoría <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subcategoria"
                placeholder="Ej: Tapetas"
                value={newProject.subcategoria}
                onChange={(e) => setNewProject({ ...newProject, subcategoria: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item">
                Item <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item"
                placeholder="Ej: TAPETA PVC 22MM"
                value={newProject.item}
                onChange={(e) => setNewProject({ ...newProject, item: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor">
                Proveedor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="proveedor"
                placeholder="Ej: EPA"
                value={newProject.proveedor}
                onChange={(e) => setNewProject({ ...newProject, proveedor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo">
                Costo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="costo"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={newProject.costo}
                onChange={(e) => setNewProject({ ...newProject, costo: Number.parseFloat(e.target.value) || 0 })}
                className="pr-8"
              />
            </div>
            <Button
              onClick={handleCreateProductAPI}
              className="w-full"
              disabled={
                !newProject?.categoria?.trim() ||
                !newProject?.subcategoria?.trim() ||
                !newProject?.item?.trim() ||
                !newProject?.proveedor?.trim() ||
                !newProject?.costo
              }
            >
              Agregar Producto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#3D5A6E]">Editar Proyecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-projectName" className="text-[#3D5A6E]">
                Nombre del Proyecto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-projectName"
                placeholder="Ej: Cocina Casa María"
                value={editingProject?.nombre || ""}
                onChange={(e) => setEditingProject({ ...editingProject, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-clientName" className="text-[#3D5A6E]">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editingProject?.cliente || ""}
                onValueChange={(value) => setEditingProject({ ...editingProject, cliente: value })}
              >
                <SelectTrigger id="edit-clientName">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 && (
                    <>
                      <SelectItem value="__clients_header__" disabled className="font-bold text-[#3D5A6E]">
                        -- Clientes --
                      </SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={`client-${client.id}`} value={client.nombre_empresa}>
                          {client.nombre_empresa} ({client.tipo_cliente})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {leads.length > 0 && (
                    <>
                      <SelectItem value="__leads_header__" disabled className="font-bold text-[#3D5A6E]">
                        -- Leads --
                      </SelectItem>
                      {leads.filter(l => l.estado !== "Convertido").map((lead) => (
                        <SelectItem key={`lead-${lead.id}`} value={lead.nombre_empresa}>
                          {lead.nombre_empresa} ({lead.tipo_cliente})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-[#3D5A6E]">
                Descripción
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Descripción del proyecto..."
                value={editingProject?.descripcion || ""}
                onChange={(e) => setEditingProject({ ...editingProject, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-margen" className="text-[#3D5A6E]">
                  Margen <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="edit-margen"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={editingProject?.margen || 0}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, margen: Number.parseFloat(e.target.value) || 0 })
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#3D5A6E]">Utilidad Esperada</Label>
                <div className="p-2 bg-gray-100 rounded-md text-right font-medium">
                  ₡{((projectTotals[editingProject?.id] || 0) * ((editingProject?.margen || 0) / 100)).toLocaleString("es-CR", { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            {["Pagado", "Finalizado"].includes(editingProject?.estatus || "") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-utilidad-real" className="text-[#3D5A6E]">
                    Utilidad Real
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₡</span>
                    <Input
                      id="edit-utilidad-real"
                      type="number"
                      placeholder="0"
                      value={editingProject?.utilidad_real || 0}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, utilidad_real: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#3D5A6E]">Margen Real</Label>
                  <div className="p-2 bg-gray-100 rounded-md text-right font-medium">
                    {(((editingProject?.utilidad_real || 0) / (projectTotals[editingProject?.id] || 1)) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-estatus" className="text-[#3D5A6E]">
                Estatus <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editingProject?.estatus || "Borrador"}
                onValueChange={(value) =>
                  setEditingProject({
                    ...editingProject,
                    estatus: value,
                    razon_perdida: value !== "Rechazado" ? "" : editingProject?.razon_perdida,
                    competidor: value !== "Rechazado" ? "" : editingProject?.competidor,
                    detalle_perdida: value !== "Rechazado" ? "" : editingProject?.detalle_perdida,
                  })
                }
              >
                <SelectTrigger id="edit-estatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {["Aceptado", "Produccion", "Entregado", "Pagado", "Finalizado"].includes(editingProject?.estatus || "") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-adelanto" className="text-[#3D5A6E]">
                    Adelanto <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editingProject?.adelanto || "No"}
                    onValueChange={(value) => {
                      let porcentaje = 0
                      if (value === "Contado") porcentaje = 100
                      else if (value === "No") porcentaje = 0
                      else porcentaje = editingProject?.porcentaje_adelanto || 0
                      
                      const projectTotal = projectTotals[editingProject?.id] || 0
                      const monto = (projectTotal * porcentaje) / 100
                      const saldo = projectTotal - monto
                      
                      setEditingProject({
                        ...editingProject,
                        adelanto: value,
                        porcentaje_adelanto: porcentaje,
                        monto_adelanto: monto,
                        saldo: saldo,
                      })
                    }}
                  >
                    <SelectTrigger id="edit-adelanto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Si">Sí</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Contado">Contado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-porcentaje-adelanto" className="text-[#3D5A6E]">
                    % Adelanto
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-porcentaje-adelanto"
                      type="number"
                      placeholder="0"
                      min="1"
                      max="99"
                      value={editingProject?.porcentaje_adelanto || 0}
                      onChange={(e) => {
                        const porcentaje = Math.min(99, Math.max(1, Number.parseInt(e.target.value) || 0))
                        const projectTotal = projectTotals[editingProject?.id] || 0
                        const monto = (projectTotal * porcentaje) / 100
                        const saldo = projectTotal - monto
                        setEditingProject({
                          ...editingProject,
                          porcentaje_adelanto: porcentaje,
                          monto_adelanto: monto,
                          saldo: saldo,
                        })
                      }}
                      disabled={editingProject?.adelanto !== "Si"}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#3D5A6E]">Monto Adelanto</Label>
                    <div className="p-2 bg-gray-100 rounded-md text-right font-medium">
                      ₡{(editingProject?.monto_adelanto || 0).toLocaleString("es-CR")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#3D5A6E]">
                      {["Pagado", "Finalizado"].includes(editingProject?.estatus || "") ? "Saldo Pagado" : "Saldo Pendiente"}
                    </Label>
                    <div className="p-2 bg-gray-100 rounded-md text-right font-medium">
                      ₡{(editingProject?.saldo || (projectTotals[editingProject?.id] || 0)).toLocaleString("es-CR")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#3D5A6E] font-bold">Total</Label>
                    <div className="p-2 bg-[#3D5A6E] text-white rounded-md text-right font-bold">
                      ₡{(projectTotals[editingProject?.id] || 0).toLocaleString("es-CR")}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fecha-entrega" className="text-[#3D5A6E]">
                    Fecha de Entrega <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-fecha-entrega"
                    type="date"
                    value={editingProject?.fecha_entrega || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, fecha_entrega: e.target.value })}
                  />
                </div>
                {["Entregado", "Pagado", "Finalizado"].includes(editingProject?.estatus || "") && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-fecha-real" className="text-[#3D5A6E]">
                      Fecha Real de Entrega <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-fecha-real"
                      type="date"
                      value={editingProject?.fecha_real || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, fecha_real: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
            {editingProject?.estatus === "Rechazado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-razon-perdida" className="text-[#3D5A6E]">
                    Razón de Pérdida <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editingProject?.razon_perdida || ""}
                    onValueChange={(value) => setEditingProject({ ...editingProject, razon_perdida: value })}
                  >
                    <SelectTrigger id="edit-razon-perdida" className="border-red-300 focus:border-red-500">
                      <SelectValue placeholder="Seleccione una razón..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RAZON_PERDIDA_OPTIONS.map((razon) => (
                        <SelectItem key={razon} value={razon}>
                          {razon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-competidor" className="text-[#3D5A6E]">
                    Competidor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-competidor"
                    placeholder="Nombre del competidor..."
                    value={editingProject?.competidor || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, competidor: e.target.value })}
                    className="border-red-300 focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-detalle-perdida" className="text-[#3D5A6E]">
                    Detalle de Pérdida <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="edit-detalle-perdida"
                    placeholder="Describa los detalles de la pérdida..."
                    value={editingProject?.detalle_perdida || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, detalle_perdida: e.target.value })}
                    rows={3}
                    className="border-red-300 focus:border-red-500"
                  />
                </div>
              </>
            )}
            {/* </CHANGE> */}
            <Button
              onClick={handleUpdateProject}
              className="w-full bg-[#3D5A6E] hover:bg-[#2D4A5E]"
              disabled={
                !editingProject?.nombre?.trim() ||
                !editingProject?.cliente?.trim() ||
                !editingProject?.margen ||
                !editingProject?.estatus ||
                (editingProject?.estatus === "Rechazado" &&
                  (!editingProject?.razon_perdida?.trim() ||
                    !editingProject?.competidor?.trim() ||
                    !editingProject?.detalle_perdida?.trim()))
                // </CHANGE>
              }
            >
              Actualizar Proyecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#3D5A6E]">Crear Nuevo Proyecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-[#3D5A6E]">
                Nombre del Proyecto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectName"
                placeholder="Ej: Cocina Casa María"
                value={newProject.nombre}
                onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-[#3D5A6E]">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                placeholder="Ej: María González"
                value={newProject.cliente}
                onChange={(e) => setNewProject({ ...newProject, cliente: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#3D5A6E]">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Descripción del proyecto..."
                value={newProject.descripcion}
                onChange={(e) => setNewProject({ ...newProject, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margen" className="text-[#3D5A6E]">
                Margen <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="margen"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={newProject.margen}
                  onChange={(e) => setNewProject({ ...newProject, margen: Number.parseFloat(e.target.value) || 0 })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estatus" className="text-[#3D5A6E]">
                Estatus <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newProject.estatus}
                onValueChange={(value) =>
                  setNewProject({
                    ...newProject,
                    estatus: value,
                    razon_perdida: value !== "Rechazado" ? "" : newProject.razon_perdida,
                    competidor: value !== "Rechazado" ? "" : newProject.competidor,
                    detalle_perdida: value !== "Rechazado" ? "" : newProject.detalle_perdida,
                  })
                }
              >
                <SelectTrigger id="estatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newProject.estatus === "Rechazado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="razon-perdida" className="text-[#3D5A6E]">
                    Razón de Pérdida <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newProject.razon_perdida}
                    onValueChange={(value) => setNewProject({ ...newProject, razon_perdida: value })}
                  >
                    <SelectTrigger id="razon-perdida" className="border-red-300 focus:border-red-500">
                      <SelectValue placeholder="Seleccione una razón..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RAZON_PERDIDA_OPTIONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competidor" className="text-[#3D5A6E]">
                    Competidor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="competidor"
                    placeholder="Nombre del competidor..."
                    value={newProject.competidor}
                    onChange={(e) => setNewProject({ ...newProject, competidor: e.target.value })}
                    className="border-red-300 focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detalle-perdida" className="text-[#3D5A6E]">
                    Detalle de Pérdida <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="detalle-perdida"
                    placeholder="Detalles sobre la pérdida del proyecto..."
                    value={newProject.detalle_perdida}
                    onChange={(e) => setNewProject({ ...newProject, detalle_perdida: e.target.value })}
                    rows={3}
                    className="border-red-300 focus:border-red-500"
                  />
                </div>
              </>
            )}
            <Button
              onClick={handleCreateProject}
              className="w-full bg-[#3D5A6E] hover:bg-[#2D4A5E]"
              disabled={
                !newProject.nombre.trim() ||
                !newProject.cliente.trim() ||
                !newProject.margen ||
                !newProject.estatus ||
                (newProject.estatus === "Rechazado" &&
                  (!newProject.razon_perdida?.trim() ||
                    !newProject.competidor?.trim() ||
                    !newProject.detalle_perdida?.trim()))
              }
            >
              Crear Proyecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ProductDialog
        isOpen={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        isEditing={isEditingProduct !== null}
        productData={isEditingProduct ? editingProductData : newProductData}
        setProductData={isEditingProduct ? setEditingProductData : setNewProductData}
        onSave={isEditingProduct ? () => handleUpdateProductAPI(isEditingProduct) : handleCreateProductAPI}
        initialProductData={isEditingProduct ? editingProductData : newProductData}
      />
      </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ProductDialog({
  isOpen,
  onClose,
  isEditing,
  productData,
  setProductData,
  onSave,
  initialProductData,
}: {
  isOpen: boolean
  onClose: () => void
  isEditing: boolean
  productData: {
    categoria: string
    subcategoria: string
    item: string
    proveedor: string
    costo: number
  }
  setProductData: React.Dispatch<
    React.SetStateAction<{
      categoria: string
      subcategoria: string
      item: string
      proveedor: string
      costo: number
    }>
  >
  onSave: () => void
  initialProductData?: {
    categoria: string
    subcategoria: string
    item: string
    proveedor: string
    costo: number
  }
}) {
  const prevIsOpenRef = React.useRef(isOpen)

  useEffect(() => {
    // Only reset when dialog opens (transition from closed to open)
    if (isOpen && !prevIsOpenRef.current) {
      if (initialProductData) {
        setProductData(initialProductData)
      }
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, initialProductData, setProductData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#3D5A6E]">{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>
              Categoría <span className="text-red-500">*</span>
            </Label>
            <Input
              value={productData.Categoria || ""}
              onChange={(e) => setProductData({ ...productData, Categoria: e.target.value })}
              placeholder="Nombre de la categoría"
            />
          </div>

          <div>
            <Label>
              Subcategoría <span className="text-red-500">*</span>
            </Label>
            <Input
              value={productData.Subcategoria || ""}
              onChange={(e) => setProductData({ ...productData, Subcategoria: e.target.value })}
              placeholder="Nombre de la subcategoría"
            />
          </div>

          <div>
            <Label>
              Item <span className="text-red-500">*</span>
            </Label>
            <Input
              value={productData.Item || ""}
              onChange={(e) => setProductData({ ...productData, Item: e.target.value })}
              placeholder="Nombre del item"
            />
          </div>

          <div>
            <Label>
              Proveedor <span className="text-red-500">*</span>
            </Label>
            <Input
              value={productData.Proveedor || ""}
              onChange={(e) => setProductData({ ...productData, Proveedor: e.target.value })}
              placeholder="Nombre del proveedor"
            />
          </div>

          <div>
            <Label>
              Costo <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={productData.Costo || ""}
              onChange={(e) => setProductData({ ...productData, Costo: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              className="flex-1 bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
              disabled={
                !productData.Categoria ||
                !productData.Subcategoria ||
                !productData.Item ||
                !productData.Proveedor ||
                !productData.Costo
              }
            >
              {isEditing ? "Actualizar Producto" : "Crear Producto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProjectDetailView({
  project,
  onBack,
  showFinalSummary,
  setShowFinalSummary,
}: {
  project: Project
  onBack: () => void
  showFinalSummary?: boolean
  setShowFinalSummary?: (show: boolean) => void
}) {
  const [elements, setElements] = useState<Element[]>([])
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [isNewElementOpen, setIsNewElementOpen] = useState(false)
  const [elementTotals, setElementTotals] = useState<{ [key: string]: number }>({})

  const [newElementName, setNewElementName] = useState("")
  const [newElementTipo, setNewElementTipo] = useState("")
  const [newElementImage, setNewElementImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [isEditElementOpen, setIsEditElementOpen] = useState(false)
  const [editingElement, setEditingElement] = useState<any>(null)
  const [editElementName, setEditElementName] = useState("")
  const [editElementTipo, setEditElementTipo] = useState("")
  const [editElementImage, setEditElementImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportPDF = async () => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = 15

    // Calculate totals
    const subtotal = elements.reduce((sum, el) => sum + (elementTotals[el.id] || 0), 0)
    const iva = subtotal * 0.13
    const total = subtotal + iva

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("es-CR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }

    const formatPDFCurrency = (amount: number): string => {
      const formatted = amount.toLocaleString("es-CR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      return `CRC ${formatted}`
    }

    const drawCard = (x: number, y: number, width: number, height: number) => {
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.roundedRect(x, y, width, height, 3, 3)
    }

    try {
      const logoImg = new window.Image()
      logoImg.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            const canvas = document.createElement("canvas")
            canvas.width = logoImg.width
            canvas.height = logoImg.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(logoImg, 0, 0)
              const dataUrl = canvas.toDataURL("image/jpeg")

              const logoWidth = 45
              const logoHeight = (logoImg.height / logoImg.width) * logoWidth
              pdf.addImage(dataUrl, "JPEG", margin, yPosition, logoWidth, logoHeight)
            }
            resolve(true)
          } catch (err) {
            reject(err)
          }
        }
        logoImg.onerror = (err) => {
          reject(err)
        }
        logoImg.src = "/mate-living-logo.png"
      })
    } catch (error) {
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(91, 164, 180)
      pdf.text("Mate", margin, yPosition + 8)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "normal")
      pdf.text("Millworkers", margin, yPosition + 15)
    }

    pdf.setTextColor(91, 164, 180)
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("Cotización de Proyecto", pageWidth - margin, yPosition + 12, { align: "right" })

    yPosition += 35

    drawCard(margin, yPosition, pageWidth - margin * 2, 52)
    yPosition += 5

    pdf.setTextColor(91, 164, 180)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("Información del Proyecto", margin + 5, yPosition + 5)
    yPosition += 12

    const leftColX = margin + 5
    const rightColX = pageWidth / 2 + 10
    const labelValueSpacing = 4
    const fieldSpacing = 7

    const contentStartY = yPosition

    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Nombre del Proyecto", leftColX, yPosition)
    yPosition += labelValueSpacing
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(project.nombre, leftColX, yPosition)
    yPosition += fieldSpacing

    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Cliente", leftColX, yPosition)
    yPosition += labelValueSpacing
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(project.cliente || "N/A", leftColX, yPosition)
    yPosition += fieldSpacing

    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Descripción", leftColX, yPosition)
    yPosition += labelValueSpacing
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    const description = project.descripcion || "N/A"
    const descLines = pdf.splitTextToSize(description, 80)
    pdf.text(descLines, leftColX, yPosition)

    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Fecha", rightColX, contentStartY)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(formatDate(new Date()), rightColX, contentStartY + labelValueSpacing)

    const validHastaY = contentStartY + labelValueSpacing + fieldSpacing
    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Válido Hasta", rightColX, validHastaY)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    const validUntilDate = new Date()
    validUntilDate.setDate(validUntilDate.getDate() + 15)
    pdf.text(formatDate(validUntilDate), rightColX, validHastaY + labelValueSpacing)

    yPosition += fieldSpacing * Math.max(descLines.length - 1, 0) + 25

    pdf.setTextColor(91, 164, 180)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("Elementos del Proyecto", margin, yPosition)
    yPosition += 8

    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)

    for (const element of elements) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = margin
      }

      const elementCardHeight = 30
      drawCard(margin, yPosition, pageWidth - margin * 2, elementCardHeight)

      if (element.imagen_url) {
        try {
          const response = await fetch(element.imagen_url)
          const blob = await response.blob()
          const reader = new FileReader()

          await new Promise<void>((resolve) => {
            reader.onloadend = () => {
              try {
                const base64data = reader.result as string
                pdf.addImage(base64data, "JPEG", margin + 3, yPosition + 3, 24, 24)
              } catch (e) {
                // Ignore image error
              }
              resolve()
            }
            reader.onerror = () => {
              resolve()
            }
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          // Ignore image load error
        }
      }

      const textStartX = margin + 32
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.setTextColor(0, 0, 0)
      pdf.text(element.nombre, textStartX, yPosition + 10)

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(element.tipo, textStartX, yPosition + 16)

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.setTextColor(0, 0, 0)
      const price = elementTotals[element.id] || 0
      const priceText = formatPDFCurrency(price)
      pdf.text(priceText, pageWidth - margin - 5, yPosition + 13, { align: "right" })
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text("Precio de Venta", pageWidth - margin - 5, yPosition + 19, { align: "right" })

      yPosition += elementCardHeight + 5
    }

    yPosition += 5
    pdf.setDrawColor(105, 159, 177)
    pdf.setLineWidth(1)
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition)
    yPosition += 10

    pdf.setTextColor(13, 13, 136)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(11)
    pdf.text("Subtotal:", margin + 5, yPosition)
    const subtotalText = formatPDFCurrency(subtotal)
    pdf.text(subtotalText, pageWidth - margin - 5, yPosition, { align: "right" })
    yPosition += 6

    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "normal")
    pdf.text("IVA (13%):", margin + 5, yPosition)
    const ivaText = formatPDFCurrency(iva)
    pdf.text(ivaText, pageWidth - margin - 5, yPosition, { align: "right" })
    yPosition += 5

    pdf.setDrawColor(220, 220, 220)
    pdf.setLineWidth(0.3)
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition)
    yPosition += 5

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.setTextColor(105, 159, 177)
    pdf.text("Total del Proyecto:", margin + 5, yPosition)
    const totalText = formatPDFCurrency(total)
    pdf.text(totalText, pageWidth - margin - 5, yPosition, { align: "right" })

    const projectName = project.nombre || "Sin Nombre"
    const filename = `Cotización ${projectName} - Mate Millworkers.pdf`
    pdf.save(filename)

    const pdfBlob = pdf.output("blob")
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, "_blank")
  }

  useEffect(() => {
    fetchElements()
  }, [project.id])

  const fetchElements = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data, error } = await supabase
      .from("elements")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })

    if (data) {
      setElements(data)
      calculateElementTotals(data)
    }
  }

  const calculateElementTotals = async (elementsData: Element[]) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const totals: { [key: string]: number } = {}

    for (const element of elementsData) {
      const { data: items, error } = await supabase
        .from("quotation_items")
        .select("*, products(*)")
        .eq("element_id", element.id)

      if (items && items.length > 0) {
        const totalVenta = items.reduce((sum, item) => {
          const costo = item.products?.Costo || 0
          const costoTotal = costo * item.cantidad
          const margenDecimal = project.margen / 100
          const venta = margenDecimal < 1 ? costoTotal / (1 - margenDecimal) : costoTotal
          return sum + venta
        }, 0)
        totals[element.id] = totalVenta
      } else {
        totals[element.id] = 0
      }
    }

    setElementTotals(totals)
  }

  async function handleCreateElement() {
    if (!newElementName.trim() || !newElementTipo) return

    let imagenUrl = null
    if (newElementImage) {
      const reader = new FileReader()
      imagenUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(newElementImage)
      })
    }

    const { data, error } = await supabase
      .from("elements")
      .insert([
        {
          project_id: project.id,
          nombre: newElementName,
          tipo: newElementTipo,
          imagen_url: imagenUrl,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating element:", error)
      return
    }

    if (data) {
      setElements([data, ...elements])
      setNewElementName("")
      setNewElementTipo("")
      setNewElementImage(null)
      setImagePreview(null)
      setIsNewElementOpen(false)
    }
  }

  function handleOpenEditElement(element: any) {
    setEditingElement(element)
    setEditElementName(element.nombre)
    setEditElementTipo(element.tipo)
    setEditImagePreview(element.imagen_url)
    setEditElementImage(null)
    setIsEditElementOpen(true)
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setEditElementImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleUpdateElement() {
    if (!editElementName.trim() || !editElementTipo || !editingElement) return

    let imagenUrl = editingElement.imagen_url
    if (editElementImage) {
      const reader = new FileReader()
      imagenUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(editElementImage)
      })
    }

    const { data, error } = await supabase
      .from("elements")
      .update({
        nombre: editElementName,
        tipo: editElementTipo,
        imagen_url: imagenUrl,
      })
      .eq("id", editingElement.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating element:", error)
      return
    }

    if (data) {
      setElements(elements.map((el) => (el.id === data.id ? data : el)))
      setIsEditElementOpen(false)
      setEditingElement(null)
      setEditElementName("")
      setEditElementTipo("")
      setEditElementImage(null)
      setEditImagePreview(null)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setNewElementImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function getTipoIcon(tipo: string) {
    switch (tipo) {
      case "Cocina":
        return "🍳"
      case "Baño":
        return "🚿"
      case "Closet":
        return "👔"
      case "Oficina":
        return "💼"
      case "Mueble":
        return "🪑"
      case "Otro":
        return "📦"
      default:
        return "📦"
    }
  }

  async function handleDeleteElement(id: string) {
    const { error } = await supabase.from("elements").delete().eq("id", id)

    if (error) {
      console.error("Error deleting element:", error)
      return
    }

    setElements(elements.filter((e) => e.id !== id))
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
  }

  // This component declaration was missing. Added it here.
  const ElementDetailView = ({
    element,
    project,
    onBack,
    calculateElementTotals,
    elements,
  }: {
    element: Element
    project: Project
    onBack: () => void
    calculateElementTotals: (elementsData: Element[]) => Promise<void>
    elements: Element[]
  }) => {
    const [quotationItems, setQuotationItems] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [selectedCategoria, setSelectedCategoria] = useState<string>("")
    const [selectedSubcategoria, setSelectedSubcategoria] = useState<string>("")
    const [selectedItem, setSelectedItem] = useState<string>("")
    const [cantidad, setCantidad] = useState<number>(1)

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    useEffect(() => {
      fetchQuotationItems()
      fetchAllProducts()
    }, [element.id])

    const fetchQuotationItems = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data, error } = await supabase
        .from("quotation_items")
        .select("*, products(*)")
        .eq("element_id", element.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching quotation items:", error)
      } else {
        setQuotationItems(data || [])
      }
    }

    const fetchAllProducts = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data, error } = await supabase.from("products").select("*")

      if (error) {
        console.error("Error fetching products:", error)
      } else {
        setProducts(data || [])
      }
    }

    // Get unique categories
    const categorias = [...new Set(products.map((p) => p.Categoria))].filter(Boolean).sort()

    // Get subcategories for selected category
    const subcategorias = [...new Set(products.filter((p) => p.Categoria === selectedCategoria).map((p) => p.Subcategoria))].filter(Boolean).sort()

    // Get items for selected subcategory
    const items = products.filter((p) => p.Categoria === selectedCategoria && p.Subcategoria === selectedSubcategoria)

    const handleAddItem = async () => {
      if (!selectedItem) {
        alert("Selecciona un item")
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { error } = await supabase.from("quotation_items").insert([
        {
          element_id: element.id,
          product_id: selectedItem,
          cantidad: cantidad,
        },
      ])

      if (error) {
        console.error("Error adding product to element:", error)
        alert("Error al agregar producto")
      } else {
        fetchQuotationItems()
        calculateElementTotals(elements)
        // Reset selections
        setSelectedCategoria("")
        setSelectedSubcategoria("")
        setSelectedItem("")
        setCantidad(1)
      }
    }

    const handleDeleteQuotationItem = async (itemId: string) => {
      if (!confirm("¿Estás seguro de eliminar este ítem?")) return

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { error } = await supabase.from("quotation_items").delete().eq("id", itemId)

      if (error) {
        console.error("Error deleting quotation item:", error)
        alert("Error al eliminar ítem")
      } else {
        fetchQuotationItems()
        calculateElementTotals(elements)
      }
    }

    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
      if (newQuantity < 1) return

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { error } = await supabase
        .from("quotation_items")
        .update({ cantidad: newQuantity })
        .eq("id", itemId)

      if (error) {
        console.error("Error updating quantity:", error)
        alert("Error al actualizar cantidad")
      } else {
        fetchQuotationItems()
        calculateElementTotals(elements)
      }
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-8 py-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-gray-300 hover:bg-gray-100 bg-transparent"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a Proyecto
            </Button>
            <div>
              <p className="text-sm text-gray-500">{project.nombre}</p>
              <h1 className="text-3xl font-bold text-[#3D5A6E]">{element.nombre}</h1>
              <p className="text-gray-600">{element.tipo}</p>
            </div>
          </div>

          {/* Agregar Productos Card */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#3D5A6E] text-lg">Agregar Productos</CardTitle>
              <p className="text-sm text-gray-500">Selecciona los productos para este elemento</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-gray-600">Categoría</Label>
                  <Select
                    value={selectedCategoria}
                    onValueChange={(value) => {
                      setSelectedCategoria(value)
                      setSelectedSubcategoria("")
                      setSelectedItem("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Subcategoría</Label>
                  <Select
                    value={selectedSubcategoria}
                    onValueChange={(value) => {
                      setSelectedSubcategoria(value)
                      setSelectedItem("")
                    }}
                    disabled={!selectedCategoria}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategorias.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Item</Label>
                  <Select
                    value={selectedItem}
                    onValueChange={setSelectedItem}
                    disabled={!selectedSubcategoria}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.Item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddItem}
                className="w-full mt-4 bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
                disabled={!selectedItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </CardContent>
          </Card>

          {/* Items del Elemento Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[#3D5A6E] text-lg">Items del Elemento</CardTitle>
            </CardHeader>
            <CardContent>
              {quotationItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay items agregados aún</p>
              ) : (
                <div className="space-y-3">
                  {quotationItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.products?.Item}</h3>
                        <p className="text-sm text-gray-500">
                          {item.products?.Categoria} / {item.products?.Subcategoria}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Cantidad</p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                              className="h-7 w-7 bg-transparent"
                            >
                              <span className="text-lg font-bold">-</span>
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={item.cantidad}
                              onChange={(e) => {
                                const newVal = Number.parseInt(e.target.value) || 1
                                if (newVal >= 1) handleUpdateQuantity(item.id, newVal)
                              }}
                              className="w-16 h-7 text-center text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                              className="h-7 w-7 bg-transparent"
                            >
                              <span className="text-lg font-bold">+</span>
                            </Button>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Costo Unit.</p>
                          <p className="font-medium">{formatCurrency(item.products?.Costo || 0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Subtotal</p>
                          <p className="font-bold text-[#3D5A6E]">
                            {formatCurrency((item.products?.Costo || 0) * item.cantidad)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuotationItem(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Final Summary View
  if (showFinalSummary && setShowFinalSummary) {
    const subtotal = elements.reduce((sum, el) => sum + (elementTotals[el.id] || 0), 0)
    const iva = subtotal * 0.13
    const total = subtotal + iva

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => setShowFinalSummary(false)}
              className="border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <p className="text-sm text-gray-500">Resumen de Cotización</p>
              <h1 className="text-3xl font-bold text-[#3D5A6E]">{project.nombre}</h1>
            </div>
          </div>

          {/* Client Info */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#3D5A6E] text-lg">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-medium">{project.cliente_nombre || "Sin asignar"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Descripción</p>
                  <p className="font-medium">{project.descripcion || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Margen</p>
                  <p className="font-medium">{project.margen}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <p className="font-medium">{project.estatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elements Summary */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#3D5A6E] text-lg">Elementos de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              {elements.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay elementos en esta cotización</p>
              ) : (
                <div className="space-y-3">
                  {elements.map((el) => (
                    <div key={el.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{el.nombre}</h3>
                        <p className="text-sm text-gray-500">{el.tipo}</p>
                      </div>
                      <p className="font-bold text-[#3D5A6E] text-lg">
                        {formatCurrency(elementTotals[el.id] || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#3D5A6E] text-lg">Resumen de Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">IVA (13%)</span>
                  <span className="font-medium">{formatCurrency(iva)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-[#3D5A6E]">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowFinalSummary(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExportPDF}
              className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If an element is selected, show its detail view
  if (selectedElement) {
    return (
      <ElementDetailView
        element={selectedElement}
        project={project}
        onBack={() => setSelectedElement(null)}
        calculateElementTotals={calculateElementTotals}
        elements={elements}
      />
    )
  }

  // Project Elements View
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <button onClick={onBack} className="hover:text-[#3D5A6E]">
            Proyectos
          </button>
          <span>{">"}</span>
          <span className="text-[#3D5A6E]">{project.nombre}</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D5A6E]">{project.nombre}</h1>
            <p className="text-gray-600">Gestiona los elementos de este proyecto</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsNewElementOpen(true)} className="bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Elemento
            </Button>
            <Button
              onClick={() => setShowFinalSummary && setShowFinalSummary(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Finalizar Cotización
            </Button>
          </div>
        </div>

        {/* Elements Grid */}
        {elements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay elementos en este proyecto. Crea uno nuevo para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elements.map((element) => (
              <Card
                key={element.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedElement(element)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span>{getTipoIcon(element.tipo)}</span>
                      <h3 className="font-semibold">{element.nombre}</h3>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditElement(element)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-4 w-4 text-[#3D5A6E]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteElement(element.id)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {element.imagen_url && (
                    <img
                      src={element.imagen_url || "/placeholder.svg"}
                      alt={element.nombre}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}
                  <p className="text-[#3D5A6E] font-semibold">
                    Total Venta: {formatCurrency(elementTotals[element.id] || 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Haz clic para agregar productos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Element Dialog */}
      <Dialog open={isNewElementOpen} onOpenChange={setIsNewElementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#3D5A6E]">Nuevo Elemento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newElementName}
                onChange={(e) => setNewElementName(e.target.value)}
                placeholder="Ej: Cocina Principal"
              />
            </div>
            <div>
              <Label>
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={newElementTipo} onValueChange={setNewElementTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cocina">🍳 Cocina</SelectItem>
                  <SelectItem value="Baño">🚿 Baño</SelectItem>
                  <SelectItem value="Closet">👔 Closet</SelectItem>
                  <SelectItem value="Oficina">💼 Oficina</SelectItem>
                  <SelectItem value="Mueble">🪑 Mueble</SelectItem>
                  <SelectItem value="Otro">📦 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Imagen (opcional)</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <Button
              onClick={handleCreateElement}
              className="w-full bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
              disabled={!newElementName.trim() || !newElementTipo}
            >
              Crear Elemento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Element Dialog */}
      <Dialog open={isEditElementOpen} onOpenChange={setIsEditElementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#3D5A6E]">Editar Elemento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input value={editElementName} onChange={(e) => setEditElementName(e.target.value)} />
            </div>
            <div>
              <Label>
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={editElementTipo} onValueChange={setEditElementTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cocina">🍳 Cocina</SelectItem>
                  <SelectItem value="Baño">🚿 Baño</SelectItem>
                  <SelectItem value="Closet">👔 Closet</SelectItem>
                  <SelectItem value="Oficina">💼 Oficina</SelectItem>
                  <SelectItem value="Mueble">🪑 Mueble</SelectItem>
                  <SelectItem value="Otro">📦 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Imagen</Label>
              <Input type="file" accept="image/*" onChange={handleEditImageChange} />
              {editImagePreview && (
                <img
                  src={editImagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <Button
              onClick={handleUpdateElement}
              className="w-full bg-[#3D5A6E] hover:bg-[#2D4A5E] text-white"
              disabled={!editElementName.trim() || !editElementTipo}
            >
              Actualizar Elemento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
