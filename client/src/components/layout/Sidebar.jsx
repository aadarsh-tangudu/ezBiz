import React from "react"
import { Box, VStack, HStack, Text, Heading, Button, Badge, IconButton, Flex } from "@chakra-ui/react"
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  Cpu,
  Users,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Menu,
  Warehouse,
  LogOut,
  X,
} from "lucide-react"
import { Tooltip } from "../ui/tooltip"
import { toaster } from "../ui/toaster"
import { useStore } from "../../store/useStore"

export default function Sidebar({
  currentView,
  setView,
  alertsCount,
  isCollapsed,
  setIsCollapsed,
  isMobileView,
  onClose,
}) {
  const { user, logout } = useStore()

  const handleLogout = () => {
    logout()
    toaster.create({
      title: "Logged Out",
      description: "Successfully signed out of EzBiz.",
      type: "success",
    })
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales", icon: TrendingUp },
    { id: "purchases", label: "Purchases", icon: ShoppingCart },
    { id: "inventory", label: "Inventory", icon: Package, badge: alertsCount?.lowStock > 0 ? alertsCount.lowStock : null },
    { id: "production", label: "Production", icon: Cpu },
    { id: "workers", label: "Workers", icon: Users, badge: alertsCount?.unpaidWorkers > 0 ? "Alert" : null },
    { id: "expenses", label: "Expenses", icon: CreditCard },
  ]

  return (
    <Box
      w={isMobileView ? "full" : { base: "full", md: isCollapsed ? "20" : "64" }}
      display={isMobileView ? "flex" : { base: "none", md: "flex" }}
      transition="width 0.2s ease"
      bg="bg.muted"
      borderRightWidth="1px"
      borderColor="border.subtle"
      h="100vh"
      position={isMobileView ? "relative" : { base: "relative", md: "fixed" }}
      left="0"
      top="0"
      flexDirection="column"
      p="5"
      zIndex="10"
    >
      {/* Brand Header */}
      {isCollapsed ? (
        <Flex justify="center" align="center" mb="8" width="full">
          <IconButton
            aria-label="Expand Sidebar"
            variant="ghost"
            size="sm"
            display={{ base: "none", md: "inline-flex" }}
            onClick={() => setIsCollapsed(false)}
          >
            <Menu size={18} />
          </IconButton>
        </Flex>
      ) : (
        <HStack justify="space-between" align="center" mb="8" width="full">
          <HStack gap="3" align="center">
            <Box bg="purple.600" color="white" p="2" rounded="lg" shadow="md" flexShrink={0}>
              <Warehouse size={22} />
            </Box>
            <VStack align="flex-start" gap="0" overflow="hidden">
              <Heading size="md" fontWeight="black" letterSpacing="tight" truncate>
                EzBiz
              </Heading>
              <Text fontSize="2xs" color="fg.muted" fontWeight="semibold" truncate>
                PRODUCTION SYSTEM
              </Text>
            </VStack>
          </HStack>

          {isMobileView ? (
            <IconButton
              aria-label="Close Sidebar"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X size={16} />
            </IconButton>
          ) : (
            <IconButton
              aria-label="Collapse Sidebar"
              variant="ghost"
              size="xs"
              display={{ base: "none", md: "inline-flex" }}
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft size={14} />
            </IconButton>
          )}
        </HStack>
      )}

      {/* Scrollable Container for workspace and navigation */}
      <VStack
        align="stretch"
        flex="1"
        overflowY="auto"
        gap="0"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        mb="4"
      >
        {/* Active Workspace Selector (SaaS feel) */}
        {!isCollapsed ? (
          <Box
            bg="bg.default"
            p="3"
            rounded="xl"
            borderWidth="1px"
            borderColor="border.default"
            mb="6"
            flexShrink={0}
          >
            <Text fontSize="2xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">
              Active Factory
            </Text>
            <HStack justify="space-between" mt="1">
              <Text fontSize="xs" fontWeight="bold" truncate>
                Main Processing Unit
              </Text>
              <ChevronRight size={14} color="gray" />
            </HStack>
          </Box>
        ) : (
          <Box
            alignSelf="center"
            mb="6"
            color="fg.muted"
            p="2"
            bg="bg.default"
            rounded="lg"
            borderWidth="1px"
            borderColor="border.default"
            flexShrink={0}
          >
            <Warehouse size={16} />
          </Box>
        )}

        {/* Navigation Items */}
        <VStack align="stretch" gap="1.5" width="full">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            const btn = (
              <Button
                key={item.id}
                onClick={() => setView(item.id)}
                variant={isActive ? "solid" : "ghost"}
                colorPalette={isActive ? "purple" : "gray"}
                justifyContent={isCollapsed ? "center" : "flex-start"}
                w="full"
                gap={isCollapsed ? "0" : "3"}
                size="md"
                rounded="lg"
                fontWeight={isActive ? "bold" : "medium"}
                position="relative"
                px={isCollapsed ? "0" : "3"}
              >
                <Icon size={18} />
                {!isCollapsed && (
                  <Text fontSize="sm" flex="1" textAlign="left">
                    {item.label}
                  </Text>
                )}
                {!isCollapsed && item.badge && (
                  <Badge
                    colorPalette={item.badge === "Alert" ? "orange" : "red"}
                    variant="solid"
                    size="sm"
                    rounded="full"
                  >
                    {item.badge}
                  </Badge>
                )}
                {isCollapsed && item.badge && (
                  <Box
                    position="absolute"
                    top="1.5"
                    right="1.5"
                    w="2"
                    h="2"
                    bg={item.badge === "Alert" ? "orange.500" : "red.500"}
                    rounded="full"
                  />
                )}
              </Button>
            )

            return isCollapsed ? (
              <Tooltip key={item.id} content={item.label} placement="right">
                {btn}
              </Tooltip>
            ) : (
              btn
            )
          })}
        </VStack>
      </VStack>


      {/* Footer Profile Segment */}
      <Box
        pt="4"
        borderTopWidth="1px"
        borderColor="border.subtle"
        mt="auto"
      >
        {isCollapsed ? (
          <VStack gap="3" align="center" width="full">
            <Box
              w="9"
              h="9"
              bg="purple.subtle"
              color="purple.fg"
              rounded="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              fontSize="sm"
              flexShrink={0}
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
            </Box>
            <Tooltip content="Logout" placement="right">
              <IconButton
                aria-label="Logout"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                colorPalette="red"
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </VStack>
        ) : (
          <HStack justify="space-between" align="center" width="full" gap="2">
            <HStack gap="3" overflow="hidden" flex="1">
              <Box
                w="9"
                h="9"
                bg="purple.subtle"
                color="purple.fg"
                rounded="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                fontSize="sm"
                flexShrink={0}
              >
                {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
              </Box>
              <VStack align="flex-start" gap="0" overflow="hidden" flex="1">
                <Text fontSize="xs" fontWeight="bold" truncate>
                  {user?.username || "Aadarsh"} (Operator)
                </Text>
                <Text fontSize="2xs" color="fg.muted" truncate>
                  {(user?.username || "aadarsh").toLowerCase()}@ezbiz.com
                </Text>
              </VStack>
            </HStack>
            <IconButton
              aria-label="Logout"
              variant="ghost"
              size="xs"
              onClick={handleLogout}
              colorPalette="red"
            >
              <LogOut size={14} />
            </IconButton>
          </HStack>
        )}
      </Box>
    </Box>
  )
}
