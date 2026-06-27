import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Heading,
  Text,
  Table,
  HStack,
  VStack,
  Badge,
  Card,
  Input,
  Tabs,
  SimpleGrid,
  Flex,
  IconButton,
  Skeleton,
} from "@chakra-ui/react"
import { Field } from "@chakra-ui/react"
import { Users, Plus, Check, Trash, Edit, RefreshCw } from "lucide-react"
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from "../components/ui/dialog"
import { Select } from "../components/ui/select"

import { useStore } from "../store/useStore"
import {
  useAddWorkerMutation,
  useEditWorkerMutation,
  useDeleteWorkerMutation,
  useMarkWagesPaidMutation,
} from "../hooks/queries"

export default function WorkersModule() {
  const { workers, productionRuns, isLoading } = useStore()
  const addWorkerMutation = useAddWorkerMutation()
  const editWorkerMutation = useEditWorkerMutation()
  const deleteWorkerMutation = useDeleteWorkerMutation()
  const markWagesPaidMutation = useMarkWagesPaidMutation()
  const [activeTab, setActiveTab] = useState("wage")
  
  // Dialog controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)
  const [selectedWorkerForDisburse, setSelectedWorkerForDisburse] = useState(null)
  const [disburseAmount, setDisburseAmount] = useState("")

  // Form states (reused for Add and Edit)
  const [name, setName] = useState("")
  const [role, setRole] = useState("Operator")
  const [type, setType] = useState("Wage") // Salary / Wage
  const [rate, setRate] = useState("") // Monthly salary rate only (wage rate is grade-specific in templates)

  const handleAddClick = () => {
    setName("")
    setRole("Operator")
    setType("Wage")
    setRate("")
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!name) return
    if (type === "Salary" && !rate) return

    addWorkerMutation.mutate({
      name,
      type,
      role: type === "Salary" ? role : "Production Worker",
      rate: type === "Salary" ? Number(rate) : 0,
      paymentStatus: "Pending",
    })

    setIsAddOpen(false)
  }

  const handleEditClick = (worker) => {
    setSelectedWorker(worker)
    setName(worker.name)
    setType(worker.type)
    setRole(worker.role || "Operator")
    setRate(worker.type === "Salary" ? worker.rate : "")
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!name || !selectedWorker) return
    if (type === "Salary" && !rate) return

    editWorkerMutation.mutate({
      workerId: selectedWorker.id,
      updatedData: {
        name,
        type,
        role: type === "Salary" ? role : "Production Worker",
        rate: type === "Salary" ? Number(rate) : 0,
      }
    })

    setIsEditOpen(false)
    setSelectedWorker(null)
  }

  const handleDeleteClick = (workerId) => {
    if (window.confirm("Are you sure you want to delete this worker profile? This cannot be undone.")) {
      deleteWorkerMutation.mutate(workerId)
    }
  }

  // Filter workers based on type
  const salaryWorkers = workers.filter((w) => w.type === "Salary")
  const wageWorkers = workers.filter((w) => w.type === "Wage")

  // Calculate total wages earned across all runs (searching workers list inside runs)
  const getAccruedWages = (workerId) => {
    const workerRuns = productionRuns.filter((r) => r.workers && r.workers.some((rw) => rw.workerId === workerId))
    const totalWages = workerRuns.reduce((sum, run) => {
      const rw = run.workers.find((rw) => rw.workerId === workerId)
      return sum + (rw ? rw.wages : 0)
    }, 0)
    return totalWages
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap="6">
        <Flex justify="space-between" align="center" wrap={{ base: "wrap", sm: "nowrap" }} gap="4">
          <Skeleton h="10" w="sm" rounded="lg" />
          <Skeleton h="10" w="40" rounded="lg" />
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
          <Box p="5" borderWidth="1px" rounded="2xl" bg="bg.panel">
            <Skeleton h="6" w="32" mb="4" />
            <Skeleton h="16" w="full" />
          </Box>
          <Box p="5" borderWidth="1px" rounded="2xl" bg="bg.panel">
            <Skeleton h="6" w="32" mb="4" />
            <Skeleton h="16" w="full" />
          </Box>
        </SimpleGrid>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="6">
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Flex justify="space-between" align="center" wrap={{ base: "wrap", sm: "nowrap" }} gap="4" borderBottomWidth="1px" borderColor="border.subtle">
          <Tabs.List borderBottom="none">
            <Tabs.Trigger value="wage" gap="2">
              <Users size={16} /> Wage-based Workers
            </Tabs.Trigger>
            <Tabs.Trigger value="salary" gap="2">
              <Users size={16} /> Fixed Salary Workers
            </Tabs.Trigger>
          </Tabs.List>

          <Box pb="2">
            <Button
              colorPalette="purple"
              position={{ base: "fixed", sm: "static" }}
              bottom={{ base: "6", sm: "auto" }}
              right={{ base: "6", sm: "auto" }}
              zIndex={{ base: "99", sm: "auto" }}
              shadow={{ base: "xl", sm: "none" }}
              rounded={{ base: "full", sm: "lg" }}
              w={{ base: "12", sm: "auto" }}
              h={{ base: "12", sm: "auto" }}
              px={{ base: "0", sm: "5" }}
              py={{ base: "0", sm: "2.5" }}
              gap="2"
              size="md"
              onClick={handleAddClick}
            >
              <Plus size={20} />
              <Text display={{ base: "none", sm: "inline" }}>Add Worker</Text>
            </Button>
          </Box>
        </Flex>

        {/* Wage Workers List */}
        <Tabs.Content value="wage">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
            {wageWorkers.length === 0 ? (
              <Box py="6" textAlign="center" colSpan="2" width="full" color="fg.muted">
                No wage-based workers registered yet.
              </Box>
            ) : (
              wageWorkers.map((w) => {
                const totalEarned = getAccruedWages(w.id)
                const paidAmount = w.paidAmount || 0
                const unpaidDues = Math.max(0, totalEarned - paidAmount)
                const isPaid = w.paymentStatus === "Paid" && unpaidDues === 0
                const totalRuns = productionRuns.filter((r) => r.workers && r.workers.some((rw) => rw.workerId === w.id)).length

                return (
                  <Card.Root key={w.id} variant="elevated">
                    <Card.Body gap="3">
                      <Flex align="center" justify="space-between">
                        <HStack gap="2">
                          <Box bg="purple.subtle" color="purple.fg" p="2" rounded="md">
                            <Users size={16} />
                          </Box>
                          <VStack align="flex-start" gap="0">
                            <Heading size="xs">{w.name}</Heading>
                            <Text fontSize="2xs" color="fg.muted">Role: Production Worker</Text>
                          </VStack>
                        </HStack>
                        <HStack gap="2">
                          <Badge colorPalette={isPaid ? "green" : "orange"} variant="solid">
                            {isPaid ? "Paid" : "Unpaid Dues"}
                          </Badge>
                          <IconButton variant="ghost" size="xs" onClick={() => handleEditClick(w)}>
                            <Edit size={14} />
                          </IconButton>
                          <IconButton variant="ghost" colorPalette="red" size="xs" onClick={() => handleDeleteClick(w.id)}>
                            <Trash size={14} />
                          </IconButton>
                        </HStack>
                      </Flex>

                      <SimpleGrid columns={3} gap="2" bg="bg.muted" p="3" rounded="lg" textAlign="center">
                        <VStack gap="0" align="center">
                          <Text fontSize="3xs" color="fg.muted" fontWeight="bold">EARNED TO DATE</Text>
                          <Text fontSize="xs" fontWeight="bold">₹{totalEarned.toLocaleString()}</Text>
                        </VStack>
                        <VStack gap="0" align="center" borderLeftWidth="1px" borderRightWidth="1px" borderColor="border.subtle">
                          <Text fontSize="3xs" color="fg.muted" fontWeight="bold">TOTAL PAID</Text>
                          <Text fontSize="xs" fontWeight="bold" color="green.fg">₹{paidAmount.toLocaleString()}</Text>
                        </VStack>
                        <VStack gap="0" align="center">
                          <Text fontSize="3xs" color="fg.muted" fontWeight="bold">UNPAID DUES</Text>
                          <Text fontSize="xs" fontWeight="black" color={unpaidDues > 0 ? "purple.fg" : "fg.default"}>
                            ₹{unpaidDues.toLocaleString()}
                          </Text>
                        </VStack>
                      </SimpleGrid>

                      <HStack justify="space-between" px="1">
                        <Text fontSize="2xs" color="fg.muted">LOGGED WORK: <strong>{totalRuns} Runs</strong></Text>
                      </HStack>

                      {unpaidDues > 0 ? (
                        <Button
                          colorPalette="purple"
                          size="xs"
                          w="full"
                          gap="1"
                          onClick={() => {
                            setSelectedWorkerForDisburse(w)
                            setDisburseAmount(unpaidDues.toString())
                            setIsDisburseOpen(true)
                          }}
                        >
                          <Check size={12} /> Disburse Payment
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          colorPalette="gray"
                          size="xs"
                          w="full"
                          gap="1"
                          onClick={() => markWagesPaidMutation.mutate({ workerId: w.id, amount: 0, setPending: true })}
                        >
                          <RefreshCw size={12} /> Reset Payroll Cycle
                        </Button>
                      )}
                    </Card.Body>
                  </Card.Root>
                )
              })
            )}
          </SimpleGrid>
        </Tabs.Content>

        {/* Salary Workers List */}
        <Tabs.Content value="salary">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
            {salaryWorkers.length === 0 ? (
              <Box py="6" textAlign="center" colSpan="2" width="full" color="fg.muted">
                No salary-based workers registered yet.
              </Box>
            ) : (
              salaryWorkers.map((w) => {
                const totalDue = w.rate || 0
                const paidAmount = w.paidAmount || 0
                const unpaidDues = Math.max(0, totalDue - paidAmount)
                const isPaid = w.paymentStatus === "Paid" && unpaidDues === 0

                return (
                  <Card.Root key={w.id} variant="elevated">
                    <Card.Body gap="3">
                      <Flex align="center" justify="space-between">
                        <HStack gap="2">
                          <Box bg="blue.subtle" color="blue.fg" p="2" rounded="md">
                            <Users size={16} />
                          </Box>
                          <VStack align="flex-start" gap="0">
                            <Heading size="xs">{w.name}</Heading>
                            <Text fontSize="2xs" color="fg.muted">Role: {w.role}</Text>
                          </VStack>
                        </HStack>
                        <HStack gap="2">
                          <Badge colorPalette={isPaid ? "green" : (w.paymentStatus === "Partially Paid" ? "orange" : "red")} variant="solid">
                            {isPaid ? "Paid" : (unpaidDues > 0 ? "Unpaid Dues" : "Unpaid")}
                          </Badge>
                          <IconButton variant="ghost" size="xs" onClick={() => handleEditClick(w)}>
                            <Edit size={14} />
                          </IconButton>
                          <IconButton variant="ghost" colorPalette="red" size="xs" onClick={() => handleDeleteClick(w.id)}>
                            <Trash size={14} />
                          </IconButton>
                        </HStack>
                      </Flex>

                      <SimpleGrid columns={3} gap="2" bg="bg.muted" p="3" rounded="lg" textAlign="center">
                        <VStack gap="0" align="center">
                          <Text fontSize="3xs" color="fg.muted" fontWeight="bold">MONTHLY RATE</Text>
                          <Text fontSize="xs" fontWeight="bold">₹{totalDue.toLocaleString()}</Text>
                        </VStack>
                        <VStack gap="0" align="center" borderLeftWidth="1px" borderRightWidth="1px" borderColor="border.subtle">
                          <Text fontSize="3xs" color="fg.muted" fontWeight="bold">TOTAL PAID</Text>
                          <Text fontSize="xs" fontWeight="bold" color="green.fg">₹{paidAmount.toLocaleString()}</Text>
                        </VStack>
                        <VStack gap="0" align="center">
                          <Text fontSize="3xs" color="fg.muted" fontWeight="bold">UNPAID DUES</Text>
                          <Text fontSize="xs" fontWeight="black" color={unpaidDues > 0 ? "purple.fg" : "fg.default"}>
                            ₹{unpaidDues.toLocaleString()}
                          </Text>
                        </VStack>
                      </SimpleGrid>

                      {unpaidDues > 0 ? (
                        <Button
                          colorPalette="blue"
                          size="xs"
                          w="full"
                          gap="1"
                          onClick={() => {
                            setSelectedWorkerForDisburse(w)
                            setDisburseAmount(unpaidDues.toString())
                            setIsDisburseOpen(true)
                          }}
                        >
                          <Check size={12} /> Pay Monthly Salary
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          colorPalette="gray"
                          size="xs"
                          w="full"
                          gap="1"
                          onClick={() => markWagesPaidMutation.mutate({ workerId: w.id, amount: 0, setPending: true })}
                        >
                          <RefreshCw size={12} /> Mark Next Month Due
                        </Button>
                      )}
                    </Card.Body>
                  </Card.Root>
                )
              })
            )}
          </SimpleGrid>
        </Tabs.Content>
      </Tabs.Root>

      {/* Add Worker Dialog */}
      <DialogRoot open={isAddOpen} onOpenChange={(e) => setIsAddOpen(e.open)}>
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
          <form
            onSubmit={handleAddSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
            }}
          >
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <DialogBody
              overflowY="auto"
              px={{ base: 4, md: 6, lg: 8 }}
              py={6}
            >
              <VStack gap="4" align="stretch">
                <Field.Root required>
                  <Field.Label>Worker Name</Field.Label>
                  <Input
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Payment Category</Field.Label>
                  <Select
                    items={[
                      { label: "Daily/Piece Wage (Calculated from Production)", value: "Wage" },
                      { label: "Fixed Monthly Salary", value: "Salary" },
                    ]}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </Field.Root>

                {type === "Salary" && (
                  <>
                    <Field.Root required>
                      <Field.Label>Role / Job Title</Field.Label>
                      <Select
                        items={["Supervisor", "Manager", "Accountant", "Operator"]}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>Monthly Salary Amount (₹)</Field.Label>
                      <Input
                        type="number"
                        placeholder="e.g. 15000"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </Field.Root>
                  </>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button colorPalette="purple" type="submit">Add Worker</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Edit Worker Dialog */}
      <DialogRoot open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)}>
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
          <form
            onSubmit={handleEditSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Employee Details</DialogTitle>
            </DialogHeader>
            <DialogBody
              overflowY="auto"
              px={{ base: 4, md: 6, lg: 8 }}
              py={6}
            >
              <VStack gap="4" align="stretch">
                <Field.Root required>
                  <Field.Label>Worker Name</Field.Label>
                  <Input
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Payment Category</Field.Label>
                  <Select
                    items={[
                      { label: "Daily/Piece Wage (Calculated from Production)", value: "Wage" },
                      { label: "Fixed Monthly Salary", value: "Salary" },
                    ]}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </Field.Root>

                {type === "Salary" && (
                  <>
                    <Field.Root required>
                      <Field.Label>Role / Job Title</Field.Label>
                      <Select
                        items={["Supervisor", "Manager", "Accountant", "Operator"]}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>Monthly Salary Amount (₹)</Field.Label>
                      <Input
                        type="number"
                        placeholder="e.g. 15000"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </Field.Root>
                  </>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button colorPalette="purple" type="submit">Save Changes</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Disburse Payment Dialog */}
      <DialogRoot open={isDisburseOpen} onOpenChange={(e) => setIsDisburseOpen(e.open)}>
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
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const amt = parseFloat(disburseAmount)
              if (isNaN(amt) || amt <= 0 || !selectedWorkerForDisburse) return
              const totalDue = selectedWorkerForDisburse.type === "Wage" 
                ? getAccruedWages(selectedWorkerForDisburse.id) 
                : selectedWorkerForDisburse.rate
              markWagesPaidMutation.mutate({
                workerId: selectedWorkerForDisburse.id,
                amount: amt,
                setPending: false,
                totalDue
              })
              setIsDisburseOpen(false)
              setSelectedWorkerForDisburse(null)
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
            }}
          >
            <DialogHeader>
              <DialogTitle>Disburse Payment: {selectedWorkerForDisburse?.name}</DialogTitle>
            </DialogHeader>
            <DialogBody
              overflowY="auto"
              px={{ base: 4, md: 6, lg: 8 }}
              py={6}
            >
              {(() => {
                if (!selectedWorkerForDisburse) return null;
                const totalDue = selectedWorkerForDisburse.type === "Wage" 
                  ? getAccruedWages(selectedWorkerForDisburse.id) 
                  : selectedWorkerForDisburse.rate;
                const paidAmt = selectedWorkerForDisburse.paidAmount || 0;
                const unpaid = Math.max(0, totalDue - paidAmt);
                return (
                  <VStack gap="6" align="stretch">
                    <SimpleGrid columns={3} gap="4" bg="bg.muted" p="4" rounded="lg" textAlign="center">
                      <VStack gap="0" align="center">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL DUE</Text>
                        <Text fontSize="sm" fontWeight="bold">₹{totalDue.toLocaleString()}</Text>
                      </VStack>
                      <VStack gap="0" align="center" borderLeftWidth="1px" borderRightWidth="1px" borderColor="border.subtle">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">ALREADY PAID</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.fg">₹{paidAmt.toLocaleString()}</Text>
                      </VStack>
                      <VStack gap="0" align="center">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">REMAINING DUE</Text>
                        <Text fontSize="sm" fontWeight="black" color="purple.fg">₹{unpaid.toLocaleString()}</Text>
                      </VStack>
                    </SimpleGrid>

                    <Field.Root required>
                      <Field.Label>Amount to Disburse (₹)</Field.Label>
                      <Input
                        type="number"
                        placeholder="Enter payment amount"
                        value={disburseAmount}
                        onChange={(e) => setDisburseAmount(e.target.value)}
                        max={unpaid}
                        min="1"
                      />
                    </Field.Root>
                  </VStack>
                );
              })()}
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsDisburseOpen(false)}>
                Cancel
              </Button>
              <Button colorPalette="purple" size="sm" type="submit" disabled={!disburseAmount || parseFloat(disburseAmount) <= 0}>
                Confirm Disburse
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>
    </VStack>
  )
}
