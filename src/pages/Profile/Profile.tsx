import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconCalendarPlus,
  IconExternalLink,
  IconMapPin,
  IconSparkles,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "../../resources/api";
import type {
  SavedEvent,
  UserLocation,
} from "../../resources/AccountModel";
import { useAuth } from "../../resources/auth";
import { listSavedEvents, providerUrl } from "../../resources/savedEvents";
import { formatEventTime, hasEnded } from "../../resources/dates";
import { UserAvatar } from "../../components/UserAvatar";
import { SignInRequired } from "../../components/Layout";
import { AddEventModal } from "./AddEventModal";
import { WardrobeCard } from "./WardrobeCard";

const LocationCard = ({ token }: { token: string }) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: location, isPending } = useQuery<UserLocation | null>({
    queryKey: ["location", token],
    queryFn: async () => {
      try {
        return await api<UserLocation>("/api/v1/auth/me/location", { token });
      } catch (error) {
        // A new account has no location. That is a normal state, not a failure.
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });

  const save = useMutation({
    mutationFn: (q: string) =>
      api<UserLocation>("/api/v1/auth/me/location", {
        method: "PUT",
        // `q` is geocoded server-side, so the user types a place, not numbers.
        body: { q },
        token,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["location", token], saved);
      setDraft("");
      // Event search falls back to this location when no city is given.
      void queryClient.invalidateQueries({ queryKey: ["searchEvents"] });
    },
  });

  return (
    <Card withBorder radius="lg" padding="lg">
      <Group gap="xs" mb="sm">
        <IconMapPin size={20} />
        <Title order={4}>Home location</Title>
      </Group>

      {isPending ? (
        <Loader size="sm" />
      ) : (
        <Stack gap="sm">
          <Text size="sm" c={location ? undefined : "dimmed"}>
            {location
              ? location.label
              : "Not set. Events are searched around here by default."}
          </Text>

          <Group gap="xs" wrap="nowrap" align="flex-start">
            <TextInput
              flex={1}
              radius="md"
              placeholder="Kansas City, MO"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && draft.trim()) save.mutate(draft.trim());
              }}
              error={
                save.isError
                  ? save.error instanceof Error
                    ? save.error.message
                    : "Could not save"
                  : undefined
              }
            />
            <Button
              radius="md"
              loading={save.isPending}
              disabled={!draft.trim()}
              onClick={() => save.mutate(draft.trim())}
            >
              {location ? "Update" : "Set"}
            </Button>
          </Group>
        </Stack>
      )}
    </Card>
  );
};

const GoingRow = ({ event }: { event: SavedEvent }) => {
  const url = providerUrl(event);
  const past = hasEnded(event.end_time);

  return (
    <Group justify="space-between" wrap="nowrap" align="flex-start" py={6}>
      <Stack gap={2} style={{ minWidth: 0 }}>
        <Group gap="xs" wrap="nowrap">
          <Text fw={600} lineClamp={1}>
            {event.title}
          </Text>
          {past && (
            <Badge size="xs" color="gray" variant="light">
              Over
            </Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          {formatEventTime(event.start_time, event.timezone)}
          {event.venue_name ? ` · ${event.venue_name}` : ""}
        </Text>
      </Stack>

      {url && (
        <Tooltip label="Open on Eventbrite">
          <ActionIcon
            component="a"
            href={url}
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            radius="xl"
            aria-label={`Open ${event.title} on Eventbrite`}
          >
            <IconExternalLink size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};

export const Profile = () => {
  const { user, token, isLoading } = useAuth();
  const [addOpen, addHandlers] = useDisclosure(false);

  const { data: savedEvents, isPending: eventsPending, isError } = useQuery<SavedEvent[]>({
    queryKey: ["savedEvents", token],
    enabled: token !== null,
    queryFn: () => listSavedEvents(token!),
  });

  const { data: location } = useQuery<UserLocation | null>({
    queryKey: ["location", token],
    enabled: token !== null,
    queryFn: async () => {
      try {
        return await api<UserLocation>("/api/v1/auth/me/location", { token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  if (!user || !token) return <SignInRequired what="keep your event list" />;

  const events = savedEvents ?? [];
  // The backend keeps an event for a day past its end, so "over" rows do show
  // up; sort them below everything still to come.
  const upcoming = events.filter((event) => !hasEnded(event.end_time));
  const over = events.filter((event) => hasEnded(event.end_time));
  const alreadyGoing = new Set(events.map((event) => event.provider_event_id));

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Card withBorder radius="lg" padding="xl">
          <Group gap="xl" wrap="wrap">
            <UserAvatar email={user.email} size={110} />

            <Stack gap={6} style={{ minWidth: 0 }} flex={1}>
              <Title order={1} size="h2" style={{ wordBreak: "break-word" }}>
                {user.email}
              </Title>
              <Group gap="xs">
                <Badge variant="light" leftSection={<IconSparkles size={12} />}>
                  {user.plan} plan
                </Badge>
                <Badge variant="light" color="teal">
                  {upcoming.length} upcoming
                </Badge>
              </Group>

              <Stack gap={2} mt="xs" maw={320}>
                <Text size="xs" c="dimmed">
                  Outfit recommendations today: {user.used_today} of{" "}
                  {user.daily_llm_limit}
                </Text>
                <Progress
                  value={(user.used_today / user.daily_llm_limit) * 100}
                  size="sm"
                  radius="xl"
                  color={user.remaining === 0 ? "red" : "blue"}
                />
              </Stack>
            </Stack>
          </Group>
        </Card>

        <Group grow align="stretch" wrap="wrap">
          <LocationCard token={token} />
          <WardrobeCard token={token} />
        </Group>

        <Card withBorder radius="lg" padding="lg">
          <Group justify="space-between" mb="sm" wrap="wrap" gap="xs">
            <Group gap="xs">
              <IconCalendarEvent size={20} />
              <Title order={3} size="h4">
                Events I'm going to
              </Title>
            </Group>
            <Button
              leftSection={<IconCalendarPlus size={16} />}
              radius="md"
              onClick={addHandlers.open}
            >
              Add event
            </Button>
          </Group>

          {isError && (
            <Alert color="red" title="Could not load your events">
              The API did not answer. Try again in a moment.
            </Alert>
          )}

          {eventsPending ? (
            <Loader size="sm" />
          ) : events.length === 0 ? (
            <Stack gap={4} py="md">
              <Text c="dimmed">Nothing on the list yet.</Text>
              <Text size="sm" c="dimmed">
                Add one here, or press "I'm going" on any event you open from{" "}
                <Anchor component={Link} to="/" size="sm">
                  Discover
                </Anchor>
                .
              </Text>
            </Stack>
          ) : (
            <Stack gap={0}>
              {upcoming.map((event) => (
                <GoingRow key={event.id} event={event} />
              ))}

              {over.length > 0 && (
                <>
                  <Divider my="sm" label="Already happened" labelPosition="center" />
                  {over.map((event) => (
                    <GoingRow key={event.id} event={event} />
                  ))}
                </>
              )}
            </Stack>
          )}
        </Card>
      </Stack>

      <AddEventModal
        opened={addOpen}
        onClose={addHandlers.close}
        token={token}
        location={location ?? undefined}
        alreadyGoing={alreadyGoing}
      />
    </Container>
  );
};

export default Profile;
