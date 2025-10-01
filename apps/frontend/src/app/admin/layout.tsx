"use client";
import React from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  Settings,
  BarChart3,
  FileText,
  BookOpen,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function StaffSidebarContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const menuItems = [
    {
      group: "Platform",
      items: [
        { href: "/", icon: Home, label: "Home" },
        { href: "/staff", icon: Users, label: "Staff" },
        { href: "/staff/analytics", icon: BarChart3, label: "Analytics" },
      ],
    },
    {
      group: "Resources",
      items: [
        { href: "/docs", icon: BookOpen, label: "Documentation" },
        { href: "/reports", icon: FileText, label: "Reports" },
      ],
    },
    {
      group: "Settings",
      items: [{ href: "/settings", icon: Settings, label: "Account Settings" }],
    },
  ];

  type MenuItemProps = {
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
  };

  const MenuItem = ({
    href,
    icon: Icon,
    label,
  }: MenuItemProps) => {
    const content = (
      <a
        href={href}
        className={`flex items-center ${
          isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
        } text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all duration-200 group`}
      >
        <Icon
          className={`h-5 w-5 group-hover:scale-110 transition-transform duration-200 ${
            isCollapsed ? "" : "mr-3"
          }`}
        />
        {!isCollapsed && <span className="font-medium">{label}</span>}
      </a>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild className="w-full">
              {content}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-slate-800 text-white border-slate-700"
          >
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <SidebarMenuButton asChild className="w-full">
        {content}
      </SidebarMenuButton>
    );
  };

  return (
    <>
      <SidebarHeader>
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center px-2 py-4" : "gap-3 px-6 py-4"
          } border-b border-slate-700/50`}
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="font-bold text-white text-lg">MB</span>
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-lg font-bold text-white">MeBike</p>
              <p className="text-xs text-slate-300">Staff Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className={`${isCollapsed ? "px-2 py-6" : "px-4 py-6"}`}>
        {menuItems.map((section) => (
          <SidebarGroup key={section.group} className="mb-8">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
                {section.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <MenuItem {...item} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <div
        className={`mt-auto border-t border-slate-700/50 ${
          isCollapsed ? "p-2" : "p-4"
        }`}
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          } p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors duration-200 cursor-pointer group`}
        >
          <div className="relative">
            <Image
              src="https://github.com/shadcn.png"
              alt="avatar"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border-2 border-slate-600 group-hover:border-blue-400 transition-colors duration-200"
            />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Staff Admin
                </p>
                <p className="text-xs text-slate-400 truncate">
                  admin@mebike.com
                </p>
              </div>
              <Settings className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors duration-200" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Sidebar
            collapsible="icon"
            className="border-r-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl"
          >
            <StaffSidebarContent />
          </Sidebar>
          <main className="flex-1 p-8 bg-white/80 backdrop-blur-sm">
         
            <div className=" p-6">{children}</div>
          </main>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );

}
