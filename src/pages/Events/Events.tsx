import { useEffect, useState } from "react";
import {
  Card,
  Text,
  TextInput,
  Button,
  Badge,
  Group,
  Stack,
  Image,
  SimpleGrid,
  Container,
  Title,
  Center,
  Loader,
} from "@mantine/core";
import { IconSearch, IconMapPin, IconCalendarEvent } from "@tabler/icons-react";
import { Link } from "react-router";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import type { EventModel } from "../../resources/EventModel";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_URL = import.meta.env.VITE_API;

interface EventSearchResponse {
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

/** Fields worth matching on. All of them are nullable for online events. */
const haystackOf = (event: EventModel) =>
  [event.title, event.summary, event.venue_name, event.address]
    .filter((field): field is string => !!field)
    .join(" ")
    .toLowerCase();

export const Events = () => {
  const [eventSearch, setEventSearch] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationMessage, setLocationMessage] = useState<string>("");
  const [cityEdited, setCityEdited] = useState<boolean>(false);
  const [coords, setCoords] = useState<
    { lat: number; long: number } | undefined
  >();

  const [query] = useDebouncedValue(eventSearch.trim(), 400);
  const [cityQuery] = useDebouncedValue(citySearch.trim(), 500);

  // A hand-typed city moves the search origin rather than filtering text: the
  // API already did the geographic work, so re-filtering its output by city
  // name would throw away nearby suburbs that are inside the radius. The
  // backend geocodes via Nominatim, so this costs no Google key.
  const { data: geocoded, isError: geocodeFailed } = useQuery<GeocodeResult>({
    queryKey: ["geocode", cityQuery],
    enabled: cityEdited && cityQuery.length > 2,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}api/v1/events/geocode?q=${encodeURIComponent(cityQuery)}`,
      );
      if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
      return res.json();
    },
  });

  const origin = cityEdited
    ? geocoded && { lat: geocoded.latitude, long: geocoded.longitude }
    : coords;

  // q goes to the server. Without it only the first 20 of several hundred
  // events ever reach the browser, so searching locally could never find
  // anything that was not already on screen.
  const { data, isFetching, isError } = useQuery<EventSearchResponse>({
    queryKey: ["searchEvents", origin, query],
    enabled: !!origin,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(origin!.lat),
        longitude: String(origin!.long),
      });
      if (query) params.set("q", query);

      const res = await fetch(`${API_URL}api/v1/events/search?${params}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      return res.json();
    },
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setTimeout(() => {
        setLocationMessage("Location unavailable. Enter a city.");
        setLocationLoading(false);
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Before the Google call, not after: reverse geocoding only supplies
          // the label for the city box, and an outage there must not stop the
          // search from running on the coordinates we already have.
          setCoords({ lat: coords.latitude, long: coords.longitude });

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`,
          );

          const data: {
            status: string;
            results: {
              address_components: {
                long_name: string;
                short_name: string;
                types: string[];
              }[];
            }[];
          } = await response.json();

          if (data.status === "OK" && data.results.length > 0) {
            const components = data.results[0].address_components;

            const cityComponent = components.find((component) =>
              component.types.includes("locality"),
            );

            const regionComponent = components.find((component) =>
              component.types.includes("administrative_area_level_1"),
            );

            if (cityComponent) {
              setCitySearch(
                regionComponent
                  ? `${cityComponent.long_name}, ${regionComponent.short_name}`
                  : cityComponent.long_name,
              );
            } else {
              setLocationMessage("Enter a city to find events.");
            }
          } else {
            setLocationMessage("Enter a city to find events.");
          }
        } catch (error) {
          console.error("Could not determine city:", error);
          setLocationMessage("Enter a city to find events.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationMessage("Location permission denied. Enter a city.");
        setLocationLoading(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const results = data?.results ?? [];

  // Eventbrite ranks by relevance instead of filtering, so q= returns the whole
  // radius with the matches on top. Narrow the page it gave us, or a query that
  // matched nothing would render as a grid of unrelated events.
  const needle = query.toLowerCase();
  const filteredEvents = needle
    ? results.filter((event) => haystackOf(event).includes(needle))
    : results;

  const hiddenByPaging = data ? data.total - results.length : 0;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <header>
          <Group gap="xs" mb={4}>
            <IconCalendarEvent size={32} />
            <Title order={1}>Discover Events</Title>
          </Group>
          <Text c="dimmed">
            Find things to do, people to meet, and places to explore.
          </Text>
        </header>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            size="md"
            radius="md"
            placeholder="Search events, music, food..."
            leftSection={<IconSearch size={18} />}
            value={eventSearch}
            onChange={(event) => setEventSearch(event.currentTarget.value)}
            rightSection={isFetching ? <Loader size="xs" /> : null}
          />

          <TextInput
            size="md"
            radius="md"
            placeholder="Enter a city..."
            leftSection={<IconMapPin size={18} />}
            value={citySearch}
            onChange={(event) => {
              setCitySearch(event.currentTarget.value);
              setCityEdited(true);
            }}
            rightSection={locationLoading ? <Loader size="xs" /> : null}
          />
        </SimpleGrid>

        {locationMessage && (
          <Text size="sm" c="dimmed">
            {locationMessage}
          </Text>
        )}

        {geocodeFailed && (
          <Text size="sm" c="red">
            Could not find "{cityQuery}". Try another city.
          </Text>
        )}

        {isError && (
          <Text size="sm" c="red">
            Could not reach the events API. Check that it is running.
          </Text>
        )}

        <Group justify="space-between" align="center">
          <Title order={2}>Upcoming Events</Title>
          <Badge variant="light" size="lg">
            {filteredEvents.length} of {data?.total ?? 0} events
          </Badge>
        </Group>

        {hiddenByPaging > 0 && (
          <Text size="sm" c="dimmed">
            Showing the {results.length} best matches. {hiddenByPaging} more
            events are within range — narrow the search to find them.
          </Text>
        )}

        {filteredEvents.length > 0 ? (
          <SimpleGrid
            cols={{ base: 1, xs: 2, md: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                to={`/${event.id}`}
                style={{ textDecoration: "none" }}
              >
                <Card
                  withBorder
                  radius="lg"
                  padding="md"
                  shadow="sm"
                  className="event-card"
                >
                  <Card.Section>
                    <Image
                      src={event.image_url}
                      height={180}
                      alt={event.title}
                    />
                  </Card.Section>

                  <Stack gap="xs" mt="md">
                    <Title order={3} size="h4">
                      {event.title}
                    </Title>

                    <Group gap={6}>
                      <IconCalendarEvent size={16} />
                      <Text size="sm" c="dimmed">
                        {event.start_time}
                      </Text>
                    </Group>

                    <Group gap={6}>
                      <IconMapPin size={16} />
                      <Text size="sm" c="dimmed">
                        {event.address}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        ) : (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconSearch size={36} />
              <Title order={3}>No events found</Title>
              <Text c="dimmed" ta="center">
                Try another event name or city.
              </Text>
              <Button
                variant="subtle"
                onClick={() => {
                  setEventSearch("");
                  setCitySearch("");
                  setCityEdited(false);
                }}
              >
                Clear filters
              </Button>
            </Stack>
          </Center>
        )}
      </Stack>
    </Container>
  );
};

export default Events;
