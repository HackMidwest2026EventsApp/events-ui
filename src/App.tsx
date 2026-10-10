
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
import {
  IconSearch,
  IconMapPin,
  IconCalendarEvent,
} from "@tabler/icons-react";
import "./App.css";

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

interface Event {
  id: number;
  title: string;
  city: string;
  category: string;
  date: string;
  location: string;
  image: string;
}

const sampleEvents: Event[] = [
  {
    id: 1,
    title: "Live Music Night",
    city: "Omaha",
    category: "Music",
    date: "Oct 15, 2026",
    location: "The Slowdown",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600",
  },
  {
    id: 2,
    title: "Local Art Exhibition",
    city: "Omaha",
    category: "Art",
    date: "Oct 17, 2026",
    location: "Joslyn Art Museum",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
  },
  {
    id: 3,
    title: "Food Truck Festival",
    city: "Kansas City",
    category: "Food",
    date: "Oct 18, 2026",
    location: "City Market",
    image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=600",
  },
  {
    id: 4,
    title: "Community 5K Run",
    city: "Omaha",
    category: "Fitness",
    date: "Oct 20, 2026",
    location: "Memorial Park",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600",
  },
  {
    id: 5,
    title: "Outdoor Movie Night",
    city: "Kansas City",
    category: "Entertainment",
    date: "Oct 21, 2026",
    location: "Crown Center",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600",
  },
  {
    id: 6,
    title: "Tech Networking Meetup",
    city: "Omaha",
    category: "Technology",
    date: "Oct 22, 2026",
    location: "Innovation Campus",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600",
  },
  {
    id: 7,
    title: "Farmers Market",
    city: "Kansas City",
    category: "Community",
    date: "Oct 24, 2026",
    location: "River Market",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600",
  },
  {
    id: 8,
    title: "Stand-Up Comedy",
    city: "Omaha",
    category: "Comedy",
    date: "Oct 25, 2026",
    location: "Funny Bone",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600",
  },
  {
    id: 9,
    title: "Photography Workshop",
    city: "Kansas City",
    category: "Workshop",
    date: "Oct 26, 2026",
    location: "Crossroads Arts District",
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600",
  },
];

function App() {
  const [eventSearch, setEventSearch] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationMessage, setLocationMessage] = useState<string>("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Location unavailable. Enter a city.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
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
              component.types.includes("locality")
            );

            const regionComponent = components.find((component) =>
              component.types.includes("administrative_area_level_1")
            );

            if (cityComponent) {
              setCitySearch(
                regionComponent
                  ? `${cityComponent.long_name}, ${regionComponent.short_name}`
                  : cityComponent.long_name
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
      { timeout: 10000 }
    );
  }, []);

  const filteredEvents = sampleEvents.filter((event) => {
    const search = eventSearch.toLowerCase();
    const city = citySearch.toLowerCase();

    const matchesEvent =
      event.title.toLowerCase().includes(search) ||
      event.category.toLowerCase().includes(search) ||
      event.location.toLowerCase().includes(search);

    const matchesCity =
      !city.trim() ||
      event.city.toLowerCase().includes(city);

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
            onChange={(event) =>
              setEventSearch(event.currentTarget.value)
            }
          />

          <TextInput
            size="md"
            radius="md"
            placeholder="Enter a city..."
            leftSection={<IconMapPin size={18} />}
            value={citySearch}
            onChange={(event) =>
              setCitySearch(event.currentTarget.value)
            }
            rightSection={
              locationLoading ? <Loader size="xs" /> : null
            }
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
              <Card
                key={event.id}
                withBorder
                radius="lg"
                padding="md"
                shadow="sm"
                className="event-card"
              >
                <Card.Section>
                  <Image
                    src={event.image}
                    height={180}
                    alt={event.title}
                  />
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

                  <Button
                    variant="light"
                    fullWidth
                    mt="xs"
                    onClick={() =>
                      alert(`Selected event: ${event.title}`)
                    }
                  >
                    View Event
                  </Button>
                </Stack>
              </Card>
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
}

export default App;
