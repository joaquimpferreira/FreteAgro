"use client"

import * as React from "react"
import {
  BarChart3Icon,
  DollarSignIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  TruckIcon,
  UserCircleIcon,
  WalletIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboardIcon,
    isActive: true,
  },
  {
    title: "Frota",
    url: "/frota",
    icon: TruckIcon,
  },
  {
    title: "Fretes",
    url: "/fretes",
    icon: PackageIcon,
  },
  {
    title: "Acertos",
    url: "/acertos",
    icon: DollarSignIcon,
  },
  {
    title: "Caixa",
    url: "/caixa",
    icon: WalletIcon,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3Icon,
  },
]

const navSecondary = [
  {
    title: "Perfil",
    url: "/perfil",
    icon: UserCircleIcon,
  },
  {
    title: "Configurações",
    url: "/perfil",
    icon: SettingsIcon,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userName?: string
  userEmail?: string
}

export function AppSidebar({ userName, userEmail, ...props }: AppSidebarProps) {
  const user = {
    name: userName ?? "Proprietário",
    email: userEmail ?? "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <TruckIcon className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">FreteAgro</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
