export type EventStatus = "open" | "closed";

export type CarrierDto = { id: string; name: string };

export type EventDto = {
  id: string;
  title: string;
  content: string;
  carrierId: string;
  carrier: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
};
