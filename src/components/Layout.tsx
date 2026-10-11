import {
  ActionIcon,
  AppShell,
  Button,
  Group,
  Stack,
  Menu,
  Text,
  Title,
  UnstyledButton,
  Box,
} from "@mantine/core";
import {
  IconCompass,
  IconLogin,
  IconLogout,
  IconUserCircle,
  IconUserPlus,
} from "@tabler/icons-react";
import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "../resources/auth";
import { UserAvatar } from "./UserAvatar";

/** The header the circular profile icon lives in, wrapped around every page. */
export const Layout = () => {
  const { user, token, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell header={{ height: 64 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <UnstyledButton component={Link} to="/" aria-label="All events">
            <Box display="flex" style={{ alignItems: "center" }}>
              <IconCompass size={26} />
              <Text size="xl" fw="bolder" component="span" ml="sm">
                Event Compass
              </Text>
            </Box>
          </UnstyledButton>

          <Menu position="bottom-end" width={220} withArrow>
            <Menu.Target>
              <ActionIcon
                variant="transparent"
                size={44}
                radius="xl"
                aria-label={user ? "Your profile" : "Sign in"}
              >
                <UserAvatar email={user?.email} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {user ? (
                <>
                  <Menu.Label>
                    <Text size="xs" truncate>
                      {user.email}
                    </Text>
                  </Menu.Label>
                  <Menu.Item
                    leftSection={<IconUserCircle size={16} />}
                    component={Link}
                    to="/profile"
                  >
                    My profile
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={() => {
                      signOut();
                      void navigate("/");
                    }}
                  >
                    Sign out
                  </Menu.Item>
                </>
              ) : (
                <>
                  <Menu.Label>
                    {token ? "Signing in..." : "Browsing as a guest"}
                  </Menu.Label>
                  <Menu.Item
                    leftSection={<IconLogin size={16} />}
                    component={Link}
                    to="/login"
                  >
                    Sign in
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconUserPlus size={16} />}
                    component={Link}
                    to="/register"
                  >
                    Create an account
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

/** Shown in place of a page that needs an account. */
export const SignInRequired = ({ what }: { what: string }) => (
  <Group justify="center" py={80} px="md">
    <Stack gap="md" align="center">
      <UserAvatar size={84} />
      <Title order={2}>Sign in to {what}</Title>
      <Text c="dimmed" ta="center" maw={420}>
        Browsing events and outfit advice needs no account. Keeping a list of
        the events you are going to does.
      </Text>
      <Group>
        <Button component={Link} to="/login">
          Sign in
        </Button>
        <Button component={Link} to="/register" variant="light">
          Create an account
        </Button>
      </Group>
    </Stack>
  </Group>
);
