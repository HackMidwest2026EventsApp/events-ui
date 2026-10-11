import {
  Alert,
  Anchor,
  Badge,
  Card,
  Checkbox,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCheck, IconHanger, IconInfoCircle } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../resources/api";
import type {
  ClothingGender,
  StylePreferences,
} from "../../resources/AccountModel";

/** What /garments/catalog reports. Only the counts the card explains. */
interface CatalogStatus {
  available: boolean;
  records: number;
  by_gender: Partial<Record<"men" | "women" | "unlabelled", number>>;
}

/** Each range in the terms the backend actually acts on.
 *
 * Two different mechanisms hang off one setting: the words go into the LLM
 * prompt (llm.wardrobe_line) and they also filter which catalog photos may be
 * used (vocab.catalog_genders). "Unisex" exists only in the first — no dataset
 * labels a garment unisex — so as a photo filter it means "no filter", which
 * is why picking it alongside Menswear widens the pool instead of narrowing
 * it. The card has to say so or the control lies.
 */
const RANGES: Record<
  ClothingGender,
  { blurb: string; catalogKey: "men" | "women" | null }
> = {
  Menswear: {
    blurb: "Men's photos, plus ones the datasets left unlabelled",
    catalogKey: "men",
  },
  Womenswear: {
    blurb: "Women's photos, plus ones the datasets left unlabelled",
    catalogKey: "women",
  },
  Unisex: {
    blurb: "No photo filter — widest setting, overrides the other two",
    catalogKey: null,
  },
};

const PREFERENCES_KEY = (token: string) => ["preferences", token];

/** How many catalog photos the current pick leaves eligible. */
const eligiblePhotos = (
  chosen: ClothingGender[],
  catalog: CatalogStatus | undefined,
): number | null => {
  if (!catalog?.available) return null;
  const { men = 0, women = 0, unlabelled = 0 } = catalog.by_gender;
  if (chosen.length === 0 || chosen.includes("Unisex")) return catalog.records;
  return (
    (chosen.includes("Menswear") ? men : 0) +
    (chosen.includes("Womenswear") ? women : 0) +
    // Unlabelled records stay eligible under every preference: refusing them
    // would be refusing a sixth of the catalog for no reason.
    unlabelled
  );
};

const describe = (chosen: ClothingGender[]): string => {
  if (chosen.length === 0) {
    return "No preference. The stylist is told to keep every piece gender-neutral, and any photo may be used.";
  }
  if (chosen.includes("Unisex")) {
    const others = chosen.filter((range) => range !== "Unisex");
    return others.length
      ? `Unisex leaves photos unfiltered, so it overrides ${others.join(" and ")} for the pictures — only the written advice still mentions them.`
      : "The advice stays unisex, and any photo in the catalog may be used.";
  }
  return `The stylist dresses you in ${chosen.join(" and ")}, and picks photos from that range.`;
};

export const WardrobeCard = ({ token }: { token: string }) => {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery<StylePreferences>({
    queryKey: PREFERENCES_KEY(token),
    queryFn: () =>
      api<StylePreferences>("/api/v1/auth/me/preferences", { token }),
  });

  // Unauthenticated and static, so it is cached for the session.
  const { data: catalog } = useQuery<CatalogStatus>({
    queryKey: ["garmentCatalog"],
    staleTime: Infinity,
    retry: false,
    queryFn: () => api<CatalogStatus>("/api/v1/garments/catalog"),
  });

  const save = useMutation({
    mutationFn: (clothing_genders: ClothingGender[]) =>
      api<StylePreferences>("/api/v1/auth/me/preferences", {
        method: "PUT",
        body: { clothing_genders },
        token,
      }),
    // Applied to the cache before the request goes out: a checkbox that waits
    // for a round-trip to move reads as broken.
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY(token) });
      const previous = queryClient.getQueryData<StylePreferences>(
        PREFERENCES_KEY(token),
      );
      if (previous) {
        queryClient.setQueryData<StylePreferences>(PREFERENCES_KEY(token), {
          ...previous,
          clothing_genders: next,
        });
      }
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PREFERENCES_KEY(token), context.previous);
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(PREFERENCES_KEY(token), saved);
      // /auth/me inlines the same list for the header.
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      // The backend treats any recommendation older than this write as stale
      // (services/recommendations.py), but the outfit pages are cached here
      // with staleTime: Infinity -- so without this the new wardrobe would
      // not show up on an event already looked at, which is exactly where a
      // user would go to check that the setting did anything.
      void queryClient.invalidateQueries({ queryKey: ["recommendation"] });
    },
  });

  const chosen = data?.clothing_genders ?? [];
  const eligible = eligiblePhotos(chosen, catalog);

  const toggle = (range: ClothingGender, checked: boolean) =>
    save.mutate(
      checked ? [...chosen, range] : chosen.filter((item) => item !== range),
    );

  return (
    <Card withBorder radius="lg" padding="lg">
      <Group justify="space-between" mb={4} wrap="nowrap">
        <Group gap="xs">
          <IconHanger size={20} />
          <Title order={4}>Wardrobe</Title>
        </Group>

        {save.isPending ? (
          <Badge variant="light" color="gray" leftSection={<Loader size={10} color="gray" />}>
            Saving
          </Badge>
        ) : save.isSuccess ? (
          <Badge variant="light" color="teal" leftSection={<IconCheck size={11} />}>
            Saved
          </Badge>
        ) : null}
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        Which ranges the stylist may dress you in. Pick none for no preference.
      </Text>

      {isPending || !data ? (
        <Loader size="sm" />
      ) : (
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            {data.available.map((range) => {
              const { blurb, catalogKey } = RANGES[range];
              const photos = catalogKey
                ? catalog?.by_gender[catalogKey]
                : catalog?.records;

              return (
                <Checkbox.Card
                  key={range}
                  withBorder
                  radius="md"
                  p="sm"
                  checked={chosen.includes(range)}
                  onChange={(checked) => toggle(range, checked)}
                >
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <Checkbox.Indicator size="xs" mt={2} />
                    <Stack gap={2}>
                      <Text size="sm" fw={600}>
                        {range}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {blurb}
                      </Text>
                      {photos !== undefined && (
                        <Text size="xs" c="dimmed">
                          {photos.toLocaleString()} photos
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Checkbox.Card>
              );
            })}
          </SimpleGrid>

          <Text size="sm">{describe(chosen)}</Text>

          {eligible !== null && (
            <Text size="xs" c="dimmed">
              {eligible.toLocaleString()} of{" "}
              {catalog!.records.toLocaleString()} catalog photos are eligible.
            </Text>
          )}

          {catalog?.available === false && (
            <Text size="xs" c="dimmed">
              The photo catalog is not loaded, so this only changes the written
              advice.
            </Text>
          )}

          <Alert
            variant="light"
            color="blue"
            p="xs"
            icon={<IconInfoCircle size={16} />}
          >
            <Text size="xs">
              Changing this re-dresses events you have already opened: the next
              visit regenerates the outfit, which costs one of your daily
              recommendations.{" "}
              {chosen.length > 0 && (
                <Anchor
                  component="button"
                  type="button"
                  size="xs"
                  onClick={() => save.mutate([])}
                >
                  Clear the preference
                </Anchor>
              )}
            </Text>
          </Alert>

          {save.isError && (
            <Text size="sm" c="red">
              {save.error instanceof Error
                ? save.error.message
                : "Could not save that preference."}{" "}
              Nothing changed.
            </Text>
          )}
        </Stack>
      )}
    </Card>
  );
};
