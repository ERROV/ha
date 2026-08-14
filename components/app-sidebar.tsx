"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  FaHome,
  FaUserTie,
  FaUsers,
  FaClock,
  FaUserPlus,
  FaUtensils,
  FaCoffee,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaRobot
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
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
  SidebarRail,
} from "@/components/ui/sidebar";

// Sample navigation data with icons
const data = {
  versions: ["1.0.1"],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: <FaHome className="text-primary" />,
      items: [{
        title: "Home",
        url: "/protected/home",
        icon: <FaHome className="text-muted-foreground" />
      }],
    },
    {
      title: "Employee Dashboard",
      url: "/employee",
      icon: <FaUserTie className="text-primary" />,
      items: [
        {
          title: "Lunch Time",
          url: "employee",
          icon: <FaUtensils className="text-muted-foreground" />
        },
        {
          title: "Request Break",
          url: "break",
          icon: <FaCoffee className="text-muted-foreground" />
        },
        {
          title: "PosMap",
          url: "pos",
          icon: <FaMapMarkerAlt className="text-muted-foreground" />
        },
        {
          title: "Schedule",
          url: "schedule",
          icon: <FaCalendarAlt className="text-muted-foreground" />
        },
      ],
    },
    {
      title: "Admin Dashboard",
      url: "/dashboard",
      role: "admin",
      icon: <FaUsers className="text-primary" />,
      items: [
        {
          title: "Dashboard",
          url: "dashboard",
          icon: <FaHome className="text-muted-foreground" />
        },
        {
          title: "Users",
          url: "users",
          icon: <FaUsers className="text-muted-foreground" />
        },

        {
          title: "Register Employee",
          url: "register",
          icon: <FaUserPlus className="text-muted-foreground" />
        },
        {
          title: "Bot Control",
          url: "bot-control",
          icon: <FaRobot className="text-muted-foreground" />,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const filteredNav = data.navMain.filter((group) => {
    if (!group.role) return true;
    return session?.user?.role === group.role;
  });

  return (
    <Sidebar {...props} className="bg-card text-card-foreground border-r border-border transition-colors duration-300">
      <SidebarHeader className="border-b border-border bg-muted/20 shadow-sm">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4"
        >
          <VersionSwitcher
            versions={data.versions}
            defaultVersion={data.versions[0]}

          />
          <div className="mt-4">

          </div>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-6 bg-card">
        <AnimatePresence>
          {filteredNav.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SidebarGroup className="bg-muted/30 rounded-lg p-4 shadow-sm border border-border">
                <SidebarGroupLabel className="flex items-center gap-2 text-foreground font-medium">
                  {item.icon}
                  {item.title}
                </SidebarGroupLabel>
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu className="space-y-2">
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          asChild
                          className="hover:bg-accent hover:text-accent-foreground transition-colors rounded-md"
                        >
                          <a
                            href={subItem.url}
                            className="flex items-center gap-3 px-3 py-2"
                          >
                            <span className="text-muted-foreground group-hover:text-primary transition-colors">
                              {subItem.icon}
                            </span>
                            <span className="text-foreground">{subItem.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </motion.div>
          ))}
        </AnimatePresence>
      </SidebarContent>


    </Sidebar>
  );
}