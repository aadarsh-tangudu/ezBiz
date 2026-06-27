import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  Table,
  SimpleGrid,
  HStack,
  VStack,
  Badge,
  Card,
  Input,
  Skeleton,
} from "@chakra-ui/react";
import { Flex } from "@chakra-ui/react";
import { Field } from "@chakra-ui/react";
import {
  Search,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import { Select } from "../components/ui/select";
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

import { useStore } from "../store/useStore";
import {
  useAddInventoryMutation,
  useAdjustStockMutation,
  useUpdateItemGradesMutation,
} from "../hooks/queries";

export default function InventoryModule() {
  const { inventory, isLoading } = useStore();
  const addInventoryMutation = useAddInventoryMutation();
  const adjustStockMutation = useAdjustStockMutation();
  const updateItemGradesMutation = useUpdateItemGradesMutation();

  const [search, setSearch] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    unit: "kg",
    lowStockAlert: 100,
  });
  const [trackByGrades, setTrackByGrades] = useState(true);
  const [initialStock, setInitialStock] = useState("0");
  const [initialCost, setInitialCost] = useState("0");
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustGrade, setAdjustGrade] = useState("A");
  const [adjustType, setAdjustType] = useState("add"); // add / deduct
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isManageGradesOpen, setIsManageGradesOpen] = useState(false);
  const [tempGrades, setTempGrades] = useState([]);
  const [selectedItemForGrades, setSelectedItemForGrades] = useState(null);

  const [newItemGrades, setNewItemGrades] = useState([
    { id: "g-init-1", name: "A", stock: "0" },
    { id: "g-init-2", name: "B", stock: "0" },
    { id: "g-init-3", name: "C", stock: "0" },
  ]);

  const handleOpenChange = (open) => {
    if (open) {
      setNewItem({ name: "", unit: "kg", lowStockAlert: 100 });
      setNewItemGrades([
        { id: "g-init-1", name: "A", stock: "0" },
        { id: "g-init-2", name: "B", stock: "0" },
        { id: "g-init-3", name: "C", stock: "0" },
      ]);
      setTrackByGrades(true);
      setInitialStock("0");
      setInitialCost("0");
    }
    setIsAddOpen(open);
  };

  const openManageGradesForItem = (item) => {
    setSelectedItemForGrades(item);
    setTempGrades(
      (item.grades || []).map((g, idx) => ({
        id: `g-${idx}-${Date.now()}`,
        name: g,
        originalName: g,
        isNew: false,
      })),
    );
    setIsManageGradesOpen(true);
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!newItem.name) return;

    let finalGrades = [];
    let initialStocks = {};
    let initialAvgCost = {};

    if (trackByGrades) {
      const trimmedGrades = newItemGrades.map((g) => g.name.trim());
      if (trimmedGrades.some((name) => !name)) {
        alert("Grade names cannot be empty.");
        return;
      }
      const unique = new Set(trimmedGrades);
      if (unique.size !== trimmedGrades.length) {
        alert("Grade names must be unique.");
        return;
      }

      newItemGrades.forEach((g) => {
        const name = g.name.trim();
        const stockVal = Number(g.stock) || 0;
        finalGrades.push(name);
        initialStocks[name] = stockVal;
        initialAvgCost[name] = 0;
      });
    } else {
      finalGrades = [];
      initialStocks[""] = Number(initialStock) || 0;
      initialAvgCost[""] = Number(initialCost) || 0;
    }

    addInventoryMutation.mutate({
      name: newItem.name,
      unit: newItem.unit,
      lowStockAlert: Number(newItem.lowStockAlert) || 50,
      hasGrades: trackByGrades,
      grades: finalGrades,
      stocks: initialStocks,
      avgCost: initialAvgCost,
    });

    setNewItem({ name: "", unit: "kg", lowStockAlert: 100 });
    setNewItemGrades([
      { id: "g-init-1", name: "A", stock: "0" },
      { id: "g-init-2", name: "B", stock: "0" },
      { id: "g-init-3", name: "C", stock: "0" },
    ]);
    setTrackByGrades(true);
    setInitialStock("0");
    setInitialCost("0");
    setIsAddOpen(false);
  };

  const handleSaveGrades = (e) => {
    e.preventDefault();
    if (!selectedItemForGrades) return;

    const trimmed = tempGrades.map((tg) => tg.name.trim());
    if (trimmed.some((name) => !name)) {
      alert("Grade names cannot be empty.");
      return;
    }
    const unique = new Set(trimmed);
    if (unique.size !== trimmed.length) {
      alert("Grade names must be unique.");
      return;
    }

    const renameMap = {};
    const newGradesList = [];

    tempGrades.forEach((tg) => {
      const finalName = tg.name.trim();
      newGradesList.push(finalName);
      if (!tg.isNew && tg.originalName && tg.originalName !== finalName) {
        renameMap[tg.originalName] = finalName;
      }
    });

    updateItemGradesMutation.mutate({
      itemId: selectedItemForGrades.id,
      newGrades: newGradesList,
      renameMap,
    });
    setIsManageGradesOpen(false);
  };

  const handleAdjustStock = (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust || !adjustAmount) return;

    const amount = Number(adjustAmount);
    const factor = adjustType === "add" ? 1 : -1;
    adjustStockMutation.mutate({
      itemId: selectedItemForAdjust.id,
      grade: adjustGrade,
      deltaQty: amount * factor,
      notes: adjustNotes,
    });

    setAdjustAmount("");
    setAdjustNotes("");
    setIsAdjustOpen(false);
  };

  const itemsList = inventory.map((i) => ({ label: i.name, value: i.id }))

  if (isLoading) {
    return (
      <VStack align="stretch" gap="6">
        {/* Top action bar skeleton */}
        <Flex justify="space-between" align="center" wrap={{ base: "wrap", sm: "nowrap" }} gap="4">
          <Skeleton h="10" w="sm" rounded="lg" />
          <Skeleton h="10" w="40" rounded="lg" />
        </Flex>

        {/* Shimmer skeleton summary cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
          <Box p="5" borderWidth="1px" rounded="2xl" bg="bg.panel">
            <Skeleton h="4" w="24" mb="3" />
            <Skeleton h="8" w="12" />
          </Box>
          <Box p="5" borderWidth="1px" rounded="2xl" bg="bg.panel">
            <Skeleton h="4" w="32" mb="3" />
            <Skeleton h="8" w="16" />
          </Box>
          <Box p="5" borderWidth="1px" rounded="2xl" bg="bg.panel">
            <Skeleton h="4" w="36" mb="3" />
            <Skeleton h="8" w="28" />
          </Box>
        </SimpleGrid>

        {/* Shimmer table skeleton */}
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
      <Flex
        justify="space-between"
        align="center"
        wrap={{ base: "wrap", sm: "nowrap" }}
        gap="4"
      >
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
            placeholder="Search stock items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="unstyled"
            size="sm"
          />
        </HStack>

        {/* Buttons */}
        <HStack gap="3">
          {/* Add Item Dialog */}
          <DialogRoot
            open={isAddOpen}
            onOpenChange={(e) => handleOpenChange(e.open)}
          >
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
                <Text display={{ base: "none", sm: "inline" }}>
                  Create Item
                </Text>
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
                onSubmit={handleCreateItem}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                }}
              >
                <DialogHeader>
                  <DialogTitle>Add New Stock Item</DialogTitle>
                </DialogHeader>
                <DialogBody
                  overflowY="auto"
                  px={{ base: 4, md: 6, lg: 8 }}
                  py={6}
                >
                  <VStack gap="4" align="stretch">
                    <Field.Root required>
                      <Field.Label>Item Name</Field.Label>
                      <Input
                        placeholder="e.g. Raw Material, Finished Goods"
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                      />
                    </Field.Root>
                    <HStack gap="4" w="full">
                      <Field.Root required flex="1">
                        <Field.Label>Measurement Unit</Field.Label>
                        <Select
                          items={["kg", "pieces", "boxes", "bags"]}
                          value={newItem.unit}
                          onChange={(e) =>
                            setNewItem({ ...newItem, unit: e.target.value })
                          }
                        />
                      </Field.Root>
                      <Field.Root flex="1">
                        <Field.Label>Low Stock Warning</Field.Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={newItem.lowStockAlert}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              lowStockAlert: e.target.value,
                            })
                          }
                        />
                      </Field.Root>
                    </HStack>

                    <Box py="2">
                      <HStack gap="2">
                        <input
                          type="checkbox"
                          id="trackByGradesCheckbox"
                          checked={trackByGrades}
                          onChange={(e) => setTrackByGrades(e.target.checked)}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <Text as="label" htmlFor="trackByGradesCheckbox" fontSize="sm" cursor="pointer" fontWeight="semibold">
                          Track stock by custom quality grades
                        </Text>
                      </HStack>
                    </Box>

                    {/* Customizable grades & initial stock section */}
                    {trackByGrades ? (
                      <Box borderTopWidth="1px" borderColor="border.subtle" pt="4" w="full">
                        <Heading size="xs" mb="3" color="purple.fg">Grades & Initial Stocks</Heading>
                        <VStack gap="3" align="stretch">
                          {newItemGrades.map((g, idx) => (
                            <HStack key={g.id} gap="2">
                              <Input
                                placeholder="Grade (e.g. W180)"
                                value={g.name}
                                onChange={(e) => {
                                  const updated = [...newItemGrades];
                                  updated[idx].name = e.target.value;
                                  setNewItemGrades(updated);
                                }}
                                required
                                flex="2"
                              />
                              <Input
                                type="number"
                                placeholder="Initial Stock"
                                value={g.stock}
                                onChange={(e) => {
                                  const updated = [...newItemGrades];
                                  updated[idx].stock = e.target.value;
                                  setNewItemGrades(updated);
                                }}
                                required
                                flex="1"
                              />
                              {newItemGrades.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  colorPalette="red"
                                  onClick={() => {
                                    setNewItemGrades(newItemGrades.filter((x) => x.id !== g.id));
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </HStack>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            colorPalette="purple"
                            onClick={() =>
                              setNewItemGrades([
                                ...newItemGrades,
                                {
                                  id: `g-new-${Date.now()}-${Math.random()}`,
                                  name: "",
                                  stock: "0",
                                },
                              ])
                            }
                          >
                            <Plus size={16} /> Add Grade
                          </Button>
                        </VStack>
                      </Box>
                    ) : (
                      <Box borderTopWidth="1px" borderColor="border.subtle" pt="4" w="full">
                        <HStack gap="4">
                          <Field.Root required flex="1">
                            <Field.Label>Initial Stock Quantity</Field.Label>
                            <Input
                              type="number"
                              placeholder="e.g. 500"
                              value={initialStock}
                              onChange={(e) => setInitialStock(e.target.value)}
                            />
                          </Field.Root>
                          <Field.Root required flex="1">
                            <Field.Label>Average Cost / Valuation</Field.Label>
                            <Input
                              type="number"
                              placeholder="e.g. 150"
                              value={initialCost}
                              onChange={(e) => setInitialCost(e.target.value)}
                            />
                          </Field.Root>
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button colorPalette="purple" type="submit">
                    Create
                  </Button>
                </DialogFooter>
                <DialogCloseTrigger />
              </form>
            </DialogContent>
          </DialogRoot>
        </HStack>
      </Flex>

      {/* Grid of stock cards */}
      {filteredInventory.length === 0 ? (
        <Card.Root variant="subtle" py="16" textAlign="center" borderColor="border.subtle" borderStyle="dashed">
          <Card.Body display="flex" flexDirection="column" alignItems="center" gap="4">
            <Box
              bg="purple.subtle"
              color="purple.fg"
              p="4"
              rounded="full"
            >
              <Scale size={32} />
            </Box>
            <VStack gap="1">
              <Heading size="md">No items right now</Heading>
              <Text color="fg.muted" fontSize="sm" maxW="sm">
                {inventory.length === 0 
                  ? "Get started by registering your first raw cashew or processed stock item."
                  : "No stock items match your search query. Try typing another name."}
              </Text>
            </VStack>
            {inventory.length === 0 && (
              <Button
                colorPalette="purple"
                size="sm"
                onClick={() => setIsAddOpen(true)}
                mt="2"
              >
                <Plus size={16} /> Create First Item
              </Button>
            )}
          </Card.Body>
        </Card.Root>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
          {filteredInventory.map((item) => {
            const hasGrades = !!item.hasGrades;
            const totalStock = hasGrades
              ? item.grades.reduce(
                  (sum, grade) => sum + (item.stocks?.[grade] || 0),
                  0,
                )
              : (item.stocks?.[""] || 0);
            const isLowStock = totalStock <= item.lowStockAlert;

            return (
              <Card.Root key={item.id} variant="elevated" overflow="hidden">
                <Card.Header pb="3">
                  <HStack justify="space-between" width="full">
                    <HStack gap="2">
                      <Box
                        bg="purple.subtle"
                        color="purple.fg"
                        p="2"
                        rounded="md"
                      >
                        <Scale size={18} />
                      </Box>
                      <VStack align="flex-start" gap="0">
                        <Heading size="sm">{item.name}</Heading>
                        <Text fontSize="xs" color="fg.muted">
                          Unit: {item.unit}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge
                      colorPalette={isLowStock ? "red" : "green"}
                      variant="solid"
                      size="md"
                      rounded="full"
                    >
                      {isLowStock ? "Low Stock" : "In Stock"}
                    </Badge>
                  </HStack>
                </Card.Header>
                <Card.Body pt="0" pb="4">
                  <VStack align="stretch" gap="3">
                    <HStack
                      justify="space-between"
                      bg="bg.muted"
                      p="3"
                      rounded="lg"
                    >
                      <Text fontSize="xs" color="fg.muted" fontWeight="bold">
                        TOTAL STOCK
                      </Text>
                      <Text fontSize="lg" fontWeight="black">
                        {totalStock.toLocaleString()} {item.unit}
                      </Text>
                    </HStack>

                    {/* Stock Grades Breakdown */}
                    {hasGrades ? (
                      <Box
                        overflowX="auto"
                        borderWidth="1px"
                        borderColor="border.default"
                        rounded="lg"
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
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>Grade</Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">
                                Stock
                              </Table.ColumnHeader>
                              <Table.ColumnHeader textAlign="right">
                                Avg Cost
                              </Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {item.grades.map((grade) => (
                              <Table.Row key={grade}>
                                <Table.Cell fontWeight="semibold">
                                  Grade {grade}
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                  {(item.stocks?.[grade] || 0).toLocaleString()}{" "}
                                  {item.unit}
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                  ₹{(item.avgCost?.[grade] || 0).toFixed(2)}
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    ) : (
                      <HStack justify="space-between" px="2" py="1" bg="bg.muted" rounded="md">
                        <Text fontSize="xs" color="fg.muted">Average Cost / Valuation:</Text>
                        <Text fontSize="xs" fontWeight="bold">
                          ₹{(item.avgCost?.[""] || 0).toFixed(2)} / {item.unit}
                        </Text>
                      </HStack>
                    )}

                    {/* Actions */}
                    <HStack justify="flex-end" pt="2" gap="2">
                      {hasGrades && (
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="purple"
                          onClick={() => openManageGradesForItem(item)}
                        >
                          <Scale size={14} /> Manage Grades
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="purple"
                        onClick={() => {
                          setSelectedItemForAdjust(item);
                          setAdjustGrade(hasGrades ? (item.grades?.[0] || "") : "");
                          setIsAdjustOpen(true);
                        }}
                      >
                        Adjust Stock
                      </Button>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </SimpleGrid>
      )}

      {/* Manage Grades Dialog */}
      <DialogRoot
        open={isManageGradesOpen}
        onOpenChange={(e) => setIsManageGradesOpen(e.open)}
      >
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
            onSubmit={handleSaveGrades}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
            }}
          >
            <DialogHeader>
              <DialogTitle>
                Manage Stock Grades: {selectedItemForGrades?.name}
              </DialogTitle>
            </DialogHeader>
            <DialogBody
              overflowY="auto"
              px={{ base: 4, md: 6, lg: 8 }}
              py={6}
            >
              <VStack gap="4" align="stretch">
                <Text fontSize="xs" color="fg.muted">
                  Configure stock grades for this item. Renaming a grade will
                  update existing stocks and costs.
                </Text>
                {tempGrades.map((tg, idx) => (
                  <HStack key={tg.id} gap="2">
                    <Input
                      placeholder="e.g. W180"
                      value={tg.name}
                      onChange={(e) => {
                        const updated = [...tempGrades];
                        updated[idx].name = e.target.value;
                        setTempGrades(updated);
                      }}
                      required
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => {
                        setTempGrades(tempGrades.filter((g) => g.id !== tg.id));
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </HStack>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  colorPalette="purple"
                  onClick={() =>
                    setTempGrades([
                      ...tempGrades,
                      {
                        id: `g-new-${Date.now()}-${Math.random()}`,
                        name: "",
                        originalName: "",
                        isNew: true,
                      },
                    ])
                  }
                >
                  <Plus size={16} /> Add New Grade
                </Button>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManageGradesOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" colorPalette="purple">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Adjust Stock Dialog */}
      <DialogRoot
        open={isAdjustOpen}
        onOpenChange={(e) => setIsAdjustOpen(e.open)}
      >
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
            onSubmit={handleAdjustStock}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
            }}
          >
            <DialogHeader>
              <DialogTitle>
                Adjust Stock: {selectedItemForAdjust?.name}
              </DialogTitle>
            </DialogHeader>
            <DialogBody
              overflowY="auto"
              px={{ base: 4, md: 6, lg: 8 }}
              py={6}
            >
              <VStack gap="4" align="stretch">
                {selectedItemForAdjust?.hasGrades && selectedItemForAdjust?.grades && selectedItemForAdjust.grades.length > 0 && (
                  <Field.Root required>
                    <Field.Label>Grade / Quality</Field.Label>
                    <Select
                      items={selectedItemForAdjust.grades}
                      value={adjustGrade}
                      onChange={(e) => setAdjustGrade(e.target.value)}
                    />
                  </Field.Root>
                )}
                <Field.Root required>
                  <Field.Label>Adjustment Type</Field.Label>
                  <Select
                    items={[
                      { label: "Increase (+)", value: "add" },
                      { label: "Decrease (-)", value: "deduct" },
                    ]}
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>
                    Quantity ({selectedItemForAdjust?.unit})
                  </Field.Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Notes / Reason</Field.Label>
                  <Input
                    placeholder="e.g. wastage audit, correction"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                  />
                </Field.Root>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAdjustOpen(false)}>
                Cancel
              </Button>
              <Button colorPalette="purple" type="submit">
                Submit Adjustment
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}
