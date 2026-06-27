import React, { useState, useMemo, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Badge,
  Card,
  Flex,
  Button,
  IconButton,
  Checkbox,
  Table,
  Tabs,
  Skeleton,
} from "@chakra-ui/react"
import {
  TrendingUp,
  ShoppingCart,
  Scale,
  Cpu,
  Users,
  CreditCard,
  ArrowUpRight,
  Settings,
  Calendar,
  Activity,
} from "lucide-react"
import { Select } from "../components/ui/select"
import { Toaster, toaster } from "../components/ui/toaster"
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "../components/ui/dialog"

import { useStore } from "../store/useStore"

export default function Dashboard({
  setView,
}) {
  const { sales, purchases, inventory, productionRuns, workers, expenses, isLoading, simulateLoading } = useStore()

  useEffect(() => {
    simulateLoading()
  }, [simulateLoading])
  const [timeWindow, setTimeWindow] = useState("all")
  const [kpiSelectorOpen, setKpiSelectorOpen] = useState(false)
  const [duesTab, setDuesTab] = useState("incoming")

  // Default KPI selection: all 6 metrics
  const allKpis = [
    { id: "revenue", label: "Revenue", icon: TrendingUp, color: "green.500", bg: "green.subtle" },
    { id: "orders", label: "Sales Orders", icon: ShoppingCart, color: "blue.500", bg: "blue.subtle" },
    { id: "profit", label: "Net Profit", icon: ArrowUpRight, color: "purple.500", bg: "purple.subtle" },
    { id: "inventory", label: "Inventory Valuation", icon: Scale, color: "teal.500", bg: "teal.subtle" },
    { id: "production", label: "Production Output", icon: Cpu, color: "cyan.500", bg: "cyan.subtle" },
    { id: "wages", label: "Worker Wages Accrued", icon: Users, color: "orange.500", bg: "orange.subtle" },
  ]
  const [selectedKpis, setSelectedKpis] = useState(["revenue", "orders", "profit", "inventory", "production", "wages"])

  const timeOptions = [
    { label: "Today", value: "today" },
    { label: "Past 7 Days", value: "7days" },
    { label: "Past 30 Days", value: "30days" },
    { label: "Past 90 Days", value: "90days" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
  ]

  // Time Window Filtering Logic
  const getFilteredData = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const filterItems = (items, dateKey) => {
      if (timeWindow === "all") return items
      return items.filter((item) => {
        const itemDate = new Date(item[dateKey]).getTime()
        if (isNaN(itemDate)) return false

        switch (timeWindow) {
          case "today":
            return itemDate >= todayStart
          case "7days":
            return itemDate >= todayStart - 7 * 24 * 60 * 60 * 1000
          case "30days":
            return itemDate >= todayStart - 30 * 24 * 60 * 60 * 1000
          case "90days":
            return itemDate >= todayStart - 90 * 24 * 60 * 60 * 1000
          case "year":
            return new Date(item[dateKey]).getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }

    return {
      filteredSales: filterItems(sales, "date"),
      filteredPurchases: filterItems(purchases, "date"),
      filteredRuns: filterItems(productionRuns, "date"),
      filteredExpenses: filterItems(expenses, "date"),
    }
  }, [sales, purchases, productionRuns, expenses, timeWindow])

  const { filteredSales, filteredPurchases, filteredRuns, filteredExpenses } = getFilteredData

  // KPI calculations based on filtered records
  const metrics = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0)
    const orders = filteredSales.length
    const purchasesCost = filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0)
    const wages = filteredRuns.reduce((sum, r) => sum + (r.workers || []).reduce((wSum, w) => wSum + (w.wages || 0), 0), 0)
    const expenseCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const profit = revenue - purchasesCost - wages - expenseCost

    const inventoryVal = inventory.reduce((totalSum, item) => {
      let itemSum = 0
      if (item.hasGrades) {
        if (item.stocks && item.grades) {
          item.grades.forEach((grade) => {
            itemSum += (item.stocks[grade] || 0) * (item.avgCost?.[grade] || 0)
          })
        }
      } else {
        itemSum = (item.stocks?.[""] || 0) * (item.avgCost?.[""] || 0)
      }
      return totalSum + itemSum
    }, 0)

    const production = filteredRuns.reduce((sum, r) => sum + (r.outputs || []).reduce((oSum, o) => oSum + (o.actualQty || 0), 0), 0)

    return {
      revenue,
      orders,
      profit,
      inventory: inventoryVal,
      production,
      wages,
    }
  }, [filteredSales, filteredPurchases, filteredRuns, filteredExpenses, inventory])

  // Customizer helper handlers
  const toggleKpi = (id) => {
    setSelectedKpis((prev) =>
      prev.includes(id)
        ? prev.filter((k) => k !== id)
        : [...prev, id]
    )
  }

  // Previews
  const inventoryPreview = useMemo(() => inventory.slice(0, 3), [inventory])
  const workersPreview = useMemo(() => workers.slice(0, 6), [workers])
  const runsPreview = useMemo(() => productionRuns.slice(0, 2), [productionRuns])

  // Incoming Dues (Sales with Pending or Partially Paid status)
  const incomingDues = useMemo(() => {
    return sales
      .filter((s) => s.paymentStatus !== "Paid")
      .map((s) => {
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === "Paid" ? s.totalAmount : 0)
        return {
          id: s.id,
          name: s.customerName,
          date: s.date.split("T")[0],
          amount: Math.max(0, s.totalAmount - paid),
          type: "Sale",
        }
      })
      .filter((s) => s.amount > 0)
  }, [sales])

  // Outgoing Dues (Purchases with Pending/Partially Paid + unpaid worker wages)
  const outgoingDues = useMemo(() => {
    const purchasePayables = purchases
      .filter((p) => p.paymentStatus !== "Paid")
      .map((p) => {
        const paid = p.paidAmount !== undefined ? p.paidAmount : (p.paymentStatus === "Paid" ? p.totalCost : 0)
        return {
          id: p.id,
          name: p.supplierName,
          date: p.date.split("T")[0],
          amount: Math.max(0, p.totalCost - paid),
          type: "Purchase",
        }
      })
      .filter((p) => p.amount > 0)

    const workerPayables = workers
      .filter((w) => w.paymentStatus !== "Paid")
      .map((w) => {
        const totalEarned = w.type === "Salary"
          ? w.rate
          : productionRuns.reduce((sum, r) => {
              const rw = (r.workers || []).find((rw) => rw.workerId === w.id)
              return sum + (rw ? (rw.wages || 0) : 0)
            }, 0)
        const amount = Math.max(0, totalEarned - (w.paidAmount || 0))
        return {
          id: w.id,
          name: w.name,
          date: "-",
          amount: amount,
          type: `${w.type} Wage`,
        }
      })
      .filter((w) => w.amount > 0)

    return [...purchasePayables, ...workerPayables]
  }, [purchases, workers, productionRuns])

  const totalIncoming = useMemo(() => {
    return incomingDues.reduce((sum, item) => sum + item.amount, 0)
  }, [incomingDues])

  const totalOutgoing = useMemo(() => {
    return outgoingDues.reduce((sum, item) => sum + item.amount, 0)
  }, [outgoingDues])

  // Recent Activities (Sales and Production Runs Combined)
  const activities = useMemo(() => {
    const recentSales = sales.slice(0, 3).map((sale) => ({
      id: `sale-${sale.id}`,
      description: `Sale recorded to ${sale.customerName}`,
      detail: `${sale.items?.length || 0} items • ₹${sale.totalAmount.toLocaleString()}`,
      time: sale.date.split("T")[0],
      icon: "📦",
      color: "blue",
    }))

    const recentRuns = productionRuns.slice(0, 2).map((run) => {
      const inputQty = (run.inputs || []).reduce((sum, inp) => sum + (inp.actualQty || 0), 0)
      const outputQty = (run.outputs || []).reduce((sum, out) => sum + (out.actualQty || 0), 0)
      return {
        id: `run-${run.id}`,
        description: `Production Run: ${run.templateName}`,
        detail: `Input: ${inputQty} kg • Output: ${outputQty} kg`,
        time: run.date,
        icon: "⚙️",
        color: "purple",
      }
    })

    return [...recentSales, ...recentRuns]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
  }, [sales, productionRuns])

  const showToast = (message) => {
    toaster.create({
      title: "Navigation Log",
      description: message,
      type: "info",
    })
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap="8">
        {/* Header skeleton */}
        <Box bg="bg.muted" borderBottomWidth="1px" borderColor="border.subtle" py="4" px="6" rounded="2xl">
          <Skeleton h="16" w="full" rounded="xl" />
        </Box>

        {/* KPI Grid skeletons */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          <Skeleton h="24" rounded="2xl" />
          <Skeleton h="24" rounded="2xl" />
          <Skeleton h="24" rounded="2xl" />
          <Skeleton h="24" rounded="2xl" />
          <Skeleton h="24" rounded="2xl" />
          <Skeleton h="24" rounded="2xl" />
        </SimpleGrid>

        {/* Charts & Tables skeletons */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
          <Skeleton h="80" rounded="2xl" />
          <Skeleton h="80" rounded="2xl" />
        </SimpleGrid>
      </VStack>
    )
  }

  return (
    <VStack align="stretch" gap="8">
      {/* HEADER WITH TIME WINDOW SELECTOR */}
      <Box bg="bg.muted" borderBottomWidth="1px" borderColor="border.subtle" py="4" px="6" rounded="2xl">
        <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ sm: "center" }} gap="4">
          <Box>
            <Heading size="lg" fontWeight="bold">
              Dashboard Metrics
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Live enterprise overview and operation logs
            </Text>
          </Box>
          <Box w={{ base: "full", sm: "64" }}>
            <Select
              items={timeOptions}
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
            />
          </Box>
        </Flex>
      </Box>

      {/* KPI SECTION */}
      <VStack align="stretch" gap="4">
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="sm">Key Performance Indicators</Heading>
            <Text fontSize="2xs" color="fg.muted">
              {selectedKpis.length} of 6 metrics selected
            </Text>
          </Box>
          {/* Customizer trigger */}
          <DialogRoot open={kpiSelectorOpen} onOpenChange={(e) => setKpiSelectorOpen(e.open)}>
            <DialogTrigger asChild>
              <IconButton aria-label="Customize KPIs" variant="outline" size="sm">
                <Settings size={16} />
              </IconButton>
            </DialogTrigger>
            <DialogContent
              w={{
                base: "100vw",
                sm: "95vw",
                md: "92vw",
                lg: "88vw",
                xl: "80vw",
                "2xl": "1500px",
              }}
              maxW="1500px"
              h={{
                base: "100vh",
                md: "90vh",
              }}
              borderRadius={{
                base: 0,
                md: "xl",
              }}
              bg="bg.panel"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                }}
              >
                <DialogHeader>
                  <DialogTitle>Customize KPIs</DialogTitle>
                </DialogHeader>
                <DialogBody
                  overflowY="auto"
                  px={{ base: 4, md: 6, lg: 8 }}
                  py={6}
                >
                  <VStack align="stretch" gap="3">
                    {allKpis.map((kpi) => (
                      <HStack key={kpi.id} justify="space-between" p="2" rounded="md" hover={{ bg: "bg.muted" }}>
                        <HStack gap="2">
                          <kpi.icon size={16} />
                          <Text fontSize="sm">{kpi.label}</Text>
                        </HStack>
                        <Checkbox.Root
                          checked={selectedKpis.includes(kpi.id)}
                          onCheckedChange={() => toggleKpi(kpi.id)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Root>
                      </HStack>
                    ))}
                  </VStack>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setKpiSelectorOpen(false)}>Close</Button>
                  <Button colorPalette="purple" onClick={() => setSelectedKpis(["revenue", "orders", "profit", "inventory", "production", "wages"])}>Reset Defaults</Button>
                </DialogFooter>
                <DialogCloseTrigger />
              </div>
            </DialogContent>
          </DialogRoot>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="6">
          {allKpis
            .filter((kpi) => selectedKpis.includes(kpi.id))
            .map((kpi) => {
              const IconComp = kpi.icon
              const rawVal = metrics[kpi.id]
              const formattedVal =
                kpi.id === "orders"
                  ? rawVal
                  : kpi.id === "production"
                  ? `${rawVal.toLocaleString()} kg`
                  : `₹${rawVal.toLocaleString()}`

              return (
                <Card.Root key={kpi.id} variant="elevated">
                  <Card.Body gap="2">
                    <Flex align="center" justify="space-between">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">
                        {kpi.label.toUpperCase()}
                      </Text>
                      <Box color={kpi.color} p="2" bg={kpi.bg} rounded="full">
                        <IconComp size={16} />
                      </Box>
                    </Flex>
                    <Heading size="xl" fontWeight="black">
                      {formattedVal}
                    </Heading>
                    <Text fontSize="2xs" color="fg.muted">
                      Filtered by time window
                    </Text>
                  </Card.Body>
                </Card.Root>
              )
            })}
        </SimpleGrid>
      </VStack>

      {/* GRID: SALES TREND & FINANCIAL DUES */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        {/* SALES TREND CHART */}
        <Card.Root h="full">
          <Card.Header>
            <Heading size="sm">Sales Trend</Heading>
            <Text fontSize="2xs" color="fg.muted">Revenue over time (interactive)</Text>
          </Card.Header>
          <Card.Body display="flex" flexDirection="column" justifyContent="center">
            <Flex justify="center" align="center" h="48" position="relative" borderLeftWidth="2px" borderBottomWidth="2px" borderColor="border.muted">
              {/* Responsive SVG Chart */}
              <svg width="100%" height="100%" viewBox="0 0 300 150">
                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--chakra-colors-border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="var(--chakra-colors-border-subtle)" strokeDasharray="3 3" />

                {/* Area under line */}
                <path
                  d="M0 150 L30 110 L80 120 L130 70 L180 100 L230 40 L280 60 L300 30 L300 150 Z"
                  fill="var(--chakra-colors-purple-subtle)"
                  opacity="0.2"
                />
                {/* Trend line */}
                <path
                  d="M0 150 Q 30 110, 80 120 T 130 70 T 180 100 T 230 40 T 280 60 T 300 30"
                  fill="none"
                  stroke="var(--chakra-colors-purple-500)"
                  strokeWidth="3"
                />
              </svg>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* FINANCIAL DUES (TABBED PANEL) */}
        <Card.Root h="full" display="flex" flexDirection="column">
          <Card.Header pb="2">
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="sm">Outstanding Financial Dues</Heading>
                <Text fontSize="2xs" color="fg.muted">Unsettled accounts receivable & payable</Text>
              </Box>
            </Flex>
          </Card.Header>
          <Card.Body pt="0" flex="1" display="flex" flexDirection="column">
            <Tabs.Root value={duesTab} onValueChange={(e) => setDuesTab(e.value)} height="100%" display="flex" flexDirection="column" flex="1">
              <Tabs.List borderBottomWidth="1px" borderColor="border.subtle" mb="3">
                <Tabs.Trigger value="incoming" gap="2">
                  Incoming Receivables
                  <Badge colorPalette={totalIncoming > 0 ? "orange" : "green"} size="xs" variant="solid" rounded="full">
                    ₹{totalIncoming.toLocaleString()}
                  </Badge>
                </Tabs.Trigger>
                <Tabs.Trigger value="outgoing" gap="2">
                  Outgoing Payables
                  <Badge colorPalette={totalOutgoing > 0 ? "red" : "green"} size="xs" variant="solid" rounded="full">
                    ₹{totalOutgoing.toLocaleString()}
                  </Badge>
                </Tabs.Trigger>
              </Tabs.List>

              <Box
                flex="1"
                overflowY="auto"
                overflowX="auto"
                maxH="52"
                css={{
                  "&::-webkit-scrollbar": {
                    width: "6px",
                    height: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(128, 90, 213, 0.2)",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "rgba(128, 90, 213, 0.4)",
                  },
                }}
              >
                <Tabs.Content value="incoming" pt="0">
                  {incomingDues.length === 0 ? (
                    <Text fontSize="xs" color="fg.muted" textAlign="center" py="8">
                      No pending incoming dues. All clear!
                    </Text>
                  ) : (
                    <Table.Root size="sm" variant="line">
                      <Table.Header bg="bg.muted">
                        <Table.Row>
                          <Table.ColumnHeader>Customer</Table.ColumnHeader>
                          <Table.ColumnHeader>Date</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Due Amount</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {incomingDues.map((item) => (
                          <Table.Row key={item.id}>
                            <Table.Cell fontSize="xs" fontWeight="semibold">{item.name}</Table.Cell>
                            <Table.Cell fontSize="2xs" color="fg.muted">{item.date}</Table.Cell>
                            <Table.Cell fontSize="xs" fontWeight="bold" textAlign="right" color="orange.fg">
                              ₹{item.amount.toLocaleString()}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </Tabs.Content>

                <Tabs.Content value="outgoing" pt="0">
                  {outgoingDues.length === 0 ? (
                    <Text fontSize="xs" color="fg.muted" textAlign="center" py="8">
                      No pending outgoing dues. All clear!
                    </Text>
                  ) : (
                    <Table.Root size="sm" variant="line">
                      <Table.Header bg="bg.muted">
                        <Table.Row>
                          <Table.ColumnHeader>Payee</Table.ColumnHeader>
                          <Table.ColumnHeader>Category</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Due Amount</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {outgoingDues.map((item, idx) => (
                          <Table.Row key={idx}>
                            <Table.Cell fontSize="xs" fontWeight="semibold">{item.name}</Table.Cell>
                            <Table.Cell fontSize="2xs" color="fg.muted">{item.type}</Table.Cell>
                            <Table.Cell fontSize="xs" fontWeight="bold" textAlign="right" color="red.fg">
                              ₹{item.amount.toLocaleString()}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* INVENTORY & PAYROLL STATUS GRID */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
        {/* INVENTORY STATUS */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center" width="full">
              <Box>
                <Heading size="sm">Inventory Status</Heading>
                <Text fontSize="2xs" color="fg.muted">Item stock previews</Text>
              </Box>
              <Button size="xs" variant="outline" onClick={() => setView("inventory")}>
                View All
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body pt="0">
            <VStack align="stretch" gap="2">
              {inventoryPreview.length === 0 ? (
                <Text fontSize="xs" color="fg.muted" textAlign="center" py="4">
                  No stock items registered.
                </Text>
              ) : (
                inventoryPreview.map((inv) => {
                  const totalStock = inv.hasGrades
                    ? (inv.grades || []).reduce((sum, g) => sum + (inv.stocks?.[g] || 0), 0)
                    : (inv.stockQuantity || 0)
                  const isLow = totalStock <= inv.lowStockAlert

                  return (
                    <Flex key={inv.id} align="center" justify="space-between" p="2" rounded="lg" hover={{ bg: "bg.muted" }}>
                      <Box>
                        <Text fontSize="xs" fontWeight="semibold">{inv.name}</Text>
                        <Text fontSize="2xs" color="fg.muted">
                          {totalStock} {inv.unit} left {isLow && <Text as="span" color="orange.fg">⚠️ Low</Text>}
                        </Text>
                      </Box>
                      <Badge colorPalette={isLow ? "orange" : "green"} variant="solid" size="sm">
                        {isLow ? "Reorder" : "OK"}
                      </Badge>
                    </Flex>
                  )
                })
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* WORKER PAYROLL STATUS */}
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Payroll Status</Heading>
            <Text fontSize="2xs" color="fg.muted">Recent worker status</Text>
          </Card.Header>
          <Card.Body pt="0">
            <VStack align="stretch" gap="2">
              {workersPreview.length === 0 ? (
                <Text fontSize="xs" color="fg.muted" textAlign="center" py="4">
                  No workers registered.
                </Text>
              ) : (
                workersPreview.map((w) => {
                  const isPaid = w.paymentStatus === "Paid"

                  return (
                    <Flex key={w.id} align="center" justify="space-between" p="2" rounded="lg" hover={{ bg: "bg.muted" }}>
                      <Box>
                        <Text fontSize="xs" fontWeight="semibold">{w.name}</Text>
                        <Text fontSize="2xs" color="fg.muted">{w.role}</Text>
                      </Box>
                      <Badge colorPalette={isPaid ? "green" : "orange"} variant="solid" size="sm">
                        {w.paymentStatus}
                      </Badge>
                    </Flex>
                  )
                })
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* RECENT ACTIVITIES (Timeline) */}
      <Card.Root>
        <Card.Header>
          <Heading size="sm">Recent Activities</Heading>
          <Text fontSize="2xs" color="fg.muted">Audit logs of recent operations</Text>
        </Card.Header>
        <Card.Body pt="0">
          <VStack align="stretch" gap="4">
            {activities.length === 0 ? (
              <Text fontSize="xs" color="fg.muted">No activities logged yet.</Text>
            ) : (
              activities.map((activity, idx) => (
                <HStack key={activity.id} gap="4" align="flex-start" position="relative" pb={idx !== activities.length - 1 ? "4" : "0"}>
                  {/* Timeline connector */}
                  {idx !== activities.length - 1 && (
                    <Box position="absolute" left="5" top="8" w="0.5" h="8" bg="border.default" />
                  )}

                  {/* Icon */}
                  <Flex
                    w="10"
                    h="10"
                    rounded="full"
                    align="center"
                    justify="center"
                    bg={activity.color === "blue" ? "blue.subtle" : "purple.subtle"}
                    color={activity.color === "blue" ? "blue.fg" : "purple.fg"}
                    zIndex="1"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {activity.icon}
                  </Flex>

                  {/* Details */}
                  <VStack align="flex-start" gap="0" flex="1">
                    <Flex justify="space-between" width="full" align="baseline">
                      <Text fontSize="xs" fontWeight="bold">{activity.description}</Text>
                      <Text fontSize="2xs" color="fg.muted">{activity.time}</Text>
                    </Flex>
                    <Text fontSize="xs" color="fg.muted">{activity.detail}</Text>
                  </VStack>
                </HStack>
              ))
            )}
          </VStack>
          <Box pt="4" borderTopWidth="1px" borderColor="border.subtle" mt="4">
            <Button size="xs" variant="outline" w="full" onClick={() => showToast("Loading full operation ledger...")}>
              View Full Activity Log
            </Button>
          </Box>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
