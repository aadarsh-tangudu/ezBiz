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
  Input,
  Flex,
  SimpleGrid,
  Checkbox,
  Skeleton,
} from "@chakra-ui/react"
import { Field } from "@chakra-ui/react"
import { Search, Plus, Calendar, Truck, FileText, Download, Trash2, Printer } from "lucide-react"
import { Select } from "../components/ui/select"
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from "../components/ui/dialog"

import { useStore } from "../store/useStore"
import {
  useAddPurchaseMutation,
  usePayPurchaseMutation,
  useUpdatePurchaseFilesMutation,
} from "../hooks/queries"

export default function PurchasesModule() {
  const { purchases, inventory, isLoading } = useStore()
  const addPurchaseMutation = useAddPurchaseMutation()
  const payPurchaseMutation = usePayPurchaseMutation()
  const updatePurchaseFilesMutation = useUpdatePurchaseFilesMutation()
  const [search, setSearch] = useState("")
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substring(0, 16))
  const [supplier, setSupplier] = useState("")
  const [supplierAddress, setSupplierAddress] = useState("")
  const [supplierGstin, setSupplierGstin] = useState("")
  
  // Transport Details State
  const [transportType, setTransportType] = useState("Road")
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [transporterId, setTransporterId] = useState("")
  const [transporterName, setTransporterName] = useState("")

  // Item Management Draft Items
  const [draftItems, setDraftItems] = useState([])
  const [selectedItemId, setSelectedItemId] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")

  const handleItemChange = (itemId) => {
    setSelectedItemId(itemId)
    const itemObj = inventory.find((i) => i.id === itemId)
    setSelectedGrade(itemObj?.grades?.[0] || "")
  }
  const [quantity, setQuantity] = useState("")
  const [rate, setRate] = useState("")
  const [selectedGstRate, setSelectedGstRate] = useState("0")
  const [selectedTaxType, setSelectedTaxType] = useState("CGST+SGST")

  const [paymentType, setPaymentType] = useState("Cash")
  const [paymentStatus, setPaymentStatus] = useState("Paid")
  const [paidAmountInput, setPaidAmountInput] = useState("")
  const [paymentRecordAmount, setPaymentRecordAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [generateReceiptOnline, setGenerateReceiptOnline] = useState(false)

  const itemsList = inventory.map((i) => ({ label: i.name, value: i.id }))

  const handleAddDraftItem = () => {
    if (!selectedItemId || !quantity || !rate) return
    const itemObj = inventory.find((i) => i.id === selectedItemId)
    if (!itemObj) return
    
    const qty = Number(quantity)
    const price = Number(rate)
    const gstRateNum = Number(selectedGstRate)
    
    const taxableValue = qty * price
    let cgst = 0
    let sgst = 0
    let igst = 0
    
    if (selectedTaxType === "CGST+SGST") {
      cgst = taxableValue * (gstRateNum / 200)
      sgst = taxableValue * (gstRateNum / 200)
    } else {
      igst = taxableValue * (gstRateNum / 100)
    }
    const taxAmount = cgst + sgst + igst
    const subtotal = taxableValue + taxAmount

    const newItem = {
      itemId: selectedItemId,
      itemName: itemObj.name,
      grade: selectedGrade,
      qty,
      rate: price,
      taxableValue,
      gstRate: gstRateNum,
      taxType: selectedTaxType,
      cgst,
      sgst,
      igst,
      taxAmount,
      subtotal,
    }
    
    setDraftItems((prev) => [...prev, newItem])
    // Reset single item inputs
    setSelectedItemId("")
    setSelectedGrade("")
    setQuantity("")
    setRate("")
    setSelectedGstRate("0")
    setSelectedTaxType("CGST+SGST")
  }

  const handleRemoveDraftItem = (index) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRecordPurchase = (e) => {
    e.preventDefault()
    if (draftItems.length === 0) {
      alert("Please add at least one item to the purchase.")
      return
    }

    const totalAmt = draftItems.reduce((sum, item) => sum + item.subtotal, 0)
    const purchaseId = `pur-${Math.random().toString(36).substring(2, 9)}`

    let finalPaidAmount = 0
    let finalPaymentStatus = paymentStatus
    if (paymentStatus === "Paid") {
      finalPaidAmount = totalAmt
    } else if (paymentStatus === "Partially Paid") {
      finalPaidAmount = parseFloat(paidAmountInput) || 0
      if (finalPaidAmount >= totalAmt) {
        finalPaidAmount = totalAmt
        finalPaymentStatus = "Paid"
      } else if (finalPaidAmount <= 0) {
        finalPaidAmount = 0
        finalPaymentStatus = "Pending"
      }
    } else {
      finalPaidAmount = 0
    }

    addPurchaseMutation.mutate({
      id: purchaseId,
      date: purchaseDate,
      supplierName: supplier || "Walk-in Supplier",
      supplierAddress: supplierAddress || "N/A",
      supplierGstin: supplierGstin || "",
      transportDetails: {
        type: transportType,
        vehicleNumber: vehicleNumber || "N/A",
        transporterId: transporterId || "N/A",
        transporterName: transporterName || "N/A",
      },
      items: draftItems,
      totalCost: totalAmt,
      paymentType,
      paymentStatus: finalPaymentStatus,
      paidAmount: finalPaidAmount,
      notes,
      billFile: generateReceiptOnline
        ? {
            name: `Receipt_${purchaseId.substring(4).toUpperCase()}.pdf`,
            size: 13800,
            type: "application/pdf",
            data: "Online generated PDF purchase receipt data",
            isOnlineGenerated: true,
          }
        : null,
      receiptFile: null,
    })

    // Reset Form
    setSupplier("")
    setSupplierAddress("")
    setSupplierGstin("")
    setTransportType("Road")
    setVehicleNumber("")
    setTransporterId("")
    setTransporterName("")
    setDraftItems([])
    setPaidAmountInput("")
    setNotes("")
    setGenerateReceiptOnline(false)
    setIsOpen(false)
  }

  // File download helper
  const downloadFile = (file) => {
    if (file && file.fileId) {
      window.open(`/api/attachments/${file.fileId}`, "_blank")
      return
    }
    const fileContent = file.data || "Mock File Content for " + file.name
    const blob = new Blob([fileContent], { type: file.type || "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name || "download"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // File upload handler
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const fileObj = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result,
      }
      updatePurchaseFilesMutation.mutate({ purchaseId: selectedPurchase.id, fileType, fileData: fileObj })
      setSelectedPurchase((prev) => ({ ...prev, [fileType]: fileObj }))
    }
    reader.readAsDataURL(file)
  }

  // File remove handler
  const handleRemoveFile = (fileType) => {
    updatePurchaseFilesMutation.mutate({ purchaseId: selectedPurchase.id, fileType, fileData: null })
    setSelectedPurchase((prev) => ({ ...prev, [fileType]: null }))
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Paid": return "green"
      case "Partially Paid": return "orange"
      case "Pending": return "red"
      default: return "gray"
    }
  }

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.items?.some((item) => item.itemName.toLowerCase().includes(search.toLowerCase()))
  )

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
      {/* Top action bar */}
      <Flex justify="space-between" align="center" wrap={{ base: "wrap", sm: "nowrap" }} gap="4">
        {/* Search */}
        <HStack maxW="sm" w="full" bg="bg.muted" px="3" py="2" rounded="lg" borderWidth="1px" borderColor="border.default">
          <Search size={16} color="gray" />
          <Input
            placeholder="Search by supplier or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="unstyled"
            size="sm"
          />
        </HStack>

        {/* Add Purchase Modal */}
        <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
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
              <Text display={{ base: "none", sm: "inline" }}>Record Purchase</Text>
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
              onSubmit={handleRecordPurchase}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              <DialogHeader>
                <DialogTitle>Record New Purchase</DialogTitle>
              </DialogHeader>
              <DialogBody
                overflowY="auto"
                px={{ base: 4, md: 6, lg: 8 }}
                py={6}
              >
                <VStack gap="6" align="stretch">
                  {/* General details */}
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                    <Field.Root required>
                      <Field.Label>Date & Time</Field.Label>
                      <Input
                        type="datetime-local"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Supplier Name</Field.Label>
                      <Input
                        placeholder="e.g. Western Ghats Farms"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Supplier GSTIN (Optional)</Field.Label>
                      <Input
                        placeholder="e.g. 32AAAAA1111A1Z1"
                        value={supplierGstin}
                        onChange={(e) => setSupplierGstin(e.target.value)}
                      />
                    </Field.Root>
                  </SimpleGrid>

                  <Field.Root>
                    <Field.Label>Supplier Address</Field.Label>
                    <Input
                      placeholder="e.g. Western Ghats, Kerala, India"
                      value={supplierAddress}
                      onChange={(e) => setSupplierAddress(e.target.value)}
                    />
                  </Field.Root>

                  {/* Transport details */}
                  <Box borderTopWidth="1px" borderColor="border.subtle" pt="4">
                    <Heading size="xs" mb="3" color="purple.fg">Transport Details</Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                      <Field.Root>
                        <Field.Label>Transport Mode</Field.Label>
                        <Select
                          items={["Road", "Air", "Rail", "Sea"]}
                          value={transportType}
                          onChange={(e) => setTransportType(e.target.value)}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Vehicle Number</Field.Label>
                        <Input
                          placeholder="e.g. KL-08-CD-9988"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Transporter Name</Field.Label>
                        <Input
                          placeholder="e.g. Ghats Logistics"
                          value={transporterName}
                          onChange={(e) => setTransporterName(e.target.value)}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Transporter ID</Field.Label>
                        <Input
                          placeholder="e.g. TRANS-7766"
                          value={transporterId}
                          onChange={(e) => setTransporterId(e.target.value)}
                        />
                      </Field.Root>
                    </SimpleGrid>
                  </Box>

                  {/* Item Manager */}
                  <Box borderTopWidth="1px" borderColor="border.subtle" pt="4">
                    <Heading size="xs" mb="3" color="purple.fg">Items Management</Heading>
                    <Box bg="bg.muted" p="4" rounded="lg" mb="4">
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 7 }} gap="4" align="flex-end">
                        <Field.Root>
                          <Field.Label>Product Item</Field.Label>
                          <Select
                            items={itemsList}
                            placeholder="Choose item"
                            value={selectedItemId}
                            onChange={(e) => handleItemChange(e.target.value)}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Grade</Field.Label>
                          {selectedItemId && !inventory.find((i) => i.id === selectedItemId)?.hasGrades ? (
                            <Input
                              placeholder="Grade"
                              value="N/A"
                              disabled
                            />
                          ) : (
                            <Select
                              items={inventory.find((i) => i.id === selectedItemId)?.grades || []}
                              value={selectedGrade}
                              onChange={(e) => setSelectedGrade(e.target.value)}
                            />
                          )}
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Quantity (kg)</Field.Label>
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Rate (₹/kg)</Field.Label>
                          <Input
                            type="number"
                            placeholder="Rate"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>GST Slab</Field.Label>
                          <Select
                            items={
                              selectedTaxType === "CGST+SGST"
                                ? [
                                    { label: "0% + 0% (Exempt)", value: "0" },
                                    { label: "2.5% + 2.5% (Standard)", value: "5" },
                                    { label: "6% + 6%", value: "12" },
                                    { label: "9% + 9% (Standard)", value: "18" },
                                    { label: "14% + 14%", value: "28" },
                                  ]
                                : [
                                    { label: "0% (Exempt)", value: "0" },
                                    { label: "5% (Standard)", value: "5" },
                                    { label: "12%", value: "12" },
                                    { label: "18% (Standard)", value: "18" },
                                    { label: "28%", value: "28" },
                                  ]
                            }
                            value={selectedGstRate}
                            onChange={(e) => setSelectedGstRate(e.target.value)}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Tax Type</Field.Label>
                          <Select
                            items={[
                              { label: "CGST+SGST", value: "CGST+SGST" },
                              { label: "IGST", value: "IGST" },
                            ]}
                            value={selectedTaxType}
                            onChange={(e) => setSelectedTaxType(e.target.value)}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label opacity={0} pointerEvents="none">Add Item Action</Field.Label>
                          <Button
                            type="button"
                            colorPalette="purple"
                            w="full"
                            onClick={handleAddDraftItem}
                          >
                            Add Item
                          </Button>
                        </Field.Root>
                      </SimpleGrid>

                      {/* Live Calculation Preview */}
                      {quantity && rate && (
                        <Box
                          mt="3"
                          p="3.5"
                          bg="purple.muted/10"
                          borderWidth="1px"
                          borderColor="purple.subtle"
                          rounded="xl"
                        >
                          <SimpleGrid columns={{ base: 2, sm: 4 }} gap="4">
                            <VStack align="flex-start" gap="0">
                              <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TAXABLE VALUE</Text>
                              <Text fontSize="sm" fontWeight="bold">₹{(Number(quantity) * Number(rate)).toLocaleString()}</Text>
                            </VStack>
                            {selectedTaxType === "CGST+SGST" ? (
                              <>
                                <VStack align="flex-start" gap="0">
                                  <Text fontSize="2xs" color="fg.muted" fontWeight="bold">CGST ({(Number(selectedGstRate)/2).toFixed(1)}%)</Text>
                                  <Text fontSize="sm" fontWeight="bold">₹{((Number(quantity) * Number(rate) * Number(selectedGstRate)) / 200).toFixed(2)}</Text>
                                </VStack>
                                <VStack align="flex-start" gap="0">
                                  <Text fontSize="2xs" color="fg.muted" fontWeight="bold">SGST ({(Number(selectedGstRate)/2).toFixed(1)}%)</Text>
                                  <Text fontSize="sm" fontWeight="bold">₹{((Number(quantity) * Number(rate) * Number(selectedGstRate)) / 200).toFixed(2)}</Text>
                                </VStack>
                              </>
                            ) : (
                              <>
                                <VStack align="flex-start" gap="0">
                                  <Text fontSize="2xs" color="fg.muted" fontWeight="bold">IGST ({selectedGstRate}%)</Text>
                                  <Text fontSize="sm" fontWeight="bold">₹{((Number(quantity) * Number(rate) * Number(selectedGstRate)) / 100).toFixed(2)}</Text>
                                </VStack>
                                <Box />
                              </>
                            )}
                            <VStack align="flex-start" gap="0">
                              <Text fontSize="2xs" color="purple.fg" fontWeight="bold">SUBTOTAL (INCL. TAX)</Text>
                              <Text fontSize="sm" fontWeight="black" color="purple.fg">
                                ₹{(Number(quantity) * Number(rate) * (1 + Number(selectedGstRate)/100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Text>
                            </VStack>
                          </SimpleGrid>
                        </Box>
                      )}
                    </Box>

                    {/* Draft items table */}
                    {draftItems.length > 0 ? (
                      <Box
                        overflowX="auto"
                        borderWidth="1px"
                        borderColor="border.default"
                        rounded="xl"
                        bg="bg.default"
                        mb="4"
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
                        <Table.Root size="sm" variant="line">
                          <Table.Header bg="bg.muted">
                            <Table.Row>
                              <Table.ColumnHeader>Product Description</Table.ColumnHeader>
                              <Table.ColumnHeader>Grade</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">Qty</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">Rate</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">Taxable Value</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">GST %</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">CGST</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">SGST</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">IGST</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">Subtotal</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="center">Action</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {draftItems.map((item, idx) => (
                              <Table.Row key={idx}>
                                <Table.Cell fontSize="xs">{item.itemName}</Table.Cell>
                                <Table.Cell fontSize="xs">{item.grade || "N/A"}</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">{item.qty} kg</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">₹{item.rate}/kg</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">₹{item.taxableValue.toLocaleString()}</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">
                                   {item.taxType === "CGST+SGST" ? `${item.gstRate / 2}% + ${item.gstRate / 2}%` : `${item.gstRate}%`}
                                 </Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">₹{item.cgst.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">₹{item.sgst.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right">₹{item.igst.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="right" fontWeight="bold">₹{item.subtotal.toLocaleString()}</Table.Cell>
                                <Table.Cell fontSize="xs" textAlign="center">
                                  <Button size="2xs" colorPalette="red" variant="ghost" onClick={() => handleRemoveDraftItem(idx)}>
                                    Remove
                                  </Button>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    ) : (
                      <Text fontSize="xs" color="fg.muted" fontStyle="italic" mb="4">
                        No items added to purchase draft yet. Use the selector above to add products.
                      </Text>
                    )}

                    {draftItems.length > 0 && (
                      <Box bg="purple.muted/15" p="3" rounded="xl" borderWidth="1px" borderColor="purple.subtle" mb="4">
                        <SimpleGrid columns={{ base: 2, md: 5 }} gap="4">
                          <VStack align="flex-start" gap="0">
                            <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL TAXABLE VALUE</Text>
                            <Text fontSize="sm" fontWeight="bold">₹{draftItems.reduce((sum, i) => sum + i.taxableValue, 0).toLocaleString()}</Text>
                          </VStack>
                          <VStack align="flex-start" gap="0">
                            <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL CENTRAL GST (CGST)</Text>
                            <Text fontSize="sm" fontWeight="bold">₹{draftItems.reduce((sum, i) => sum + i.cgst, 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                          </VStack>
                          <VStack align="flex-start" gap="0">
                            <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL STATE GST (SGST)</Text>
                            <Text fontSize="sm" fontWeight="bold">₹{draftItems.reduce((sum, i) => sum + i.sgst, 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                          </VStack>
                          <VStack align="flex-start" gap="0">
                            <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL IGST</Text>
                            <Text fontSize="sm" fontWeight="bold">₹{draftItems.reduce((sum, i) => sum + i.igst, 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                          </VStack>
                          <VStack align="flex-start" gap="0">
                            <Text fontSize="2xs" color="purple.fg" fontWeight="bold">GRAND TOTAL COST (INCL. TAX)</Text>
                            <Text fontSize="md" fontWeight="black" color="purple.fg">₹{draftItems.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString()}</Text>
                          </VStack>
                        </SimpleGrid>
                      </Box>
                    )}
                  </Box>

                  {/* Payment & Invoice details */}
                  <Box borderTopWidth="1px" borderColor="border.subtle" pt="4">
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                      <Field.Root required>
                        <Field.Label>Payment Type</Field.Label>
                        <Select
                          items={["Cash", "Online", "Credit"]}
                          value={paymentType}
                          onChange={(e) => setPaymentType(e.target.value)}
                        />
                      </Field.Root>

                      <Field.Root required>
                        <Field.Label>Payment Status</Field.Label>
                        <Select
                          items={["Paid", "Partially Paid", "Pending"]}
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value)}
                        />
                      </Field.Root>

                      {paymentStatus === "Partially Paid" && (
                        <Field.Root required>
                          <Field.Label>Amount Paid (₹)</Field.Label>
                          <Input
                            type="number"
                            placeholder="e.g. 5000"
                            value={paidAmountInput}
                            onChange={(e) => setPaidAmountInput(e.target.value)}
                            min="0"
                          />
                        </Field.Root>
                      )}

                      <Field.Root>
                        <Field.Label>Grand Total Cost</Field.Label>
                        <Box
                          bg="bg.muted"
                          h="10"
                          rounded="lg"
                          display="flex"
                          alignItems="center"
                          px="3"
                          fontWeight="black"
                          color="purple.fg"
                          fontSize="md"
                        >
                          ₹{draftItems.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()}
                        </Box>
                      </Field.Root>
                    </SimpleGrid>
                  </Box>

                  <Field.Root>
                    <Field.Label>Notes</Field.Label>
                    <Input
                      placeholder="Internal remarks..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Field.Root>

                  <Box pt="2">
                    <Checkbox.Root
                      checked={generateReceiptOnline}
                      onCheckedChange={(details) => setGenerateReceiptOnline(!!details.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label fontSize="sm" fontWeight="bold">
                        Generate Goods Receipt Online (PDF Receipt)
                      </Checkbox.Label>
                    </Checkbox.Root>
                  </Box>
                </VStack>
              </DialogBody>
              <DialogFooter gap="2">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button colorPalette="purple" size="sm" type="submit" disabled={draftItems.length === 0}>Submit Purchase</Button>
              </DialogFooter>
              <DialogCloseTrigger />
            </form>
          </DialogContent>
        </DialogRoot>
      </Flex>

      {/* Purchases Table */}
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
              <Table.ColumnHeader>Purchase ID</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Supplier</Table.ColumnHeader>
              <Table.ColumnHeader>Items Details</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Total Cost</Table.ColumnHeader>
              <Table.ColumnHeader>Payment Type</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredPurchases.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} textAlign="center" py="8">
                  No purchases recorded yet. Click "Record Purchase" to add one.
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredPurchases.map((purchase) => (
                <Table.Row
                  key={purchase.id}
                  onClick={() => setSelectedPurchase(purchase)}
                  cursor="pointer"
                  hover={{ bg: "bg.muted" }}
                >
                  <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="semibold">
                    #{purchase.id.substring(0, 6)}
                  </Table.Cell>
                  <Table.Cell fontSize="xs">
                    {new Date(purchase.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </Table.Cell>
                  <Table.Cell fontWeight="semibold" fontSize="xs">
                    {purchase.supplierName}
                  </Table.Cell>
                  <Table.Cell fontSize="xs">
                    <VStack align="flex-start" gap="0">
                      {purchase.items && purchase.items.length > 0 ? (
                        <>
                          <Text fontWeight="semibold">
                            {purchase.items[0].itemName}
                            {purchase.items.length > 1 ? ` (+${purchase.items.length - 1} more)` : ""}
                          </Text>
                          <Text fontSize="2xs" color="fg.muted">
                            {purchase.items.map(item => `${item.qty} kg${item.grade ? ` (${item.grade})` : ""}`).join(", ")}
                          </Text>
                        </>
                      ) : (
                        <Text color="fg.muted">No items</Text>
                      )}
                    </VStack>
                  </Table.Cell>
                  <Table.Cell textAlign="right" fontWeight="bold" fontSize="xs">
                    ₹{purchase.totalCost.toLocaleString()}
                  </Table.Cell>
                  <Table.Cell fontSize="xs">
                    <Badge variant="subtle" colorPalette="gray">{purchase.paymentType}</Badge>
                  </Table.Cell>
                  <Table.Cell fontSize="xs">
                    <Badge variant="solid" colorPalette={getStatusBadgeColor(purchase.paymentStatus)}>
                      {purchase.paymentStatus}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Purchase Details Dialog */}
      <DialogRoot open={!!selectedPurchase} onOpenChange={(e) => { if (!e.open) setSelectedPurchase(null) }}>
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
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          <DialogBody
            overflowY="auto"
            px={{ base: 4, md: 6, lg: 8 }}
            py={6}
          >
            {selectedPurchase && (
              <VStack align="stretch" gap="6">
                {/* General Purchase Info */}
                <Box bg="bg.muted" p="4" rounded="lg" borderWidth="1px" borderColor="border.subtle">
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 2 }} gap="4">
                    <HStack justify="space-between">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">PURCHASE ID</Text>
                      <Text fontSize="xs" fontFamily="mono" fontWeight="semibold">#{selectedPurchase.id}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">DATE & TIME</Text>
                      <Text fontSize="xs" fontWeight="semibold">
                        {new Date(selectedPurchase.date).toLocaleString([], { dateStyle: "long", timeStyle: "short" })}
                      </Text>
                    </HStack>
                  </SimpleGrid>
                </Box>

                {/* Supplier Details */}
                <Box>
                  <Heading size="xs" mb="2" color="purple.fg">Supplier Profile</Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4" bg="bg.muted" p="3" rounded="lg">
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">SUPPLIER NAME</Text>
                      <Text fontSize="xs" fontWeight="bold">{selectedPurchase.supplierName}</Text>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">GSTIN</Text>
                      <Text fontSize="xs" fontWeight="semibold">{selectedPurchase.supplierGstin || "N/A"}</Text>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">ADDRESS</Text>
                      <Text fontSize="xs" fontWeight="semibold">{selectedPurchase.supplierAddress || "N/A"}</Text>
                    </VStack>
                  </SimpleGrid>
                </Box>

                {/* Transport Details */}
                <Box>
                  <Heading size="xs" mb="2" color="purple.fg">Transport Details</Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4" bg="bg.muted" p="3" rounded="lg">
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">MODE</Text>
                      <Text fontSize="xs" fontWeight="semibold">{selectedPurchase.transportDetails?.type || "Road"}</Text>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">VEHICLE NO</Text>
                      <Text fontSize="xs" fontWeight="semibold">{selectedPurchase.transportDetails?.vehicleNumber || "N/A"}</Text>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TRANSPORTER NAME</Text>
                      <Text fontSize="xs" fontWeight="semibold">{selectedPurchase.transportDetails?.transporterName || "N/A"}</Text>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TRANSPORTER ID</Text>
                      <Text fontSize="xs" fontWeight="semibold">{selectedPurchase.transportDetails?.transporterId || "N/A"}</Text>
                    </VStack>
                  </SimpleGrid>
                </Box>

                {/* items list */}
                <Box>
                  <Heading size="xs" mb="2" color="purple.fg">Items Table</Heading>
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
                    <Table.Root size="sm" variant="line">
                      <Table.Header bg="bg.muted">
                        <Table.Row>
                          <Table.ColumnHeader>Product Description</Table.ColumnHeader>
                          <Table.ColumnHeader>Grade</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Qty</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Rate</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Taxable Value</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">GST %</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">CGST</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">SGST</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">IGST</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Subtotal</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {selectedPurchase.items?.map((item, index) => {
                          const inventoryItem = inventory.find(inv => inv.id === item.itemId || inv._id === item.itemId);
                          const itemName = item.itemName || inventoryItem?.name || "Unknown Product";
                          const subtotal = item.subtotal !== undefined ? item.subtotal : (item.qty * item.rate) + (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);

                          return (
                            <Table.Row key={index}>
                              <Table.Cell fontSize="xs">{itemName}</Table.Cell>
                              <Table.Cell fontSize="xs">{item.grade || "N/A"}</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">{item.qty} kg</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">₹{item.rate}/kg</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">₹{(item.taxableValue || (item.qty * item.rate)).toLocaleString()}</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">
                                {item.taxType === "CGST+SGST" ? `${(item.gstRate || 0) / 2}% + ${(item.gstRate || 0) / 2}%` : `${item.gstRate || 0}%`}
                              </Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">₹{(item.cgst || 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">₹{(item.sgst || 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right">₹{(item.igst || 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right" fontWeight="bold">₹{subtotal.toLocaleString()}</Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Box>

                  {/* Dynamic totals summary */}
                  <Box bg="purple.muted/15" p="3" rounded="xl" borderWidth="1px" borderColor="purple.subtle" mt="2">
                    <SimpleGrid columns={{ base: 2, md: 5 }} gap="4">
                      <VStack align="flex-start" gap="0">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL TAXABLE VALUE</Text>
                        <Text fontSize="sm" fontWeight="bold">₹{selectedPurchase.items?.reduce((sum, i) => sum + (i.taxableValue || (i.qty * i.rate)), 0).toLocaleString()}</Text>
                      </VStack>
                      <VStack align="flex-start" gap="0">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL Central GST (CGST)</Text>
                        <Text fontSize="sm" fontWeight="bold">₹{selectedPurchase.items?.reduce((sum, i) => sum + (i.cgst || 0), 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </VStack>
                      <VStack align="flex-start" gap="0">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL State GST (SGST)</Text>
                        <Text fontSize="sm" fontWeight="bold">₹{selectedPurchase.items?.reduce((sum, i) => sum + (i.sgst || 0), 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </VStack>
                      <VStack align="flex-start" gap="0">
                        <Text fontSize="2xs" color="fg.muted" fontWeight="bold">TOTAL IGST</Text>
                        <Text fontSize="sm" fontWeight="bold">₹{selectedPurchase.items?.reduce((sum, i) => sum + (i.igst || 0), 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </VStack>
                      <VStack align="flex-start" gap="0">
                        <Text fontSize="2xs" color="purple.fg" fontWeight="bold">GRAND TOTAL COST (INCL. TAX)</Text>
                        <Text fontSize="md" fontWeight="black" color="purple.fg">₹{selectedPurchase.totalCost.toLocaleString()}</Text>
                      </VStack>
                    </SimpleGrid>
                  </Box>
                </Box>

                {/* Payment summary & notes */}
                <SimpleGrid columns={{ base: 2, md: 4 }} gap="4" pt="3" borderTopWidth="1px" borderColor="border.subtle">
                  <VStack align="flex-start" gap="0">
                    <Text fontSize="2xs" color="fg.muted" fontWeight="bold">PAYMENT TYPE</Text>
                    <Badge variant="subtle" size="sm" mt="1">{selectedPurchase.paymentType}</Badge>
                  </VStack>
                  <VStack align="flex-start" gap="0">
                    <Text fontSize="2xs" color="fg.muted" fontWeight="bold">PAYMENT STATUS</Text>
                    <Badge variant="solid" colorPalette={getStatusBadgeColor(selectedPurchase.paymentStatus)} size="sm" mt="1">
                      {selectedPurchase.paymentStatus}
                    </Badge>
                  </VStack>
                  <VStack align="flex-start" gap="0">
                    <Text fontSize="2xs" color="fg.muted" fontWeight="bold">PAID AMOUNT</Text>
                    <Text fontSize="xs" fontWeight="bold" color="green.fg">
                      ₹{(selectedPurchase.paidAmount ?? (selectedPurchase.paymentStatus === "Paid" ? selectedPurchase.totalCost : 0)).toLocaleString()}
                    </Text>
                  </VStack>
                  <VStack align="flex-start" gap="0">
                    <Text fontSize="2xs" color="fg.muted" fontWeight="bold">REMAINING BALANCE</Text>
                    <Text fontSize="xs" fontWeight="bold" color="red.fg">
                      ₹{(selectedPurchase.totalCost - (selectedPurchase.paidAmount ?? (selectedPurchase.paymentStatus === "Paid" ? selectedPurchase.totalCost : 0))).toLocaleString()}
                    </Text>
                  </VStack>
                </SimpleGrid>

                {(() => {
                  const purchasePaidAmt = selectedPurchase.paidAmount !== undefined ? selectedPurchase.paidAmount : (selectedPurchase.paymentStatus === "Paid" ? selectedPurchase.totalCost : 0);
                  const purchaseBalance = selectedPurchase.totalCost - purchasePaidAmt;
                  return purchaseBalance > 0 && (
                    <Box p="4" borderWidth="1px" borderColor="border.subtle" rounded="lg" bg="purple.subtle/10" mt="3" width="full">
                      <Heading size="xs" mb="3" color="purple.fg">Record Partial/Full Payment</Heading>
                      <HStack gap="4" align="flex-end">
                        <Field.Root required flex="1">
                          <Field.Label>Amount Paid (₹)</Field.Label>
                          <Input
                            type="number"
                            placeholder="Enter payment amount"
                            value={paymentRecordAmount}
                            onChange={(e) => setPaymentRecordAmount(e.target.value)}
                            max={purchaseBalance}
                            min="1"
                          />
                        </Field.Root>
                        <Button
                          colorPalette="purple"
                          size="sm"
                          onClick={() => {
                            const amt = parseFloat(paymentRecordAmount);
                            if (isNaN(amt) || amt <= 0) return;
                            payPurchaseMutation.mutate({ purchaseId: selectedPurchase.id, amount: amt });
                            
                            const newPaid = purchasePaidAmt + amt;
                            const newStatus = newPaid >= selectedPurchase.totalCost ? "Paid" : "Partially Paid";
                            
                            setSelectedPurchase({
                              ...selectedPurchase,
                              paidAmount: newPaid,
                              paymentStatus: newStatus
                            });
                            setPaymentRecordAmount("");
                          }}
                          disabled={!paymentRecordAmount || parseFloat(paymentRecordAmount) <= 0}
                        >
                          Submit Payment
                        </Button>
                      </HStack>
                    </Box>
                  );
                })()}

                {selectedPurchase.notes && (
                  <VStack align="flex-start" gap="1" borderTopWidth="1px" borderColor="border.subtle" pt="3">
                    <Text fontSize="2xs" color="fg.muted" fontWeight="bold">REMARKS / NOTES</Text>
                    <Text fontSize="xs" bg="bg.muted" p="2" rounded="md" width="full" fontStyle="italic">
                      "{selectedPurchase.notes}"
                    </Text>
                  </VStack>
                )}

                {/* Document Attachments Manager */}
                <Box borderTopWidth="1px" borderColor="border.subtle" pt="4">
                  <Heading size="xs" mb="3" color="purple.fg">Document Attachments</Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 2 }} gap="4">
                    {/* Bill / Invoice Attachment */}
                    <Box p="3" borderWidth="1px" borderColor="border.subtle" rounded="lg" bg="bg.muted">
                      <HStack gap="2" mb="2">
                        <FileText size={16} color="var(--chakra-colors-purple-500)" />
                        <Text fontSize="xs" fontWeight="bold">Tax Invoice / Bill</Text>
                      </HStack>
                      {selectedPurchase.billFile ? (
                        <VStack align="stretch" gap="2">
                          <Box bg="bg.default" p="2" rounded="md" borderWidth="1px" borderColor="border.subtle">
                            <Text fontSize="2xs" fontWeight="semibold" truncate>{selectedPurchase.billFile.name}</Text>
                            <Text fontSize="3xs" color="fg.muted">{(selectedPurchase.billFile.size / 1024).toFixed(1)} KB</Text>
                          </Box>
                          <HStack gap="2">
                            <Button size="xs" variant="outline" flex="1" gap="1" onClick={() => downloadFile(selectedPurchase.billFile)}>
                              <Download size={12} /> Download
                            </Button>
                            <Button size="xs" colorPalette="red" variant="ghost" gap="1" onClick={() => handleRemoveFile("billFile")}>
                              <Trash2 size={12} /> Remove
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box border="1px dashed" borderColor="border.default" p="4" rounded="md" textAlign="center" bg="bg.default">
                          <Text fontSize="3xs" mb="2" color="fg.muted">No bill file attached</Text>
                          <Input type="file" display="none" id="purchase-bill-upload" onChange={(e) => handleFileUpload(e, "billFile")} />
                          <Button as="label" htmlFor="purchase-bill-upload" size="xs" variant="outline" cursor="pointer">
                            Upload File
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {/* Receipt Attachment */}
                    <Box p="3" borderWidth="1px" borderColor="border.subtle" rounded="lg" bg="bg.muted">
                      <HStack gap="2" mb="2">
                        <FileText size={16} color="var(--chakra-colors-teal-500)" />
                        <Text fontSize="xs" fontWeight="bold">Receipt / Payment Advice</Text>
                      </HStack>
                      {selectedPurchase.receiptFile ? (
                        <VStack align="stretch" gap="2">
                          <Box bg="bg.default" p="2" rounded="md" borderWidth="1px" borderColor="border.subtle">
                            <Text fontSize="2xs" fontWeight="semibold" truncate>{selectedPurchase.receiptFile.name}</Text>
                            <Text fontSize="3xs" color="fg.muted">{(selectedPurchase.receiptFile.size / 1024).toFixed(1)} KB</Text>
                          </Box>
                          <HStack gap="2">
                            <Button size="xs" variant="outline" flex="1" gap="1" onClick={() => downloadFile(selectedPurchase.receiptFile)}>
                              <Download size={12} /> Download
                            </Button>
                            <Button size="xs" colorPalette="red" variant="ghost" gap="1" onClick={() => handleRemoveFile("receiptFile")}>
                              <Trash2 size={12} /> Remove
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box border="1px dashed" borderColor="border.default" p="4" rounded="md" textAlign="center" bg="bg.default">
                          <Text fontSize="3xs" mb="2" color="fg.muted">No receipt file attached</Text>
                          <Input type="file" display="none" id="purchase-receipt-upload" onChange={(e) => handleFileUpload(e, "receiptFile")} />
                          <Button as="label" htmlFor="purchase-receipt-upload" size="xs" variant="outline" cursor="pointer">
                            Upload File
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>
              </VStack>
            )}
          </DialogBody>
          <DialogFooter gap="2">
            {selectedPurchase?.billFile?.isOnlineGenerated && (
              <Button colorPalette="purple" size="sm" gap="1" onClick={() => setIsPrintReceiptOpen(true)}>
                <Printer size={14} /> View Generated Receipt
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedPurchase(null)}>Close</Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* Printable Purchase Receipt Dialog */}
      <DialogRoot open={isPrintReceiptOpen} onOpenChange={(e) => { if (!e.open) setIsPrintReceiptOpen(false) }}>
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
          <DialogHeader>
            <DialogTitle>Online Generated Purchase Receipt</DialogTitle>
          </DialogHeader>
          <DialogBody
            overflowY="auto"
            px={{ base: 4, md: 6, lg: 8 }}
            py={6}
          >
            {selectedPurchase && (
              <Box id="printable-receipt-content" p="6" border="1px solid" borderColor="border.default" rounded="lg" bg="white" color="black">
                {/* Header */}
                <Flex justify="space-between" align="center" borderBottom="2px solid" borderColor="black" pb="4" mb="4">
                  <VStack align="flex-start" gap="0">
                    <Heading size="md" color="purple.700" fontWeight="black" letterSpacing="wide">GOODS RECEIPT NOTE</Heading>
                    <Text fontSize="2xs" color="gray.600">EzBiz Industries | Factory Processing Unit</Text>
                    <Text fontSize="2xs" color="gray.600">Mangalore, Karnataka, India | GSTIN: 29ABCCE1234D1Z2</Text>
                  </VStack>
                  <VStack align="flex-end" gap="0">
                    <Heading size="sm" color="gray.700">INWARD INVOICE</Heading>
                    <Text fontSize="xs" fontWeight="bold" color="black">Receipt ID: REC-{selectedPurchase.id.substring(4).toUpperCase()}</Text>
                    <Text fontSize="xs" color="black">Date: {new Date(selectedPurchase.date).toLocaleDateString()}</Text>
                  </VStack>
                </Flex>

                {/* Details Grid */}
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap="6" mb="6" fontSize="xs">
                  <Box p="3" bg="gray.50" rounded="md" border="1px solid" borderColor="gray.200">
                    <Text fontWeight="bold" color="gray.700" mb="1" borderBottom="1px solid" borderColor="gray.300" pb="1">RECEIVED FROM (SUPPLIER):</Text>
                    <Text fontWeight="black" color="black">{selectedPurchase.supplierName}</Text>
                    <Text color="gray.600">{selectedPurchase.supplierAddress}</Text>
                    {selectedPurchase.supplierGstin && <Text fontWeight="semibold" mt="1" color="black">GSTIN: {selectedPurchase.supplierGstin}</Text>}
                  </Box>
                  <Box p="3" bg="gray.50" rounded="md" border="1px solid" borderColor="gray.200">
                    <Text fontWeight="bold" color="gray.700" mb="1" borderBottom="1px solid" borderColor="gray.300" pb="1">TRANSPORTATION LOG:</Text>
                    <Text color="black"><Text as="span" fontWeight="semibold">Carrier / Agent:</Text> {selectedPurchase.transportDetails?.transporterName || "N/A"}</Text>
                    <Text color="black"><Text as="span" fontWeight="semibold">Transporter ID:</Text> {selectedPurchase.transportDetails?.transporterId || "N/A"}</Text>
                    <Text color="black"><Text as="span" fontWeight="semibold">Mode:</Text> {selectedPurchase.transportDetails?.type || "Road"}</Text>
                    <Text color="black"><Text as="span" fontWeight="semibold">Vehicle Number:</Text> {selectedPurchase.transportDetails?.vehicleNumber || "N/A"}</Text>
                  </Box>
                </SimpleGrid>

                {/* Items Table */}
                <Table.Root size="sm" variant="line" mb="4">
                  <Table.Header>
                    <Table.Row borderColor="black">
                      <Table.ColumnHeader color="black" fontWeight="bold">Sr No.</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold">Description of Goods</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold">Grade</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">Qty (kg)</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">Rate (₹/kg)</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">Taxable (₹)</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">GST %</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">Central GST (₹)</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">State GST (₹)</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">Integrated GST (₹)</Table.ColumnHeader>
                      <Table.ColumnHeader color="black" fontWeight="bold" textAlign="right">Total (₹)</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {selectedPurchase.items?.map((item, idx) => {
                      const inventoryItem = inventory.find(inv => inv.id === item.itemId || inv._id === item.itemId);
                      const itemName = item.itemName || inventoryItem?.name || "Unknown Product";
                      const subtotal = item.subtotal !== undefined ? item.subtotal : (item.qty * item.rate) + (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);

                      return (
                        <Table.Row key={idx} borderColor="gray.200">
                          <Table.Cell color="black">{idx + 1}</Table.Cell>
                          <Table.Cell color="black" fontWeight="semibold">{itemName}</Table.Cell>
                          <Table.Cell color="black">{item.grade || "N/A"}</Table.Cell>
                          <Table.Cell color="black" textAlign="right">{item.qty} kg</Table.Cell>
                          <Table.Cell color="black" textAlign="right">₹{item.rate}</Table.Cell>
                          <Table.Cell color="black" textAlign="right">₹{(item.taxableValue || (item.qty * item.rate)).toLocaleString()}</Table.Cell>
                          <Table.Cell color="black" textAlign="right">
                            {item.taxType === "CGST+SGST" ? `${(item.gstRate || 0) / 2}% + ${(item.gstRate || 0) / 2}%` : `${item.gstRate || 0}%`}
                          </Table.Cell>
                          <Table.Cell color="black" textAlign="right">₹{(item.cgst || 0).toFixed(2)}</Table.Cell>
                          <Table.Cell color="black" textAlign="right">₹{(item.sgst || 0).toFixed(2)}</Table.Cell>
                          <Table.Cell color="black" textAlign="right">₹{(item.igst || 0).toFixed(2)}</Table.Cell>
                          <Table.Cell color="black" textAlign="right" fontWeight="semibold">₹{subtotal.toLocaleString()}</Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>

                {/* Summary Table */}
                <Flex justify="flex-end" mb="6">
                  <VStack align="stretch" gap="1" w="80" fontSize="xs">
                    <Flex justify="space-between" color="black">
                      <Text>Taxable Subtotal:</Text>
                      <Text fontWeight="semibold">
                        ₹
                        {selectedPurchase.items?.reduce((sum, i) => sum + (i.taxableValue || (i.qty * i.rate)), 0).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </Text>
                    </Flex>
                    {selectedPurchase.items?.reduce((sum, i) => sum + (i.igst || 0), 0) > 0 ? (
                      <Flex justify="space-between" color="black">
                        <Text>Integrated GST (IGST):</Text>
                        <Text fontWeight="semibold">
                          ₹
                          {selectedPurchase.items?.reduce((sum, i) => sum + (i.igst || 0), 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </Flex>
                    ) : (
                      <>
                        <Flex justify="space-between" color="black">
                          <Text>Central GST (CGST):</Text>
                          <Text fontWeight="semibold">
                            ₹
                            {selectedPurchase.items?.reduce((sum, i) => sum + (i.cgst || 0), 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </Flex>
                        <Flex justify="space-between" color="black">
                          <Text>State GST (SGST):</Text>
                          <Text fontWeight="semibold">
                            ₹
                            {selectedPurchase.items?.reduce((sum, i) => sum + (i.sgst || 0), 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </Flex>
                      </>
                    )}
                    <Flex justify="space-between" borderTop="1px solid" borderColor="black" pt="1" fontSize="sm" fontWeight="bold" color="purple.700">
                      <Text>Total Cost (incl. GST):</Text>
                      <Text>₹{selectedPurchase.totalCost.toLocaleString()}</Text>
                    </Flex>
                  </VStack>
                </Flex>

                {/* Footer Notes */}
                <Flex justify="space-between" align="flex-end" mt="10" pt="6" borderTop="1px dashed" borderColor="gray.300" fontSize="2xs" color="gray.600">
                  <VStack align="flex-start" gap="0">
                    <Text fontWeight="semibold">Warehouse Verification:</Text>
                    <Text>1. All products weighed at factory scales.</Text>
                    <Text>2. Quality inspected and approved for grading.</Text>
                  </VStack>
                  <VStack align="center" gap="1" w="48">
                    <Box h="12" />
                    <Text borderTop="1px solid" borderColor="gray.400" w="full" textAlign="center" pt="1" color="black">Warehouse In-Charge</Text>
                  </VStack>
                </Flex>
              </Box>
            )}
          </DialogBody>
          <DialogFooter gap="2">
            <Button variant="outline" size="sm" onClick={() => setIsPrintReceiptOpen(false)}>Close</Button>
            <Button colorPalette="purple" size="sm" onClick={() => {
              const printContent = document.getElementById("printable-receipt-content").innerHTML;
              const printWindow = window.open("", "_blank");
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Purchase Receipt - Print</title>
                    <style>
                      body { font-family: system-ui, sans-serif; margin: 20px; color: black; }
                      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; }
                      .text-right { text-align: right; }
                      .flex { display: flex; }
                      .justify-between { justify-content: space-between; }
                      .justify-end { justify-content: flex-end; }
                      .flex-end { align-items: flex-end; }
                      .w-full { width: 100%; }
                      .w-64 { width: 256px; }
                      .w-48 { width: 192px; }
                      .text-center { text-align: center; }
                      .mt-10 { margin-top: 40px; }
                      .pt-6 { padding-top: 24px; }
                      .pb-4 { padding-bottom: 16px; }
                      .mb-4 { margin-bottom: 16px; }
                      .mb-6 { margin-bottom: 24px; }
                      .border-b-2 { border-bottom: 2px solid black; }
                      .border-t { border-top: 1px solid black; }
                      .border-t-dashed { border-top: 1px dashed #ccc; }
                      .bg-gray-50 { background-color: #fafafa; }
                      .rounded { border-radius: 6px; }
                      .border { border: 1px solid #ddd; }
                      .p-3 { padding: 12px; }
                      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                      .font-bold { font-weight: bold; }
                      .font-black { font-weight: 900; }
                    </style>
                  </head>
                  <body>
                    \${printContent}
                    <script>
                      window.onload = function() {
                        window.print();
                        window.close();
                      }
                    </script>
                  </body>
                </html>
              `);
              printWindow.document.close();
            }}>
              <Printer size={14} /> Print Receipt
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </VStack>
  )
}
