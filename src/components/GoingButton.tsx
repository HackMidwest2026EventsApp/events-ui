import { Button, Tooltip } from "@mantine/core";
import { IconCalendarPlus, IconCheck } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import type { EventModel } from "../resources/EventModel";
import type { SavedEvent } from "../resources/AccountModel";
import { useAuth } from "../resources/auth";
import { goingToEvent, listSavedEvents } from "../resources/savedEvents";

/** Puts one event on the signed-in account's list, or points at sign-in.
 *
 * The list is keyed on the provider's event id, not the search id in the URL:
 * a search id expires after an hour, so the same event reached from a later
 * search has to still read as already added.
 */
export const GoingButton = ({ event }: { event: EventModel }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedEvents } = useQuery<SavedEvent[]>({
    queryKey: ["savedEvents", token],
    enabled: token !== null,
    queryFn: () => listSavedEvents(token!),
  });

  const going = useMutation({
    mutationFn: () => goingToEvent(event, token!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["savedEvents"] }),
  });

  if (!token) {
    return (
      <Tooltip label="Sign in to keep a list of events you are going to">
        <Button
          component={Link}
          to="/login"
          variant="light"
          radius="md"
          leftSection={<IconCalendarPlus size={18} />}
        >
          I'm going
        </Button>
      </Tooltip>
    );
  }

  const added = savedEvents?.some(
    (saved) => saved.provider_event_id === event.provider_event_id,
  );

  return (
    <Button
      radius="md"
      color={added ? "teal" : undefined}
      variant={added ? "light" : "filled"}
      loading={going.isPending}
      onClick={() => !added && going.mutate()}
      leftSection={
        added ? <IconCheck size={18} /> : <IconCalendarPlus size={18} />
      }
    >
      {added ? "On your list" : going.isError ? "Try again" : "I'm going"}
    </Button>
  );
};
