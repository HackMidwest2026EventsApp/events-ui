import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCheck,
  IconMapPin,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { api } from "../../resources/api";
import type { EventModel } from "../../resources/EventModel";
import type { UserLocation } from "../../resources/AccountModel";
import { goingToEvent } from "../../resources/savedEvents";
import { formatEventTime } from "../../resources/dates";

interface SearchResponse {
  total: number;
  page: number;
  has_more: boolean;
  results: EventModel[];
}

interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  token: string;
  /** The account's saved location, used as the search origin until a city is typed. */
  location?: UserLocation;
  /** provider_event_ids already on the list, so a row can say so. */
  alreadyGoing: Set<string>;
}

export const AddEventModal = ({
  opened,
  onClose,
  token,
  location,
  alreadyGoing,
}: Props) => {
  const queryClient = useQueryClient();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [query] = useDebouncedValue(what.trim(), 400);
  const [city] = useDebouncedValue(where.trim(), 500);

  const { data: geocoded, isError: geocodeFailed } = useQuery<GeocodeResult>({
    queryKey: ["geocode", city],
    enabled: city.length > 2,
    staleTime: Infinity,
    queryFn: () =>
      api<GeocodeResult>(`/api/v1/events/geocode?q=${encodeURIComponent(city)}`),
  });

  // A typed city wins over the saved one; without either there is nothing to
  // search around, since the API needs coordinates.
  const origin = city.length > 2
    ? geocoded && { lat: geocoded.latitude, lon: geocoded.longitude }
    : location && { lat: location.latitude, lon: location.longitude };

  const { data, isFetching, isError } = useQuery<SearchResponse>({
    queryKey: ["searchEvents", origin, query],
    enabled: opened && !!origin,
    placeholderData: (previous) => previous,
    queryFn: () => {
      const params = new URLSearchParams({
        latitude: String(origin!.lat),
        longitude: String(origin!.lon),
      });
      if (query) params.set("q", query);
      return api<SearchResponse>(`/api/v1/events/search?${params}`);
    },
  });

  const going = useMutation({
    mutationFn: (event: EventModel) => goingToEvent(event, token),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["savedEvents"] }),
  });

  const results = data?.results ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add an event you are going to"
      size="lg"
      radius="lg"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            radius="md"
            placeholder="Search events..."
            leftSection={<IconSearch size={16} />}
            value={what}
            onChange={(event) => setWhat(event.currentTarget.value)}
            rightSection={isFetching ? <Loader size="xs" /> : null}
          />
          <TextInput
            radius="md"
            placeholder={location ? location.label : "Enter a city..."}
            leftSection={<IconMapPin size={16} />}
            value={where}
            onChange={(event) => setWhere(event.currentTarget.value)}
          />
        </SimpleGrid>

        {geocodeFailed && (
          <Text size="sm" c="red">
            Could not find "{city}". Try another city.
          </Text>
        )}

        {!origin && !geocodeFailed && (
          <Text size="sm" c="dimmed">
            Type a city to search around — or set your location on your profile
            and it will be used by default.
          </Text>
        )}

        {isError && (
          <Text size="sm" c="red">
            Could not reach the events API.
          </Text>
        )}

        {going.isError && (
          <Alert color="red" title="Could not add that event">
            {going.error instanceof Error
              ? going.error.message
              : "Something went wrong."}
          </Alert>
        )}

        {origin && results.length === 0 && !isFetching && (
          <Text size="sm" c="dimmed">
            No events found near there.
          </Text>
        )}

        <Stack gap="xs">
          {results.map((event) => {
            const added = alreadyGoing.has(event.provider_event_id);
            const pending =
              going.isPending && going.variables?.id === event.id;

            return (
              <Group
                key={event.id}
                justify="space-between"
                wrap="nowrap"
                align="flex-start"
                gap="sm"
              >
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {event.title}
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    <Text size="xs" c="dimmed">
                      {formatEventTime(event.start_time, event.timezone)}
                    </Text>
                    {event.venue_name && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        · {event.venue_name}
                      </Text>
                    )}
                    {event.is_free && (
                      <Badge size="xs" variant="light">
                        Free
                      </Badge>
                    )}
                  </Group>
                </Stack>

                {added ? (
                  <ThemeIcon
                    variant="light"
                    color="teal"
                    radius="xl"
                    aria-label="Already on your list"
                  >
                    <IconCheck size={16} />
                  </ThemeIcon>
                ) : (
                  <ActionIcon
                    variant="light"
                    radius="xl"
                    size="lg"
                    loading={pending}
                    aria-label={`I'm going to ${event.title}`}
                    onClick={() => going.mutate(event)}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                )}
              </Group>
            );
          })}
        </Stack>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Done
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
