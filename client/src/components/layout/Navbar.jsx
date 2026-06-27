import React from "react"
import { Box, Flex, Heading, HStack, Button, Text, IconButton } from "@chakra-ui/react"
import { Bell, Menu } from "lucide-react"
import { ColorModeButton } from "../ui/color-mode"

export default function Navbar({ currentView, onQuickAddClick, alertsCount, onMenuClick }) {
  const getHeaderTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Dashboard Control Panel"
      case "sales":
        return "Sales & Invoicing Ledger"
      case "purchases":
        return "Purchases & Procurement"
      case "inventory":
        return "Real-time Stock Inventory"
      case "production":
        return "Daily Production & Processing"
      case "workers":
        return "Workers & Payroll Management"
      case "expenses":
        return "Operating Expenses Log"
      default:
        return "Business Management"
    }
  }

  const totalAlerts = (alertsCount?.lowStock || 0) + (alertsCount?.unpaidWorkers ? 1 : 0)

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      bg="bg.default/85"
      backdropFilter="blur(8px)"
      borderBottomWidth="1px"
      borderColor="border.subtle"
      py={{ base: "2.5", md: "4" }}
      px={{ base: "4", md: "6" }}
      zIndex="9"
      transition="background-color 0.2s"
    >
      <Flex align="center" justify="space-between" gap="2">
        {/* Left Header Info */}
        <HStack gap={{ base: "2", md: "3" }} overflow="hidden" flex="1">
          <IconButton
            aria-label="Open Navigation"
            variant="ghost"
            display={{ base: "inline-flex", md: "none" }}
            onClick={onMenuClick}
            size="sm"
            flexShrink={0}
          >
            <Menu size={20} />
          </IconButton>
          <Box minW="0">
            <Heading size={{ base: "xs", sm: "sm", md: "md" }} fontWeight="bold" truncate>
              {getHeaderTitle()}
            </Heading>
            <Text
              fontSize="2xs"
              color="fg.muted"
              display={{ base: "none", sm: "block" }}
              truncate
            >
              EzBiz Live Operations Ledger
            </Text>
          </Box>
        </HStack>

        {/* Right Action Items */}
        <HStack gap={{ base: "1.5", md: "3" }} flexShrink={0}>
          {/* Theme Toggler */}
          <ColorModeButton />

          {/* Notifications / Alerts Indicator */}
          <Button variant="ghost" size="sm" rounded="full" position="relative" px="2">
            <Bell size={18} />
            {totalAlerts > 0 && (
              <Box
                position="absolute"
                top="1"
                right="1.5"
                bg="red.500"
                w="2.5"
                h="2.5"
                rounded="full"
                borderWidth="2px"
                borderColor="bg.default"
              />
            )}
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}
