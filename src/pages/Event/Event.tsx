import {
  alpha,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Grid,
  Image,
  Loader,
  NumberFormatter,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useParams } from "react-router";
import MiniMap from "./MiniMap";
import { Outfit } from "./Outfit";
import {
  IconCar,
  IconCloudSnow,
  IconExternalLink,
  IconMapPin,
} from "@tabler/icons-react";
import type { EventModel } from "../../resources/EventModel";
import { useQuery } from "@tanstack/react-query";
import { GoingButton } from "../../components/GoingButton";

const RESTAURANT_RADIUS_METERS = 50_000;

function getExternalHttpUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export const Event = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const theme = useMantineTheme();

  const {
    data: currentEvent,
    isPending,
    error,
  } = useQuery<EventModel>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API}api/v1/events/${eventId}`,
      );
      if (!response.ok) {
        throw new Error(`Could not load event (${response.status})`);
      }
      return response.json() as Promise<EventModel>;
    },
  });

  const {
    data: weatherEvent,
    error: weatherError,
  } = useQuery<EventModel>({
    queryKey: ["eventWeather", eventId],
    enabled: !!currentEvent && !currentEvent.weather,
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API}api/v1/events/${eventId}/weather`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error(`Weather unavailable (${response.status})`);
      }
      return response.json() as Promise<EventModel>;
    },
  });

  const {
    data: restaurantsEvent,
    isPending: restaurantsPending,
    error: restaurantsError,
  } = useQuery<EventModel>({
    queryKey: ["eventRestaurants", eventId, RESTAURANT_RADIUS_METERS],
    enabled: !!currentEvent,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API}api/v1/events/${encodeURIComponent(eventId ?? "")}/nearby-restaurants?radius_meters=${RESTAURANT_RADIUS_METERS}`,
        { method: "POST", signal },
      );
      if (!response.ok) {
        throw new Error(`Restaurants unavailable (${response.status})`);
      }
      return response.json() as Promise<EventModel>;
    },
  });

  if (isPending) {
    return <Loader />;
  }

  if (error || !currentEvent) {
    return <Text c="red">Unable to load this event. {error?.message}</Text>;
  }

  const event = weatherEvent ?? currentEvent;
  const restaurantEvent = restaurantsEvent ?? currentEvent;

  return (
    <>
      <Box style={{ position: "relative" }}>
        <Image src={event.image_url} fit="cover" height={500}></Image>
        <Group
          style={{ position: "absolute", bottom: 0 }}
          bg={alpha(theme.black, 0.8)}
          p={40}
          w="100%"
          justify="space-between"
          wrap="nowrap"
          align="center"
        >
          <Title c={theme.white} order={1}>
            {event.title}
          </Title>
          <GoingButton event={event} />
        </Group>
      </Box>
      <Grid p={40}>
        <Grid.Col span={8}>
          <Box mb={20}>
            <MiniMap />
          </Box>
          <Grid>
            <Grid.Col span={4}>
              <Card withBorder display="flex" style={{ alignItems: "center" }}>
                <Card.Section p={40}>
                  <Box display="flex">
                    <IconCloudSnow size={35} />
                    <Text ml="md" size="xl">
                      {event.weather?.temperature != null ? (
                        <NumberFormatter
                          value={event.weather.temperature}
                          suffix=" °F"
                          decimalScale={1}
                        />
                      ) : (
                        "—"
                      )}
                    </Text>
                  </Box>
                  <Text size="sm" c="dimmed" mt="xs">
                    {event.weather
                      ? `${event.weather.summary ?? "—"} · ${event.weather.time}`
                      : weatherError
                        ? "Weather unavailable"
                        : "Loading weather…"}
                  </Text>
                  {/* The hourly forecast only reaches about a week out. Past
                      that the API returns the nearest hour it has, which is
                      today's -- useful as a seasonal hint, wrong to present
                      as the forecast for the date. */}
                  {event.weather?.approximate && (
                    <Text size="xs" c="dimmed" mt={4} fs="italic">
                      Nearest available reading — too far out for an hourly
                      forecast
                    </Text>
                  )}
                </Card.Section>
              </Card>
            </Grid.Col>
            <Grid.Col span={4}>
              <Card withBorder display="flex" style={{ alignItems: "center" }}>
                <Card.Section p={40}>
                  <Box display="flex">
                    <IconCar size={35} />
                    <Text size="xl" ml="md">
                      <NumberFormatter
                        value={49.34}
                        prefix="$"
                        decimalScale={2}
                      />
                    </Text>
                  </Box>
                </Card.Section>
              </Card>
            </Grid.Col>
            <Grid.Col span={4}>
              <Card withBorder display="flex" style={{ alignItems: "center" }}>
                <Card.Section p={40}>
                  <Box display="flex">
                    <IconCar size={35} />
                    <Text size="xl" ml="md">
                      <NumberFormatter
                        value={49.34}
                        prefix="$"
                        decimalScale={2}
                      />
                    </Text>
                  </Box>
                </Card.Section>
              </Card>
            </Grid.Col>
          </Grid>
          <Outfit event={currentEvent} />
        </Grid.Col>
        <Grid.Col px={20} span={4}>
          <Text mb="lg">{event.summary}</Text>
          <Card withBorder mb="lg">
            <Group justify="space-between" align="flex-start" mb="xs">
              <Box>
                <Title order={3}>Nearby restaurants</Title>
                <Text size="sm" c="dimmed">
                  Within {RESTAURANT_RADIUS_METERS / 1000} km of the venue
                </Text>
              </Box>
              {restaurantEvent.nearby_restaurants && (
                <Badge variant="light" color="teal">
                  {restaurantEvent.nearby_restaurants.length} found
                </Badge>
              )}
            </Group>
            <Divider mb="md" />
            {restaurantsPending && (
              <Group gap="sm">
                <Loader size="xs" />
                <Text size="sm" c="dimmed">
                  Finding nearby restaurants…
                </Text>
              </Group>
            )}
            {restaurantsError && (
              <Text size="sm" c="red" role="alert">
                Unable to load nearby restaurants. {restaurantsError.message}
              </Text>
            )}
            {!restaurantsPending && !restaurantsError && (
              restaurantEvent.nearby_restaurants?.length ? (
                <Stack gap="sm">
                  {restaurantEvent.nearby_restaurants.map((restaurant, index) => {
                  const websiteUrl = getExternalHttpUrl(restaurant.website_url);
                  const osmUrl = getExternalHttpUrl(restaurant.osm_url);

                  return (
                    <Card
                      key={`${restaurant.name}-${index}`}
                      withBorder
                      padding="sm"
                      radius="md"
                    >
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0 }}>
                          <Text fw={600} lineClamp={2}>
                            {restaurant.name}
                          </Text>
                          {restaurant.cuisine !== "Not specified" && (
                            <Badge mt={6} size="sm" variant="light" color="gray">
                              {restaurant.cuisine}
                            </Badge>
                          )}
                        </Box>
                        {osmUrl && (
                          <Button
                            component="a"
                            href={osmUrl}
                            target="_blank"
                            rel="noreferrer"
                            variant="subtle"
                            size="compact-sm"
                            px={8}
                            leftSection={<IconMapPin size={15} />}
                            aria-label={`View ${restaurant.name} on OpenStreetMap`}
                          >
                            Map
                          </Button>
                        )}
                      </Group>
                      {websiteUrl && (
                        <Button
                          component="a"
                          href={websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          variant="light"
                          size="compact-sm"
                          mt="xs"
                          leftSection={<IconExternalLink size={15} />}
                        >
                          Visit website
                        </Button>
                      )}
                    </Card>
                  );
                  })}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No nearby restaurants found within 20 km.
                </Text>
              )
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
};
