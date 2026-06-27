import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Flex,
  Field,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { LogIn, UserPlus, Lock, User } from "lucide-react";
import { useStore } from "../store/useStore";
import { api } from "../api/api";
import { Toaster, toaster } from "../components/ui/toaster";

export default function LoginPage() {
  const { login } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toaster.create({
        title: "Validation Error",
        description: "Please fill in all fields.",
        type: "error",
      });
      return;
    }

    if (isRegister && password !== confirmPassword) {
      toaster.create({
        title: "Validation Error",
        description: "Passwords do not match.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const data = await api.register({ username, password });
        login(data.token, data.user);
        toaster.create({
          title: "Account Created",
          description: `Welcome to EzBiz, ${data.user.username}!`,
          type: "success",
        });
      } else {
        const data = await api.login({ username, password });
        login(data.token, data.user);
        toaster.create({
          title: "Login Successful",
          description: `Welcome back, ${data.user.username}!`,
          type: "success",
        });
      }
    } catch (err) {
      toaster.create({
        title: "Authentication Failed",
        description: err.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      position="relative"
      overflow="hidden"
      bg="gray.950"
      px="4"
    >
      <Toaster />
      {/* Glow Backdrops */}
      <Box
        position="absolute"
        top="-10%"
        left="-10%"
        w="50vw"
        h="50vw"
        rounded="full"
        bg="purple.800"
        filter="blur(150px)"
        opacity="0.3"
        zIndex="0"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-10%"
        w="50vw"
        h="50vw"
        rounded="full"
        bg="blue.800"
        filter="blur(150px)"
        opacity="0.3"
        zIndex="0"
      />

      {/* Login Card */}
      <Box
        position="relative"
        zIndex="1"
        w="full"
        maxW="md"
        bg="rgba(17, 24, 39, 0.65)"
        backdropFilter="blur(20px)"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.08)"
        borderRadius="2xl"
        p={{ base: 6, md: 8 }}
        boxShadow="2xl"
        transition="all 0.3s ease"
        hover={{ borderColor: "rgba(128, 90, 213, 0.3)", boxShadow: "0 0 40px rgba(128, 90, 213, 0.15)" }}
      >
        <VStack gap="6" align="stretch">
          {/* Header */}
          <VStack gap="2" textAlign="center">
            <Flex
              w="12"
              h="12"
              rounded="2xl"
              bg="purple.subtle"
              color="purple.fg"
              align="center"
              justify="center"
              mb="2"
              boxShadow="0 8px 16px rgba(128, 90, 213, 0.2)"
            >
              {isRegister ? <UserPlus size={24} /> : <LogIn size={24} />}
            </Flex>
            <Heading size="lg" fontWeight="black" tracking="tight" color="white">
              {isRegister ? "Create Enterprise Account" : "Access Operations Ledger"}
            </Heading>
            <Text fontSize="xs" color="gray.400">
              {isRegister
                ? "Register a secure admin profile to track workflows"
                : "Enter credentials to access dashboards & records"}
            </Text>
          </VStack>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack gap="4">
              <Field.Root>
                <Field.Label color="gray.300" fontSize="xs">Username</Field.Label>
                <HStack width="full" gap="0" position="relative">
                  <Box position="absolute" left="3" zIndex="2" color="gray.500">
                    <User size={16} />
                  </Box>
                  <Input
                    placeholder="Enter username"
                    pl="10"
                    bg="rgba(31, 41, 55, 0.5)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                    _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)" }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </HStack>
              </Field.Root>

              <Field.Root>
                <Field.Label color="gray.300" fontSize="xs">Password</Field.Label>
                <HStack width="full" gap="0" position="relative">
                  <Box position="absolute" left="3" zIndex="2" color="gray.500">
                    <Lock size={16} />
                  </Box>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    pl="10"
                    bg="rgba(31, 41, 55, 0.5)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                    _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </HStack>
              </Field.Root>

              {isRegister && (
                <Field.Root>
                  <Field.Label color="gray.300" fontSize="xs">Confirm Password</Field.Label>
                  <HStack width="full" gap="0" position="relative">
                    <Box position="absolute" left="3" zIndex="2" color="gray.500">
                      <Lock size={16} />
                    </Box>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      pl="10"
                      bg="rgba(31, 41, 55, 0.5)"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      color="white"
                      _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                      _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)" }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </HStack>
                </Field.Root>
              )}

              <Button
                type="submit"
                width="full"
                colorPalette="purple"
                mt="4"
                size="md"
                disabled={isLoading}
                boxShadow="0 4px 12px rgba(128, 90, 213, 0.3)"
                _hover={{ boxShadow: "0 6px 16px rgba(128, 90, 213, 0.4)" }}
              >
                {isLoading ? (
                  <Spinner size="xs" color="white" />
                ) : isRegister ? (
                  "Create Free Account"
                ) : (
                  "Access Ledger"
                )}
              </Button>
            </VStack>
          </form>

          {/* Toggle Switch */}
          <HStack justify="center" pt="2" fontSize="xs" color="gray.400">
            <Text>
              {isRegister ? "Already have an account?" : "New to EzBiz?"}
            </Text>
            <Button
              variant="link"
              colorPalette="purple"
              size="xs"
              fontWeight="bold"
              onClick={() => {
                setIsRegister(!isRegister);
                setUsername("");
                setPassword("");
                setConfirmPassword("");
              }}
              disabled={isLoading}
            >
              {isRegister ? "Sign In" : "Register Profile"}
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}
