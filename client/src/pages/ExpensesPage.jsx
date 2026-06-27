import React, { useState, useEffect } from "react";
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
  Skeleton,
} from "@chakra-ui/react";
import { Field } from "@chakra-ui/react";
import { Search, Plus, Calendar, CreditCard, FileText, Download, Trash2 } from "lucide-react";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "../components/ui/dialog";
import { Select } from "../components/ui/select";

import { useStore } from "../store/useStore";
import {
  useAddExpenseMutation,
  useUpdateExpenseFilesMutation,
} from "../hooks/queries";

export default function ExpensesModule() {
  const { expenses, isLoading } = useStore();
  const addExpenseMutation = useAddExpenseMutation();
  const updateExpenseFilesMutation = useUpdateExpenseFilesMutation();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Utility"); // Utility / Admin / Transport / Other
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState("");

  // File upload handler
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileObj = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result,
      };
      updateExpenseFilesMutation.mutate({ expenseId: selectedExpense.id, fileType, fileData: fileObj });
      setSelectedExpense((prev) => ({ ...prev, [fileType]: fileObj }));
    };
    reader.readAsDataURL(file);
  };

  // File remove handler
  const handleRemoveFile = (fileType) => {
    updateExpenseFilesMutation.mutate({ expenseId: selectedExpense.id, fileType, fileData: null });
    setSelectedExpense((prev) => ({ ...prev, [fileType]: null }));
  };

  // File download helper
  const downloadFile = (file) => {
    if (file && file.fileId) {
      window.open(`/api/attachments/${file.fileId}`, "_blank");
      return;
    }
    const fileContent = file.data || "Mock File Content for " + file.name;
    const blob = new Blob([fileContent], { type: file.type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    addExpenseMutation.mutate({
      name,
      amount: Number(amount),
      category,
      date,
      notes,
    });

    setName("");
    setAmount("");
    setNotes("");
    setIsOpen(false);
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case "Utility":
        return "blue";
      case "Transport":
        return "orange";
      case "Rent":
        return "cyan";
      case "Admin":
        return "purple";
      default:
        return "gray";
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  );

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
        <HStack
          maxW="sm"
          w="full"
          bg="bg.muted"
          px="3"
          py="2"
          rounded="lg"
          borderWidth="1px"
          borderColor="border.default"
        >
          <Search size={16} color="gray" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="unstyled"
            size="sm"
          />
        </HStack>

        {/* Add Expense Dialog */}
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
              <Text display={{ base: "none", sm: "inline" }}>Log Expense</Text>
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
              onSubmit={handleAddExpense}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              <DialogHeader>
                <DialogTitle>Log Operating Expense</DialogTitle>
              </DialogHeader>
              <DialogBody
                overflowY="auto"
                px={{ base: 4, md: 6, lg: 8 }}
                py={6}
              >
                <VStack gap="4" align="stretch">
                  <Field.Root required>
                    <Field.Label>Expense Name / Description</Field.Label>
                    <Input
                      placeholder="e.g. Factory Electricity Bill, Diesel for Generator"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field.Root>

                  <HStack gap="4">
                    <Field.Root required flex="1">
                      <Field.Label>Amount (₹)</Field.Label>
                      <Input
                        type="number"
                        placeholder="e.g. 4500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root required flex="1">
                      <Field.Label>Category</Field.Label>
                      <Select
                        items={[
                          "Utility",
                          "Transport",
                          "Rent",
                          "Admin",
                          "Other",
                        ]}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    </Field.Root>
                  </HStack>

                  <Field.Root required>
                    <Field.Label>Date</Field.Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Notes</Field.Label>
                    <Input
                      placeholder="Additional remarks..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Field.Root>
                </VStack>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button colorPalette="purple" type="submit">
                  Log Transaction
                </Button>
              </DialogFooter>
              <DialogCloseTrigger />
            </form>
          </DialogContent>
        </DialogRoot>
      </Flex>

      {/* Expenses Table */}
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
              <Table.ColumnHeader>Expense ID</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Description</Table.ColumnHeader>
              <Table.ColumnHeader>Category</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Amount</Table.ColumnHeader>
              <Table.ColumnHeader>Notes</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredExpenses.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} textAlign="center" py="8">
                  No expenses recorded yet. Click "Log Expense" to add one.
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredExpenses.map((expense) => (
                <Table.Row
                  key={expense.id}
                  onClick={() => setSelectedExpense(expense)}
                  cursor="pointer"
                  hover={{ bg: "bg.muted" }}
                >
                  <Table.Cell
                    fontFamily="mono"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    #{expense.id.substring(0, 6)}
                  </Table.Cell>
                  <Table.Cell fontSize="xs">{expense.date}</Table.Cell>
                  <Table.Cell fontWeight="semibold" fontSize="xs">
                    {expense.name}
                  </Table.Cell>
                  <Table.Cell fontSize="xs">
                    <Badge
                      variant="solid"
                      colorPalette={getCategoryBadgeColor(expense.category)}
                    >
                      {expense.category}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell
                    textAlign="right"
                    fontWeight="bold"
                    fontSize="xs"
                    color="red.fg"
                  >
                    ₹{expense.amount.toLocaleString()}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" color="fg.muted">
                    {expense.notes || "—"}
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Expense Details Dialog */}
      <DialogRoot open={!!selectedExpense} onOpenChange={(e) => { if (!e.open) setSelectedExpense(null) }}>
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
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          <DialogBody
            overflowY="auto"
            px={{ base: 4, md: 6, lg: 8 }}
            py={6}
          >
            {selectedExpense && (
              <VStack align="stretch" gap="6">
                {/* General Expense Info */}
                <Box bg="bg.muted" p="4" rounded="lg" borderWidth="1px" borderColor="border.subtle">
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 2 }} gap="4">
                    <HStack justify="space-between">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">EXPENSE ID</Text>
                      <Text fontSize="xs" fontFamily="mono" fontWeight="semibold">#{selectedExpense.id}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">DATE</Text>
                      <Text fontSize="xs" fontWeight="semibold">
                        {new Date(selectedExpense.date).toLocaleDateString([], { dateStyle: "long" })}
                      </Text>
                    </HStack>
                  </SimpleGrid>
                </Box>

                {/* Expense Profile */}
                <Box>
                  <Heading size="xs" mb="2" color="purple.fg">Expense Profile</Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4" bg="bg.muted" p="3" rounded="lg">
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">DESCRIPTION / NAME</Text>
                      <Text fontSize="xs" fontWeight="bold">{selectedExpense.name}</Text>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">CATEGORY</Text>
                      <Badge
                        variant="solid"
                        colorPalette={getCategoryBadgeColor(selectedExpense.category)}
                        size="sm"
                        mt="1"
                      >
                        {selectedExpense.category}
                      </Badge>
                    </VStack>
                    <VStack align="flex-start" gap="0">
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">AMOUNT</Text>
                      <Text fontSize="xs" fontWeight="bold" color="red.fg">₹{selectedExpense.amount.toLocaleString()}</Text>
                    </VStack>
                  </SimpleGrid>
                </Box>

                {selectedExpense.notes && (
                  <VStack align="flex-start" gap="1" borderTopWidth="1px" borderColor="border.subtle" pt="3">
                    <Text fontSize="2xs" color="fg.muted" fontWeight="bold">REMARKS / NOTES</Text>
                    <Text fontSize="xs" bg="bg.muted" p="2" rounded="md" width="full" fontStyle="italic">
                      "{selectedExpense.notes}"
                    </Text>
                  </VStack>
                )}

                {/* Document Attachments Manager */}
                <Box borderTopWidth="1px" borderColor="border.subtle" pt="4">
                  <Heading size="xs" mb="3" color="purple.fg">Document Attachments</Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 2 }} gap="4">
                    {/* Tax Invoice / Voucher Attachment */}
                    <Box p="3" borderWidth="1px" borderColor="border.subtle" rounded="lg" bg="bg.muted">
                      <HStack gap="2" mb="2">
                        <FileText size={16} color="var(--chakra-colors-purple-500)" />
                        <Text fontSize="xs" fontWeight="bold">Tax Invoice / Voucher</Text>
                      </HStack>
                      {selectedExpense.billFile ? (
                        <VStack align="stretch" gap="2">
                          <Box bg="bg.default" p="2" rounded="md" borderWidth="1px" borderColor="border.subtle">
                            <Text fontSize="2xs" fontWeight="semibold" truncate>{selectedExpense.billFile.name}</Text>
                            <Text fontSize="3xs" color="fg.muted">{(selectedExpense.billFile.size / 1024).toFixed(1)} KB</Text>
                          </Box>
                          <HStack gap="2">
                            <Button size="xs" variant="outline" flex="1" gap="1" onClick={() => downloadFile(selectedExpense.billFile)}>
                              <Download size={12} /> Download
                            </Button>
                            <Button size="xs" colorPalette="red" variant="ghost" gap="1" onClick={() => handleRemoveFile("billFile")}>
                              <Trash2 size={12} /> Remove
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box border="1px dashed" borderColor="border.default" p="4" rounded="md" textAlign="center" bg="bg.default">
                          <Text fontSize="3xs" mb="2" color="fg.muted">No voucher file attached</Text>
                          <Input type="file" display="none" id="expense-bill-upload" onChange={(e) => handleFileUpload(e, "billFile")} />
                          <Button as="label" htmlFor="expense-bill-upload" size="xs" variant="outline" cursor="pointer">
                            Upload File
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {/* Receipt / Proof of Payment Attachment */}
                    <Box p="3" borderWidth="1px" borderColor="border.subtle" rounded="lg" bg="bg.muted">
                      <HStack gap="2" mb="2">
                        <FileText size={16} color="var(--chakra-colors-teal-500)" />
                        <Text fontSize="xs" fontWeight="bold">Receipt / Proof of Payment</Text>
                      </HStack>
                      {selectedExpense.receiptFile ? (
                        <VStack align="stretch" gap="2">
                          <Box bg="bg.default" p="2" rounded="md" borderWidth="1px" borderColor="border.subtle">
                            <Text fontSize="2xs" fontWeight="semibold" truncate>{selectedExpense.receiptFile.name}</Text>
                            <Text fontSize="3xs" color="fg.muted">{(selectedExpense.receiptFile.size / 1024).toFixed(1)} KB</Text>
                          </Box>
                          <HStack gap="2">
                            <Button size="xs" variant="outline" flex="1" gap="1" onClick={() => downloadFile(selectedExpense.receiptFile)}>
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
                          <Input type="file" display="none" id="expense-receipt-upload" onChange={(e) => handleFileUpload(e, "receiptFile")} />
                          <Button as="label" htmlFor="expense-receipt-upload" size="xs" variant="outline" cursor="pointer">
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
            <Button variant="outline" size="sm" onClick={() => setSelectedExpense(null)}>Close</Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}
