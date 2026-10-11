import {
  alpha,
  Box,
  Card,
  Grid,
  Image,
  Loader,
  NumberFormatter,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useParams } from "react-router";
import MiniMap from "./MiniMap";
import { IconCar, IconCloudSnow } from "@tabler/icons-react";
import type { EventModel } from "../../resources/EventModel";
import { useQuery } from "@tanstack/react-query";

export const Event = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const theme = useMantineTheme();

  const { data: currentEvent } = useQuery<EventModel>({
    queryKey: ["searchEvents", eventId],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API}api/v1/events/${eventId}`).then((res) =>
        res.json(),
      ),
  });

  if (!currentEvent) {
    return <Loader />;
  }

  return (
    <>
      <Box style={{ position: "relative" }}>
        <Image src={currentEvent.image_url} fit="cover" height={500}></Image>
        <Title
          style={{ position: "absolute", bottom: "0" }}
          bg={alpha(theme.black, 0.8)}
          p={40}
          w="100%"
          c={theme.white}
          order={1}
        >
          {currentEvent?.title}
        </Title>
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
                      <NumberFormatter
                        value={35}
                        suffix=" °F"
                        decimalScale={1}
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
        </Grid.Col>
        <Grid.Col px={20} span={4}>
          <Text>{currentEvent.summary}</Text>
        </Grid.Col>
      </Grid>
    </>
  );
};
