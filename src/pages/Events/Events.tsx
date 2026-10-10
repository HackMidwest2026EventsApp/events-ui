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
import { sampleEvents } from "../../resources/EventModel";

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

export const Events = () => {
  const [eventSearch, setEventSearch] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationMessage, setLocationMessage] = useState<string>("");

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

  const filteredEvents = sampleEvents.filter((event) => {
    const search = eventSearch.toLowerCase();
    const city = citySearch.toLowerCase();

    const matchesEvent =
      event.title.toLowerCase().includes(search) ||
      event.category.toLowerCase().includes(search) ||
      event.location.toLowerCase().includes(search);

    const matchesCity = !city.trim() || event.city.toLowerCase().includes(city);

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
            {filteredEvents.length} events
          </Badge>
        </Group>

        {filteredEvents.length > 0 ? (
          <SimpleGrid
            cols={{ base: 1, xs: 2, md: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {filteredEvents.map((event) => (
              <Link to={`/${event.id}`} style={{ textDecoration: "none" }}>
                <Card
                  key={event.id}
                  withBorder
                  radius="lg"
                  padding="md"
                  shadow="sm"
                  className="event-card"
                >
                  <Card.Section>
                    <Image src={event.image} height={180} alt={event.title} />
                  </Card.Section>

                  <Stack gap="xs" mt="md">
                    <Badge variant="light" w="fit-content">
                      {event.category}
                    </Badge>

                    <Title order={3} size="h4">
                      {event.title}
                    </Title>

                    <Group gap={6}>
                      <IconCalendarEvent size={16} />
                      <Text size="sm" c="dimmed">
                        {event.date}
                      </Text>
                    </Group>

                    <Group gap={6}>
                      <IconMapPin size={16} />
                      <Text size="sm" c="dimmed">
                        {event.location}, {event.city}
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
