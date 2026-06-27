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
import { Cpu, Plus, Sparkles, Users, Trash } from "lucide-react"
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from "../components/ui/dialog"
import { Select } from "../components/ui/select"

import { useStore } from "../store/useStore"
import {
  useAddTemplateMutation,
  useRunProductionMutation,
} from "../hooks/queries"

export default function ProductionModule() {
  const { templates, productionRuns, inventory, workers, isLoading } = useStore()
  const addTemplateMutation = useAddTemplateMutation()
  const runProductionMutation = useRunProductionMutation()
  const [activeTab, setActiveTab] = useState("runs")
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [isRunOpen, setIsRunOpen] = useState(false)

  // Template Form State
  const [templateName, setTemplateName] = useState("")
  const [templateInputs, setTemplateInputs] = useState([{ itemId: "", grade: "", defaultQty: "" }])
  const [templateOutputs, setTemplateOutputs] = useState([{ itemId: "", grade: "", defaultQty: "", wageRate: "" }])
  const [templateWorkers, setTemplateWorkers] = useState([{ workerId: "" }])
  const [wageType, setWageType] = useState("Quantity") // Quantity / Flat Rate
  const [flatRate, setFlatRate] = useState("") // Defined if Flat Rate

  // Production Run Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [runWorkers, setRunWorkers] = useState([])
  const [runNotes, setRunNotes] = useState("")

  const itemsList = inventory.map((i) => ({ label: i.name, value: i.id }))
  const workersList = workers.map((w) => ({ label: `${w.name} (${w.role || w.type})`, value: w.id }))

  const handleAddTemplateItem = (type) => {
    if (type === "input") setTemplateInputs([...templateInputs, { itemId: "", grade: "", defaultQty: "" }])
    else setTemplateOutputs([...templateOutputs, { itemId: "", grade: "", defaultQty: "", wageRate: "" }])
  }

  const handleRemoveTemplateItem = (type, index) => {
    if (type === "input") setTemplateInputs(templateInputs.filter((_, i) => i !== index))
    else setTemplateOutputs(templateOutputs.filter((_, i) => i !== index))
  }

  const handleAddRunWorker = () => {
    const t = templates.find(temp => temp.id === selectedTemplateId)
    if (t) {
      setRunWorkers([
        ...runWorkers,
        {
          workerId: "",
          inputs: t.inputs.map(i => 0),
          outputs: t.outputs.map(o => 0),
        }
      ])
    }
  }

  const handleRemoveRunWorker = (index) => {
    setRunWorkers(runWorkers.filter((_, i) => i !== index))
  }

  const handleCreateTemplate = (e) => {
    e.preventDefault()
    if (!templateName) return

    const validInputs = templateInputs.filter(i => i.itemId).map(i => ({ ...i, defaultQty: Number(i.defaultQty) || 0 }))
    const validOutputs = templateOutputs.filter(i => i.itemId).map(i => ({
      ...i,
      defaultQty: Number(i.defaultQty) || 0,
      wageRate: wageType === "Quantity" ? (Number(i.wageRate) || 0) : 0
    }))
    const validWorkers = templateWorkers.filter(w => w.workerId).map(w => ({ workerId: w.workerId }))

    if (validInputs.length === 0 || validOutputs.length === 0) return

    addTemplateMutation.mutate({
      name: templateName,
      inputs: validInputs,
      outputs: validOutputs,
      workers: validWorkers,
      wageType,
      flatRate: wageType === "Flat Rate" ? (Number(flatRate) || 0) : 0,
    })

    setTemplateName("")
    setTemplateInputs([{ itemId: "", grade: "", defaultQty: "" }])
    setTemplateOutputs([{ itemId: "", grade: "", defaultQty: "", wageRate: "" }])
    setTemplateWorkers([{ workerId: "" }])
    setWageType("Quantity")
    setFlatRate("")
    setIsTemplateOpen(false)
  }

  const handleRunTemplateSelect = (val) => {
    setSelectedTemplateId(val)
    const t = templates.find((temp) => temp.id === val)
    if (t) {
      const initialWorkers = t.workers && t.workers.length > 0
        ? t.workers.map(w => ({
            workerId: w.workerId,
            inputs: t.inputs.map(i => i.defaultQty || 0),
            outputs: t.outputs.map(o => o.defaultQty || 0),
          }))
        : [
            {
              workerId: "",
              inputs: t.inputs.map(i => i.defaultQty || 0),
              outputs: t.outputs.map(o => o.defaultQty || 0),
            }
          ]
      setRunWorkers(initialWorkers)
    }
  }

  const handleRunProduction = (e) => {
    e.preventDefault()
    if (!selectedTemplateId) return

    const t = templates.find((temp) => temp.id === selectedTemplateId)

    // Calculate aggregated inputs
    const formattedInputs = t.inputs.map((inp, inpIdx) => {
      const totalQty = runWorkers.reduce((sum, rw) => sum + (Number(rw.inputs[inpIdx]) || 0), 0)
      const invItem = inventory.find(inv => inv.id === inp.itemId)
      return {
        itemId: inp.itemId,
        grade: inp.grade,
        itemName: invItem?.name || inp.itemId,
        actualQty: totalQty
      }
    }).filter(i => i.actualQty > 0)

    // Calculate aggregated outputs
    const formattedOutputs = t.outputs.map((out, outIdx) => {
      const totalQty = runWorkers.reduce((sum, rw) => sum + (Number(rw.outputs[outIdx]) || 0), 0)
      const invItem = inventory.find(inv => inv.id === out.itemId)
      return {
        itemId: out.itemId,
        grade: out.grade,
        itemName: invItem?.name || out.itemId,
        actualQty: totalQty
      }
    }).filter(o => o.actualQty > 0)

    if (formattedInputs.length === 0 || formattedOutputs.length === 0) return

    const totalInputQty = formattedInputs.reduce((sum, item) => sum + item.actualQty, 0)
    const totalOutputQty = formattedOutputs.reduce((sum, item) => sum + item.actualQty, 0)

    const yieldPercent = totalInputQty > 0 ? (totalOutputQty / totalInputQty) * 100 : 0
    const wastage = Math.max(0, totalInputQty - totalOutputQty)

    // Calculate individual worker wages based on outputs and grades
    const formattedWorkers = runWorkers.filter(rw => rw.workerId).map(rw => {
      const workerObj = workers.find(wo => wo.id === rw.workerId)
      
      let wages = 0
      if (t.wageType === "Quantity") {
        wages = t.outputs.reduce((sum, out, outIdx) => {
          const qty = Number(rw.outputs[outIdx]) || 0
          const rate = Number(out.wageRate) || 0
          return sum + (qty * rate)
        }, 0)
      } else {
        wages = Number(t.flatRate) || 0
      }

      return {
        workerId: rw.workerId,
        workerName: workerObj ? workerObj.name : "Unknown",
        wages,
        wageType: t.wageType,
        wageRate: t.wageType === "Quantity" ? 0 : Number(t.flatRate) || 0
      }
    })

    runProductionMutation.mutate({
      templateId: selectedTemplateId,
      templateName: t.name,
      date: new Date().toISOString().substring(0, 10),
      inputs: formattedInputs,
      outputs: formattedOutputs,
      yieldPercent,
      wastage,
      workers: formattedWorkers,
      notes: runNotes,
    })

    // Reset Form
    setSelectedTemplateId("")
    setRunWorkers([])
    setRunNotes("")
    setIsRunOpen(false)
  }

  const renderItemRow = (items, setItems, inventory, type, isOutput = false) => {
    return items.map((item, index) => {
      const invItem = inventory.find(i => i.id === item.itemId)
      const gradesList = invItem ? invItem.grades.map(g => ({ label: g, value: g })) : []
      const qtyKey = type === 'template' ? 'defaultQty' : 'actualQty'

      return (
        <HStack key={index} gap="2" align="flex-start" w="full">
          <Box flex="2">
            <Select
              items={itemsList}
              placeholder="Item"
              value={item.itemId}
              onChange={(e) => {
                const newItems = [...items]
                newItems[index].itemId = e.target.value
                const selectedInv = inventory.find(inv => inv.id === e.target.value)
                newItems[index].grade = selectedInv?.hasGrades ? (selectedInv.grades[0] || "") : ""
                setItems(newItems)
              }}
            />
          </Box>
          <Box flex="1.2">
            {invItem && !invItem.hasGrades ? (
              <Input
                placeholder="Grade"
                value="N/A"
                disabled
              />
            ) : (
              <Select
                items={gradesList}
                placeholder="Grade"
                value={item.grade}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[index].grade = e.target.value
                  setItems(newItems)
                }}
                disabled={!item.itemId}
              />
            )}
          </Box>
          <Box flex="1">
            <Input
              type="number"
              placeholder="Qty (kg)"
              value={item[qtyKey]}
              onChange={(e) => {
                const newItems = [...items]
                newItems[index][qtyKey] = e.target.value
                setItems(newItems)
              }}
            />
          </Box>
          {isOutput && type === 'template' && wageType === "Quantity" && (
            <Box flex="1.2">
              <Input
                type="number"
                placeholder="Wage ₹/kg"
                value={item.wageRate || ""}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[index].wageRate = e.target.value
                  setItems(newItems)
                }}
              />
            </Box>
          )}
          <IconButton
            variant="ghost"
            colorPalette="red"
            size="sm"
            onClick={() => handleRemoveTemplateItem(items === templateInputs ? "input" : "output", index)}
          >
            <Trash size={16} />
          </IconButton>
        </HStack>
      )
    })
  }

  // Pre-calculate running totals for the run dialog summary
  const getRunTotals = () => {
    const t = templates.find(temp => temp.id === selectedTemplateId)
    if (!t) return { totalInputQty: 0, totalOutputQty: 0, computedYield: 0, computedWastage: 0, totalWages: 0 }

    const totalInputQty = t.inputs.map((inp, inpIdx) => {
      return runWorkers.reduce((sum, rw) => sum + (Number(rw.inputs[inpIdx]) || 0), 0)
    }).reduce((sum, qty) => sum + qty, 0)

    const totalOutputQty = t.outputs.map((out, outIdx) => {
      return runWorkers.reduce((sum, rw) => sum + (Number(rw.outputs[outIdx]) || 0), 0)
    }).reduce((sum, qty) => sum + qty, 0)

    const computedYield = totalInputQty > 0 ? (totalOutputQty / totalInputQty) * 100 : 0
    const computedWastage = Math.max(0, totalInputQty - totalOutputQty)
    
    const totalWages = runWorkers.reduce((sum, rw) => {
      let rowWage = 0
      if (t.wageType === "Quantity") {
        rowWage = t.outputs.reduce((s, out, outIdx) => {
          const qty = Number(rw.outputs[outIdx]) || 0
          const rate = Number(out.wageRate) || 0
          return s + (qty * rate)
        }, 0)
      } else {
        rowWage = Number(t.flatRate) || 0
      }
      return sum + rowWage
    }, 0)

    return { totalInputQty, totalOutputQty, computedYield, computedWastage, totalWages }
  }

  const { totalInputQty, totalOutputQty, computedYield, totalWages } = getRunTotals()
  const currentSelectedTemplate = templates.find(temp => temp.id === selectedTemplateId)

  if (isLoading) {
    return (
      <VStack align="stretch" gap="6">
        <Flex justify="space-between" align="center" wrap={{ base: "wrap", sm: "nowrap" }} gap="4">
          <Skeleton h="10" w="sm" rounded="lg" />
          <Skeleton h="10" w="40" rounded="lg" />
        </Flex>
        <Box borderWidth="1px" borderColor="border.default" rounded="xl" bg="bg.panel" p="5">
          <VStack gap="5" align="stretch">
            <Skeleton h="8" w="full" rounded="md" />
            <Skeleton h="12" w="full" rounded="md" />
            <Skeleton h="12" w="full" rounded="md" />
            <Skeleton h="12" w="full" rounded="md" />
          </VStack>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="6">
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Flex justify="space-between" align="center" wrap={{ base: "wrap", sm: "nowrap" }} gap="4" borderBottomWidth="1px" borderColor="border.subtle">
          <Tabs.List borderBottom="none">
            <Tabs.Trigger value="runs" gap="2">
              <Sparkles size={16} /> Daily Production Runs
            </Tabs.Trigger>
            <Tabs.Trigger value="templates" gap="2">
              <Cpu size={16} /> Process Templates
            </Tabs.Trigger>
          </Tabs.List>

          <Box pb="2">
            {activeTab === "runs" ? (
              <DialogRoot open={isRunOpen} onOpenChange={(e) => setIsRunOpen(e.open)} size="cover">
                <DialogTrigger asChild>
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
                  >
                    <Plus size={20} />
                    <Text display={{ base: "none", sm: "inline" }}>Run Daily Production</Text>
                  </Button>
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
                  <form
                    onSubmit={handleRunProduction}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      width: "100%",
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Record Production Run</DialogTitle>
                    </DialogHeader>
                    <DialogBody
                      overflowY="auto"
                      px={{ base: 4, md: 6, lg: 8 }}
                      py={6}
                    >
                      <VStack gap="4" align="stretch">
                        <Field.Root required>
                          <Field.Label>Choose Process Template</Field.Label>
                          <Select
                            items={templates.map((t) => ({ label: t.name, value: t.id }))}
                            placeholder="Select template"
                            value={selectedTemplateId}
                            onChange={(e) => handleRunTemplateSelect(e.target.value)}
                          />
                        </Field.Root>

                        {selectedTemplateId && currentSelectedTemplate && (
                          <>
                            <Box borderWidth="1px" rounded="md" p="3">
                              <Heading size="xs" mb="3">Worker Input & Output Grid</Heading>
                              <Box overflowX="auto" border="1px solid" borderColor="border.subtle" rounded="md">
                                <Table.Root size="sm" variant="line">
                                  <Table.Header bg="bg.muted">
                                    <Table.Row>
                                      <Table.ColumnHeader minW="180px">Worker Name</Table.ColumnHeader>
                                      
                                      {/* Dynamic Input Columns */}
                                      {currentSelectedTemplate.inputs.map((inp, idx) => {
                                        const itemObj = inventory.find(i => i.id === inp.itemId)
                                        return (
                                          <Table.ColumnHeader key={`inp-h-${idx}`} minW="120px" textAlign="right">
                                            {itemObj?.name || inp.itemId} ({inp.grade}) (kg)
                                          </Table.ColumnHeader>
                                        )
                                      })}

                                      {/* Dynamic Output Columns (With Wage Rates shown in Header) */}
                                      {currentSelectedTemplate.outputs.map((out, idx) => {
                                        const itemObj = inventory.find(i => i.id === out.itemId)
                                        const rateText = currentSelectedTemplate.wageType === "Quantity" ? ` (₹${out.wageRate}/kg)` : ""
                                        return (
                                          <Table.ColumnHeader key={`out-h-${idx}`} minW="140px" textAlign="right">
                                            {itemObj?.name || out.itemId} ({out.grade}){rateText} (kg)
                                          </Table.ColumnHeader>
                                        )
                                      })}

                                      <Table.ColumnHeader minW="100px" textAlign="right">
                                        Wage {currentSelectedTemplate.wageType === "Flat Rate" ? `(₹${currentSelectedTemplate.flatRate} flat)` : ""}
                                      </Table.ColumnHeader>
                                      <Table.ColumnHeader minW="50px" textAlign="center">Act</Table.ColumnHeader>
                                    </Table.Row>
                                  </Table.Header>
                                  <Table.Body>
                                    {runWorkers.map((rw, index) => {
                                      let computedRowWage = 0
                                      if (currentSelectedTemplate.wageType === "Quantity") {
                                        computedRowWage = currentSelectedTemplate.outputs.reduce((sum, out, outIdx) => {
                                          const qty = Number(rw.outputs[outIdx]) || 0
                                          const rate = Number(out.wageRate) || 0
                                          return sum + (qty * rate)
                                        }, 0)
                                      } else {
                                        computedRowWage = Number(currentSelectedTemplate.flatRate) || 0
                                      }

                                      return (
                                        <Table.Row key={index}>
                                          <Table.Cell>
                                            <Select
                                              items={workersList}
                                              placeholder="Assign Worker"
                                              value={rw.workerId}
                                              onChange={(e) => {
                                                const newWorkers = [...runWorkers]
                                                newWorkers[index].workerId = e.target.value
                                                setRunWorkers(newWorkers)
                                              }}
                                            />
                                          </Table.Cell>
                                          
                                          {/* Inputs fields */}
                                          {currentSelectedTemplate.inputs.map((inp, inpIdx) => (
                                            <Table.Cell key={`inp-c-${inpIdx}`}>
                                              <Input
                                                type="number"
                                                size="sm"
                                                textAlign="right"
                                                value={rw.inputs[inpIdx]}
                                                onChange={(e) => {
                                                  const newWorkers = [...runWorkers]
                                                  newWorkers[index].inputs[inpIdx] = e.target.value
                                                  setRunWorkers(newWorkers)
                                                }}
                                              />
                                            </Table.Cell>
                                          ))}

                                          {/* Outputs fields */}
                                          {currentSelectedTemplate.outputs.map((out, outIdx) => (
                                            <Table.Cell key={`out-c-${outIdx}`}>
                                              <Input
                                                type="number"
                                                size="sm"
                                                textAlign="right"
                                                value={rw.outputs[outIdx]}
                                                onChange={(e) => {
                                                  const newWorkers = [...runWorkers]
                                                  newWorkers[index].outputs[outIdx] = e.target.value
                                                  setRunWorkers(newWorkers)
                                                }}
                                              />
                                            </Table.Cell>
                                          ))}

                                          <Table.Cell textAlign="right" fontWeight="bold">
                                            ₹{computedRowWage.toFixed(0)}
                                          </Table.Cell>
                                          <Table.Cell textAlign="center">
                                            <IconButton
                                              variant="ghost"
                                              colorPalette="red"
                                              size="xs"
                                              onClick={() => handleRemoveRunWorker(index)}
                                            >
                                              <Trash size={14} />
                                            </IconButton>
                                          </Table.Cell>
                                        </Table.Row>
                                      )
                                    })}
                                  </Table.Body>
                                </Table.Root>
                              </Box>
                              <Button size="sm" variant="outline" mt="3" onClick={handleAddRunWorker}>
                                <Plus size={14} /> Add Worker Row
                              </Button>
                            </Box>

                            {/* Wage & quantities overview */}
                            <Box bg="bg.muted" p="3" rounded="lg">
                              <Heading size="xs" mb="2">Production Summary (Calculated Sums)</Heading>
                              <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap="4">
                                <Box bg="bg.panel" p="2" rounded="md" borderWidth="1px">
                                  <Text fontSize="2xs" color="fg.muted">TOTAL INPUT</Text>
                                  <Text fontSize="md" fontWeight="bold">{totalInputQty} kg</Text>
                                </Box>
                                <Box bg="bg.panel" p="2" rounded="md" borderWidth="1px">
                                  <Text fontSize="2xs" color="fg.muted">TOTAL OUTPUT</Text>
                                  <Text fontSize="md" fontWeight="bold">{totalOutputQty} kg</Text>
                                </Box>
                                <Box bg="bg.panel" p="2" rounded="md" borderWidth="1px">
                                  <Text fontSize="2xs" color="fg.muted">BATCH YIELD</Text>
                                  <Badge colorPalette={computedYield >= 80 ? "green" : "orange"} variant="solid" size="md">
                                    {computedYield.toFixed(1)}%
                                  </Badge>
                                </Box>
                                <Box bg="bg.panel" p="2" rounded="md" borderWidth="1px">
                                  <Text fontSize="2xs" color="fg.muted">TOTAL BATCH WAGES</Text>
                                  <Text fontSize="md" fontWeight="bold" color="purple.fg">₹{totalWages}</Text>
                                </Box>
                              </SimpleGrid>
                            </Box>

                            <Field.Root>
                              <Field.Label>Notes</Field.Label>
                              <Input
                                placeholder="Remarks, e.g. batch details"
                                value={runNotes}
                                onChange={(e) => setRunNotes(e.target.value)}
                              />
                            </Field.Root>
                          </>
                        )}
                      </VStack>
                    </DialogBody>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsRunOpen(false)}>Cancel</Button>
                      <Button colorPalette="purple" type="submit" disabled={!selectedTemplateId}>Run Process</Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                  </form>
                </DialogContent>
              </DialogRoot>
            ) : (
              <DialogRoot open={isTemplateOpen} onOpenChange={(e) => setIsTemplateOpen(e.open)}>
                <DialogTrigger asChild>
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
                  >
                    <Plus size={20} />
                    <Text display={{ base: "none", sm: "inline" }}>Create Template</Text>
                  </Button>
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
                  <form
                    onSubmit={handleCreateTemplate}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      width: "100%",
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Define Process Template</DialogTitle>
                    </DialogHeader>
                    <DialogBody
                      overflowY="auto"
                      px={{ base: 4, md: 6, lg: 8 }}
                      py={6}
                    >
                      <VStack gap="4" align="stretch">
                        <Field.Root required>
                          <Field.Label>Template Name</Field.Label>
                          <Input
                            placeholder="e.g. Peeling Stage, Roasting Process"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                          />
                        </Field.Root>

                        <Box borderWidth="1px" rounded="md" p="3">
                          <Text fontWeight="bold" fontSize="sm" mb="2">Inputs (Raw Materials)</Text>
                          <VStack align="stretch" gap="2">
                            {renderItemRow(templateInputs, setTemplateInputs, inventory, 'template')}
                            <Button size="sm" variant="outline" alignSelf="flex-start" onClick={() => handleAddTemplateItem("input")}>
                              <Plus size={14} /> Add Input
                            </Button>
                          </VStack>
                        </Box>

                        <HStack gap="4">
                          <Field.Root required flex="1">
                            <Field.Label>Wage Type</Field.Label>
                            <Select
                              items={[
                                { label: "Piece Rate (Quantity)", value: "Quantity" },
                                { label: "Flat Rate Per Run", value: "Flat Rate" },
                              ]}
                              value={wageType}
                              onChange={(e) => setWageType(e.target.value)}
                            />
                          </Field.Root>

                          {wageType === "Flat Rate" && (
                            <Field.Root required flex="1">
                              <Field.Label>Flat Rate (₹ per worker)</Field.Label>
                              <Input
                                type="number"
                                placeholder="e.g. 150"
                                value={flatRate}
                                onChange={(e) => setFlatRate(e.target.value)}
                              />
                            </Field.Root>
                          )}
                        </HStack>

                        <Box borderWidth="1px" rounded="md" p="3">
                          <Text fontWeight="bold" fontSize="sm" mb="2">Outputs (Finished Goods)</Text>
                          <VStack align="stretch" gap="2">
                            {renderItemRow(templateOutputs, setTemplateOutputs, inventory, 'template', true)}
                            <Button size="sm" variant="outline" alignSelf="flex-start" onClick={() => handleAddTemplateItem("output")}>
                              <Plus size={14} /> Add Output
                            </Button>
                          </VStack>
                        </Box>

                        <Box borderWidth="1px" rounded="md" p="3">
                          <Text fontWeight="bold" fontSize="sm" mb="2">Default Assigned Workers (Optional)</Text>
                          <VStack align="stretch" gap="2">
                            {templateWorkers.map((tw, idx) => (
                              <HStack key={idx} gap="2">
                                <Box flex="1">
                                  <Select
                                    items={workersList}
                                    placeholder="Select Worker"
                                    value={tw.workerId}
                                    onChange={(e) => {
                                      const newWorkers = [...templateWorkers]
                                      newWorkers[idx].workerId = e.target.value
                                      setTemplateWorkers(newWorkers)
                                    }}
                                  />
                                </Box>
                                <IconButton
                                  variant="ghost"
                                  colorPalette="red"
                                  size="sm"
                                  onClick={() => setTemplateWorkers(templateWorkers.filter((_, i) => i !== idx))}
                                >
                                  <Trash size={16} />
                                </IconButton>
                              </HStack>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              alignSelf="flex-start"
                              onClick={() => setTemplateWorkers([...templateWorkers, { workerId: "" }])}
                            >
                              <Plus size={14} /> Add Worker
                            </Button>
                          </VStack>
                        </Box>
                      </VStack>
                    </DialogBody>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsTemplateOpen(false)}>Cancel</Button>
                      <Button colorPalette="purple" type="submit">Create Template</Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                  </form>
                </DialogContent>
              </DialogRoot>
            )}
          </Box>
        </Flex>

        {/* Tab 1: Runs List */}
        <Tabs.Content value="runs">
          <Box
            overflowX="auto"
            borderWidth="1px"
            borderColor="border.default"
            rounded="xl"
            bg="bg.default"
            css={{
              "&::-webkit-scrollbar": {
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
            <Table.Root size="md" variant="line">
              <Table.Header bg="bg.muted">
                <Table.Row>
                  <Table.ColumnHeader>Run ID</Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Process</Table.ColumnHeader>
                  <Table.ColumnHeader>Inputs Used</Table.ColumnHeader>
                  <Table.ColumnHeader>Outputs Produced</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Yield %</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Wastage</Table.ColumnHeader>
                  <Table.ColumnHeader>Workers</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Wages Paid</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {productionRuns.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} textAlign="center" py="8">
                      No production runs executed today. Click "Run Daily Production" to start.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  productionRuns.map((run) => (
                    <Table.Row key={run.id}>
                      <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="semibold">
                        #{run.id.substring(0, 6)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs">{run.date}</Table.Cell>
                      <Table.Cell fontWeight="semibold" fontSize="xs">{run.templateName}</Table.Cell>
                      <Table.Cell fontSize="xs">
                        <VStack align="stretch" gap="0">
                          {run.inputs.map((inp, idx) => (
                            <Text key={idx}>{inp.actualQty} kg <Text as="span" fontSize="2xs" color="fg.muted">({inp.itemName} - {inp.grade})</Text></Text>
                          ))}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell fontSize="xs">
                        <VStack align="stretch" gap="0">
                          {run.outputs.map((out, idx) => (
                            <Text key={idx}>{out.actualQty} kg <Text as="span" fontSize="2xs" color="fg.muted">({out.itemName} - {out.grade})</Text></Text>
                          ))}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontSize="xs" fontWeight="bold">
                        <Badge colorPalette={run.yieldPercent >= 80 ? "green" : "orange"} variant="solid">
                          {run.yieldPercent.toFixed(1)}%
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontSize="xs" color="red.500" fontWeight="semibold">
                        {run.wastage} kg
                      </Table.Cell>
                      <Table.Cell fontSize="xs">
                        <VStack align="stretch" gap="1">
                          {run.workers && run.workers.length > 0 ? (
                            run.workers.map((rw, idx) => (
                              <HStack key={idx} gap="1">
                                <Users size={10} color="gray" />
                                <Text fontSize="2xs">{rw.workerName} (₹{rw.wages})</Text>
                              </HStack>
                            ))
                          ) : (
                            <Text color="fg.muted" fontSize="xs">—</Text>
                          )}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontWeight="bold" fontSize="xs">
                        ₹{(run.workers ? run.workers.reduce((sum, rw) => sum + rw.wages, 0) : 0).toLocaleString()}
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </Tabs.Content>

        {/* Tab 2: Templates List */}
        <Tabs.Content value="templates">
          {templates.length === 0 ? (
            <Card.Root variant="subtle" py="16" textAlign="center" borderColor="border.subtle" borderStyle="dashed">
              <Card.Body display="flex" flexDirection="column" alignItems="center" gap="4">
                <Box
                  bg="purple.subtle"
                  color="purple.fg"
                  p="4"
                  rounded="full"
                >
                  <Cpu size={32} />
                </Box>
                <VStack gap="1">
                  <Heading size="md">No templates defined</Heading>
                  <Text color="fg.muted" fontSize="sm" maxW="sm">
                    Create production templates (e.g. Raw Cashew processing) to configure standard inputs, outputs, worker wages, and yield calculations.
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
              {templates.map((t) => {
                const totalInputQty = t.inputs.reduce((sum, item) => sum + item.defaultQty, 0)
                const totalOutputQty = t.outputs.reduce((sum, item) => sum + item.defaultQty, 0)
                const expectedYield = totalInputQty > 0 ? (totalOutputQty / totalInputQty) * 100 : 0

                return (
                  <Card.Root key={t.id} variant="elevated">
                    <Card.Header>
                      <HStack justify="space-between" width="full">
                        <HStack gap="2">
                          <Cpu size={18} color="purple" />
                          <Heading size="sm">{t.name}</Heading>
                        </HStack>
                        <Badge colorPalette="purple" variant="outline">
                          Expected Yield: {expectedYield.toFixed(0)}%
                        </Badge>
                      </HStack>
                    </Card.Header>
                    <Card.Body gap="3">
                      <SimpleGrid columns={2} gap="4" bg="bg.muted" p="3" rounded="lg">
                        <VStack align="flex-start" gap="1">
                          <Text fontSize="2xs" color="fg.muted" fontWeight="bold">INPUT ITEMS</Text>
                          {t.inputs.map((inp, idx) => {
                            const itemObj = inventory.find((i) => i.id === inp.itemId)
                            return (
                              <Box key={idx}>
                                <Text fontSize="sm" fontWeight="bold">{itemObj?.name}</Text>
                                <Text fontSize="xs" color="fg.muted">{inp.defaultQty} kg ({inp.grade})</Text>
                              </Box>
                            )
                          })}
                        </VStack>
                        <VStack align="flex-start" gap="1">
                          <Text fontSize="2xs" color="fg.muted" fontWeight="bold">OUTPUT ITEMS</Text>
                          {t.outputs.map((out, idx) => {
                            const itemObj = inventory.find((i) => i.id === out.itemId)
                            return (
                              <Box key={idx}>
                                <Text fontSize="sm" fontWeight="bold">{itemObj?.name}</Text>
                                <Text fontSize="xs" color="fg.muted">
                                  {out.defaultQty} kg ({out.grade}) 
                                  {t.wageType === "Quantity" ? ` — Wage: ₹${out.wageRate}/kg` : ""}
                                </Text>
                              </Box>
                            )
                          })}
                        </VStack>
                      </SimpleGrid>

                      <VStack align="stretch" gap="1" pt="2" borderTopWidth="1px" borderColor="border.subtle">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">DEFAULT ASSIGNED WORKERS</Text>
                        {t.workers && t.workers.length > 0 ? (
                          <HStack wrap="wrap" gap="1.5">
                            {t.workers.map((tw, idx) => {
                              const workerObj = workers.find(w => w.id === tw.workerId)
                              return (
                                <Badge key={idx} colorPalette="purple" variant="subtle" size="sm">
                                  {workerObj?.name || "Unknown"}
                                </Badge>
                              )
                            })}
                          </HStack>
                        ) : (
                          <Text fontSize="xs" color="fg.muted">None assigned by default</Text>
                        )}
                      </VStack>
                      
                      <HStack justify="space-between" pt="1" px="1">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">WAGE METHOD:</Text>
                        <Text fontSize="xs" fontWeight="black" color="purple.fg">
                          {t.wageType === "Quantity" ? "Grade-Specific Piece Rate" : `Flat Rate (₹${t.flatRate}/worker)`}
                        </Text>
                      </HStack>
                    </Card.Body>
                  </Card.Root>
                )
              })}
            </SimpleGrid>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}
