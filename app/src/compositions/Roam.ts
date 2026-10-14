import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { former, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Hosting } = concepts;

const FairPage = former(
  "the fair page for (fair)",
  ({ fair }, { name, organizer }) =>
    where(Hosting._get({ fair }).is({ name, organizer })).form({
      fair,
      name,
      organizer,
    }),
);

const CreateFair = endpoint(
  "/fairs/create",
  ({ organizer, name, fair }) =>
    receive({ organizer, name })
      .then(Hosting.create({ organizer, name }).responds({ fair }))
      .then(respond({ fair })),
  { input: { required: ["organizer", "name"] } },
);

const GetFairPage = endpoint(
  "/fairs/page",
  ({ fair }) =>
    receive({ fair })
      .where(Hosting._exists({ fair }).is({ exists: true }))
      .then(respond({ page: FairPage({ fair }) })),
  { input: { required: ["fair"] } },
);

const FairNotFound = endpoint(
  "/fairs/page",
  ({ fair }) =>
    receive({ fair })
      .where(Hosting._exists({ fair }).is({ exists: false }))
      .then(respond({ error: "NOT_FOUND" })),
);

export const composition = { CreateFair, GetFairPage, FairNotFound, FairPage };
