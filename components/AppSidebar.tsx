"use client"

import {
  LayoutDashboard,
  FolderOpen,
  Users,
  UserPlus,
  Package,
  ListTodo,
  Calendar,
  Settings,
} from "lucide-react"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

type ActiveView = "dashboard" | "proyectos" | "clientes" | "leads" | "productos" | "tareas" | "calendario" | "configuracion"

interface AppSidebarProps {
  activeView: ActiveView
  onNavigate: (view: ActiveView) => void
}

export function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
  const principalItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "proyectos" as const, label: "Proyectos", icon: FolderOpen },
    { id: "clientes" as const, label: "Clientes", icon: Users },
    { id: "leads" as const, label: "Leads", icon: UserPlus },
    { id: "productos" as const, label: "Productos", icon: Package },
  ]

  const herramientasItems = [
    { id: "tareas" as const, label: "Tareas", icon: ListTodo },
    { id: "calendario" as const, label: "Calendario", icon: Calendar },
  ]

  const adminItems = [
    { id: "configuracion" as const, label: "Configuración", icon: Settings },
  ]

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-100">
        <Image
          src="/mate-millworkers-logo.jpeg"
          alt="MateMillWorkers"
          width={180}
          height={60}
          className="h-12 w-auto"
        />
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {principalItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full justify-start gap-3 px-3 py-2 rounded-lg transition-colors
                      ${activeView === item.id 
                        ? "bg-[#5BA4B4] text-white hover:bg-[#4a8a98] hover:text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Herramientas */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            Herramientas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {herramientasItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full justify-start gap-3 px-3 py-2 rounded-lg transition-colors
                      ${activeView === item.id 
                        ? "bg-[#5BA4B4] text-white hover:bg-[#4a8a98] hover:text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full justify-start gap-3 px-3 py-2 rounded-lg transition-colors
                      ${activeView === item.id 
                        ? "bg-[#5BA4B4] text-white hover:bg-[#4a8a98] hover:text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Mate MillWorkers © 2025
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
