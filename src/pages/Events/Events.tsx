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
import { useQuery } from "@tanstack/react-query";
import type { EventModel } from "../../resources/EventModel";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_URL = import.meta.env.VITE_API;

export const Events = () => {
  const [eventSearch, setEventSearch] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationMessage, setLocationMessage] = useState<string>("");
  const [latlong, setLatLong] = useState<
    { lat: number; long: number } | undefined
  >();

  const { data } = useQuery<{ results: EventModel[] }>({
    queryKey: ["searchEvents", latlong],
    enabled: !!latlong,
    queryFn: () =>
      fetch(
        `${API_URL}api/v1/events/search?latitude=${latlong?.lat}&longitude=${latlong?.long}`,
      ).then((res) => res.json()),
  });

  console.log({ data });

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
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`,
          );

          setLatLong({ lat: coords.latitude, long: coords.longitude });

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

  const filteredEvents = data?.results.filter((event) => {
    const search = eventSearch.toLowerCase();
    const city = citySearch.toLowerCase();

    const matchesEvent =
      event.title.toLowerCase().includes(search) ||
      event.address.toLowerCase().includes(search);

    const matchesCity =
      !city.trim() ||
      event.address.toLocaleLowerCase().includes(city.toLocaleLowerCase());

    return matchesEvent && matchesCity;
  });

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
          />

          <TextInput
            size="md"
            radius="md"
            placeholder="Enter a city..."
            leftSection={<IconMapPin size={18} />}
            value={citySearch}
            onChange={(event) => setCitySearch(event.currentTarget.value)}
            rightSection={locationLoading ? <Loader size="xs" /> : null}
          />
        </SimpleGrid>

        {locationMessage && (
          <Text size="sm" c="dimmed">
            {locationMessage}
          </Text>
        )}

        <Group justify="space-between" align="center">
          <Title order={2}>Upcoming Events</Title>
          <Badge variant="light" size="lg">
            {filteredEvents?.length ?? 0} events
          </Badge>
        </Group>

        {filteredEvents && filteredEvents.length > 0 ? (
          <SimpleGrid
            cols={{ base: 1, xs: 2, md: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {filteredEvents.map((event) => (
              <Link to={`/${event.id}`} style={{ textDecoration: "none" }}>
                <Card
                  key={event.title}
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
