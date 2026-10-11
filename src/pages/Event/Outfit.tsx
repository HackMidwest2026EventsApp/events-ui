import {
  Alert,
  Badge,
  Card,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconHanger } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { EventModel } from "../../resources/EventModel";
import type { EventRecommendation } from "../../resources/RecommendationModel";
import {
  fetchRecommendation,
  garmentImageUrl,
} from "../../resources/recommendations";

/** Shown in place of a garment photo the catalog has no match for, and when
 *  the API cannot serve the one it picked. */
const NO_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
       <rect width="100%" height="100%" fill="#f1f3f5"/>
       <text x="50%" y="50%" text-anchor="middle" fill="#adb5bd"
             font-family="sans-serif" font-size="16">no photo</text>
     </svg>`,
  );

export const Outfit = ({ event }: { event: EventModel }) => {
  const { data, isPending, isError, error } = useQuery<EventRecommendation>({
    queryKey: ["recommendation", event.id],
    queryFn: () => fetchRecommendation(event),
    // Generating costs an LLM call, so never redo one we already have.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const outfit = data?.outfit_json;

  return (
    <Stack gap="md" mt={40}>
      <Group gap="xs">
        <IconHanger size={28} />
        <Title order={2}>What to wear</Title>
        {outfit && <Badge variant="light">{outfit.formality_level}</Badge>}
        {outfit?.layers_required && <Badge variant="light">Layers</Badge>}
      </Group>

      {isPending && (
        <Group gap="xs">
          <Loader size="sm" />
          <Text c="dimmed">Asking the stylist about this event...</Text>
        </Group>
      )}

      {isError && (
        <Alert color="red" title="No outfit advice yet">
          {error instanceof Error ? error.message : "Something went wrong."}
        </Alert>
      )}

      {outfit && (
        <>
          <Text>{outfit.summary}</Text>

          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="lg">
            {outfit.items.map((item) => (
              <Card key={item.garment_type + item.item_description} withBorder radius="lg" padding="md">
                <Card.Section>
                  <Image
                    src={
                      item.image
                        ? garmentImageUrl(item.image.image_url)
                        : NO_PHOTO
                    }
                    fallbackSrc={NO_PHOTO}
                    height={240}
                    fit="contain"
                    alt={item.item_description}
                  />
                </Card.Section>

                <Stack gap={6} mt="md">
                  <Group gap="xs">
                    <Badge size="sm" variant="light">
                      {item.category}
                    </Badge>
                    <Badge size="sm" variant="outline" color="gray">
                      {item.color}
                    </Badge>
                  </Group>

                  <Text fw={600}>{item.item_description}</Text>
                  <Text size="sm" c="dimmed">
                    {item.reasoning}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
};
