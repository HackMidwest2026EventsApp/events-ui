import {
  alpha,
  Box,
  Card,
  Grid,
  Image,
  NumberFormatter,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { sampleEvents } from "../../resources/EventModel";
import { useParams } from "react-router";
import { useMemo } from "react";

import kauffman from "../../assets/KauffmanCenter.png";
import { IconCar, IconCloudSnow } from "@tabler/icons-react";

export const Event = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const theme = useMantineTheme();

  const currentEvent = useMemo(
    () => sampleEvents.find((event) => event.id === eventId),
    [eventId],
  );

  return (
    <>
      <Box style={{ position: "relative" }}>
        <Image src={currentEvent?.image} fit="cover" height={500}></Image>
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
            <Image src={kauffman} w="100%" h="400" />
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
          <Text>
            The Kansas City Ballet’s production of The Wizard of Oz is a
            vibrant, full-length ballet choreographed by Septime Webre that
            adapts L. Frank Baum’s classic story into a grand theatrical
            experience. The production follows Dorothy Gale and her dog Toto
            after they are swept away by a Kansas cyclone and deposited into the
            magical Land of Oz. To find her way back home, Dorothy journeys
            along the Yellow Brick Road—cleverly personified on stage by
            athletic dancers known as the "Yellow Brick Roadies"—and builds an
            eclectic group of companions including the Scarecrow, the Tin Man,
            and the Cowardly Lion. Together, they confront the Wicked Witch of
            the West, navigate the illusions of the mysterious Wizard, and
            ultimately discover that there is no place like home. Performed at
            the Kauffman Center for the Performing Arts, this visually
            spectacular production features a live original score by Matthew
            Pierce performed by the Kansas City Symphony, alongside elaborate
            costumes, large-scale projections, and intricate puppetry.
          </Text>
        </Grid.Col>
      </Grid>
    </>
  );
};
