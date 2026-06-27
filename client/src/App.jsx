import React, { useState, useEffect } from "react"
import { Box, Flex } from "@chakra-ui/react"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import Navbar from "./components/layout/Navbar"
import Dashboard from "./pages/DashboardPage"
import SalesModule from "./pages/SalesPage"
import PurchasesModule from "./pages/PurchasesPage"
import InventoryModule from "./pages/InventoryPage"
import ProductionModule from "./pages/ProductionPage"
import WorkersModule from "./pages/WorkersPage"
import ExpensesModule from "./pages/ExpensesPage"
import LoginPage from "./pages/LoginPage"
import { Toaster, toaster } from "./components/ui/toaster"
import { DrawerRoot, DrawerContent } from "./components/ui/drawer"
import { useAlertsCount, useStore } from "./store/useStore"
import {
  useInventoryQuery,
  useWorkersQuery,
  useTemplatesQuery,
  useProductionRunsQuery,
  useSalesQuery,
  usePurchasesQuery,
  useExpensesQuery,
} from "./hooks/queries"

function useQuerySync() {
  const store = useStore()
  
  const { data: inventory } = useInventoryQuery()
  const { data: workers } = useWorkersQuery()
  const { data: templates } = useTemplatesQuery()
  const { data: productionRuns } = useProductionRunsQuery()
  const { data: sales } = useSalesQuery()
  const { data: purchases } = usePurchasesQuery()
  const { data: expenses } = useExpensesQuery()

  useEffect(() => {
    if (inventory) store.setInventory(inventory)
  }, [inventory])

  useEffect(() => {
    if (workers) store.setWorkers(workers)
  }, [workers])

  useEffect(() => {
    if (templates) store.setTemplates(templates)
  }, [templates])

  useEffect(() => {
    if (productionRuns) store.setProductionRuns(productionRuns)
  }, [productionRuns])

  useEffect(() => {
    if (sales) store.setSales(sales)
  }, [sales])

  useEffect(() => {
    if (purchases) store.setPurchases(purchases)
  }, [purchases])

  useEffect(() => {
    if (expenses) store.setExpenses(expenses)
  }, [expenses])
}

export default function App() {
  const { token } = useStore()
  useQuerySync()
  const location = useLocation()
  const navigate = useNavigate()
  const alertsCount = useAlertsCount()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  if (!token) {
    return <LoginPage />
  }

  // Compute active view based on routing path
  const getActiveView = () => {
    const path = location.pathname
    if (path === "/" || path === "") return "dashboard"
    return path.substring(1)
  }
  const currentView = getActiveView()

  const setView = (view) => {
    navigate(view === "dashboard" ? "/" : `/${view}`)
  }

  // Handle Quick Add triggers from Navbar
  const handleQuickAdd = (type) => {
    setView(type)
    // Prompt toast suggestion
    toaster.create({
      title: "Form Ready",
      description: `Use the "Record ${type === 'sale' ? 'Sale' : 'Production'}" button to log live data.`,
      type: "info",
    })
  }

  return (
    <Box minH="100vh" bg="bg.default" color="fg.default">
      <Toaster />

      {/* Mobile Drawer Navigation */}
      <DrawerRoot
        open={isMobileSidebarOpen}
        onOpenChange={(e) => setIsMobileSidebarOpen(e.open)}
        placement="left"
      >
        <DrawerContent bg="bg.muted" p="0" maxW="64">
          <Sidebar
            currentView={currentView}
            setView={(view) => {
              setView(view)
              setIsMobileSidebarOpen(false)
            }}
            alertsCount={alertsCount}
            isCollapsed={false}
            setIsCollapsed={() => {}}
            isMobileView={true}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </DrawerContent>
      </DrawerRoot>

      <Flex direction={{ base: "column", md: "row" }} minH="100vh">
        
        {/* Sidebar Nav */}
        <Sidebar
          currentView={currentView}
          setView={setView}
          alertsCount={alertsCount}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        
        {/* Main Content Area */}
        <Box
          flex="1"
          ml={{ base: "0", md: isSidebarCollapsed ? "20" : "64" }}
          transition="margin-left 0.2s ease"
          minH="100vh"
          display="flex"
          flexDirection="column"
        >
          {/* Global Header */}
          <Navbar
            currentView={currentView}
            onQuickAddClick={handleQuickAdd}
            alertsCount={alertsCount}
            onMenuClick={() => setIsMobileSidebarOpen(true)}
          />

          {/* Sub-module viewport */}
          <Box p="6" flex="1" overflowY="auto">
            <Routes>
              <Route
                path="/"
                element={<Dashboard setView={setView} />}
              />
              <Route
                path="/sales"
                element={<SalesModule />}
              />
              <Route
                path="/purchases"
                element={<PurchasesModule />}
              />
              <Route
                path="/inventory"
                element={<InventoryModule />}
              />
              <Route
                path="/production"
                element={<ProductionModule />}
              />
              <Route
                path="/workers"
                element={<WorkersModule />}
              />
              <Route
                path="/expenses"
                element={<ExpensesModule />}
              />
              <Route path="*" element={<Box p="6">View not found.</Box>} />
            </Routes>
          </Box>
        </Box>

      </Flex>
    </Box>
  )
}
