import { useState } from "react";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../resources/auth";

/** The API's own rule (RegisterRequest.password has min_length=6). */
const MIN_PASSWORD = 6;

const AuthForm = ({ mode }: { mode: "login" | "register" }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const registering = mode === "register";

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "", password: "" },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : "Enter an email address"),
      password: (value) =>
        registering && value.length < MIN_PASSWORD
          ? `At least ${MIN_PASSWORD} characters`
          : null,
    },
  });

  const submit = form.onSubmit(async ({ email, password }) => {
    setError(null);
    setBusy(true);
    try {
      await (registering ? signUp(email, password) : signIn(email, password));
      void navigate("/profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  });

  return (
    <Container size={420} py={60}>
      <Title order={1} ta="center">
        {registering ? "Create an account" : "Welcome back"}
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={6}>
        {registering
          ? "An account keeps the events you are going to in one place."
          : "Sign in to see the events you are going to."}
      </Text>

      <Paper withBorder shadow="sm" radius="lg" p="xl" mt="xl">
        <form onSubmit={submit}>
          <Stack>
            {error && (
              <Alert color="red" title={registering ? "Could not register" : "Could not sign in"}>
                {error}
              </Alert>
            )}

            <TextInput
              required
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              key={form.key("email")}
              {...form.getInputProps("email")}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              autoComplete={registering ? "new-password" : "current-password"}
              description={registering ? `At least ${MIN_PASSWORD} characters` : undefined}
              key={form.key("password")}
              {...form.getInputProps("password")}
            />

            <Button type="submit" loading={busy} fullWidth mt="xs">
              {registering ? "Create account" : "Sign in"}
            </Button>

            <Text size="sm" c="dimmed" ta="center">
              {registering ? "Already have an account? " : "No account yet? "}
              <Anchor component={Link} to={registering ? "/login" : "/register"} size="sm">
                {registering ? "Sign in" : "Create one"}
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>

      <Text size="xs" c="dimmed" ta="center" mt="lg">
        Signing in is optional — event search and outfit advice work without it.
      </Text>
    </Container>
  );
};

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
