import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Authenticating, Calling, Exhibiting, Hosting, Navigating, Sessioning } = concepts;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sessionFromCookie(value: Record<string, unknown>) {
  return typeof value.session === "string" || value.session === null;
}

function bounded(value: unknown, max: number) {
  return typeof value === "string" && value.length <= max;
}

function validArea(value: unknown) {
  if (!record(value)) return false;
  const { x, y, width, height } = value;
  return [x, y, width, height].every(Number.isSafeInteger) &&
    typeof x === "number" && typeof y === "number" &&
    typeof width === "number" && typeof height === "number" &&
    x >= 0 && y >= 0 && width > 0 && height > 0 &&
    x + width <= 10 && y + height <= 10 && !(x === 0 && y === 0);
}

const createFairInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.name, 100)
    ? { ok: true }
    : { ok: false, detail: "Enter a fair name of at most 100 characters." };

const fairCodeInput: EndpointValidator = (value) =>
  record(value) && typeof value.code === "string" && /^[A-F0-9]{8}$/i.test(value.code)
    ? { ok: true }
    : { ok: false, detail: "Enter an eight-character fair code." };

const fairListingInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.fair, 100) &&
    typeof value.listed === "boolean"
    ? { ok: true }
    : { ok: false, detail: "Choose whether this fair appears publicly." };

const createBoothInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.fair, 100) &&
    bounded(value.name, 100) && bounded(value.description, 1000) &&
    bounded(value.meetingUrl, 2000) &&
    validArea(value.footprint)
    ? { ok: true }
    : { ok: false, detail: "Enter valid booth details and a grid area." };

const editBoothInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    bounded(value.name, 100) && bounded(value.description, 1000)
    ? { ok: true }
    : { ok: false, detail: "Enter valid booth details." };

const assignmentInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    bounded(value.representative, 32)
    ? { ok: true }
    : { ok: false, detail: "Enter a booth and representative username." };

const meetingLinkInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    bounded(value.meetingUrl, 2000)
    ? { ok: true }
    : { ok: false, detail: "Enter a booth and meeting link." };

const fairInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.fair, 100)
    ? { ok: true } : { ok: false, detail: "Enter a fair." };

const moveInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && record(value.destination) &&
    Number.isSafeInteger(value.destination.x) && Number.isSafeInteger(value.destination.y)
    ? { ok: true } : { ok: false, detail: "Enter a grid destination." };

const callInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100)
    ? { ok: true } : { ok: false, detail: "Enter a booth." };

const guestCallInput: EndpointValidator = (value) =>
  record(value) && typeof value.code === "string" && /^[A-F0-9]{8}$/i.test(value.code) &&
    bounded(value.booth, 100)
    ? { ok: true } : { ok: false, detail: "Enter a fair code and booth." };

const openCallInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    bounded(value.joinUrl, 2000)
    ? { ok: true } : { ok: false, detail: "Enter a booth and call link." };

const closeCallInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.call, 100)
    ? { ok: true } : { ok: false, detail: "Enter a call." };

const FairPage = former(
  "the fair page for (fair)",
  ({ fair }, { name, organizer, code, listed, booth, boothName, description, footprint, meetingLinkSaved, representative, call, host }) =>
    where(Hosting._get({ fair }).is({ name, organizer, code, listed })).form({
      fair,
      name,
      organizer,
      code,
      listed,
      booths: each(
        Exhibiting._in({ space: fair }).is({ booth, name: boothName, description, footprint, meetingLinkSaved }),
      ).form({
        booth,
        name: boothName,
        description,
        footprint,
        meetingLinkSaved,
        representatives: each(
          Exhibiting._representatives({ booth }).is({ representative }),
        ).form({ representative }),
        calls: each(Calling._openAt({ place: booth }).is({ call, host })).form({ call, host }),
      }),
    }),
);

const PublicFairs = former(
  "the public fair directory",
  (_input, { fair, name, organizer }) => form({
    fairs: each(Hosting._public({}).is({ fair, name, organizer })).form({ fair, name, organizer }),
  }),
);

const ListPublicFairs = endpoint(
  "/fairs/public",
  () => receive({}).then(respond({ directory: PublicFairs({}) })),
);

const SetFairListing = endpoint(
  "/fairs/listing",
  ({ session, organizer, fair, listed }) =>
    receive({ session, fair, listed })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Hosting.setListed({ organizer, fair, listed }))
      .then(respond({ fair, listed })),
  { input: { required: ["session", "fair", "listed"] }, validators: { input: fairListingInput } },
);

const CreateFair = endpoint(
  "/fairs/create",
  ({ session, organizer, name, fair, code }) =>
    receive({ session, name })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Hosting.create({ organizer, name }).responds({ fair, code }))
      .then(respond({ fair, code })),
  {
    input: { required: ["session", "name"] },
    validators: { input: createFairInput },
  },
);

const OpenFairCode = endpoint(
  "/fairs/by-code",
  ({ code, fair }) =>
    receive({ code })
      .where(Hosting._byCode({ code }).is({ fair }))
      .then(respond({ fair })),
  { input: { required: ["code"] }, validators: { input: fairCodeInput } },
);

const FairCodeNotFound = endpoint(
  "/fairs/by-code",
  ({ code }) =>
    receive({ code })
      .where(Hosting._codeExists({ code }).is({ exists: false }))
      .then(respond({ error: "NOT_FOUND" })),
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

const CreateBooth = endpoint(
  "/booths/create",
  ({ session, organizer, fair, footprint, name, description, meetingUrl, booth }) =>
    receive({ session, fair, footprint, name, description, meetingUrl })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Hosting.verifyOwner({ organizer, fair }))
      .then(Exhibiting.create({ organizer, space: fair, footprint, name, description, meetingUrl }).responds({ booth }))
      .then(respond({ booth })),
  {
    input: { required: ["session", "fair", "footprint", "name", "description", "meetingUrl"] },
    validators: { input: createBoothInput },
  },
);

const SetBoothMeetingLink = endpoint(
  "/booths/meeting-link/set",
  ({ session, organizer, booth, meetingUrl }) =>
    receive({ session, booth, meetingUrl })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Exhibiting.setMeetingLink({ organizer, booth, meetingUrl }))
      .then(respond({ booth })),
  { input: { required: ["session", "booth", "meetingUrl"] }, validators: { input: meetingLinkInput } },
);

const GetBoothMeetingLink = endpoint(
  "/booths/meeting-link",
  ({ session, person, booth, joinUrl }) =>
    receive({ session, booth })
      .then(Sessioning.current({ session }).responds({ subject: person }))
      .then(Exhibiting.meetingLink({ person, booth }).responds({ joinUrl }))
      .then(respond({ joinUrl })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const EditBooth = endpoint(
  "/booths/edit",
  ({ session, organizer, booth, name, description }) =>
    receive({ session, booth, name, description })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Exhibiting.edit({ organizer, booth, name, description }))
      .then(respond({ booth })),
  {
    input: { required: ["session", "booth", "name", "description"] },
    validators: { input: editBoothInput },
  },
);

const AddRepresentative = endpoint(
  "/booths/representatives/add",
  ({ session, organizer, booth, representative }) =>
    receive({ session, booth, representative })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Authenticating.verifyRegistered({ username: representative }))
      .then(Exhibiting.addRepresentative({ organizer, booth, representative }))
      .then(respond({ booth, representative })),
  {
    input: { required: ["session", "booth", "representative"] },
    validators: { input: assignmentInput },
  },
);

const RemoveRepresentative = endpoint(
  "/booths/representatives/remove",
  ({ session, organizer, booth, representative }) =>
    receive({ session, booth, representative })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Exhibiting.removeRepresentative({ organizer, booth, representative }))
      .then(respond({ booth, representative })),
  {
    input: { required: ["session", "booth", "representative"] },
    validators: { input: assignmentInput },
  },
);

const EnterFair = endpoint(
  "/fairs/enter",
  ({ session, person, fair, position }) =>
    receive({ session, fair })
      .where(Hosting._exists({ fair }).is({ exists: true }))
      .then(Sessioning.current({ session }).responds({ subject: person }))
      .then(Navigating.enter({ person, space: fair, position: { x: 0, y: 0 } }))
      .then(respond({ position: { x: 0, y: 0 } })),
  { input: { required: ["session", "fair"] }, validators: { input: fairInput } },
);

const Move = endpoint(
  "/fairs/move",
  ({ session, person, destination }) =>
    receive({ session, destination })
      .then(Sessioning.current({ session }).responds({ subject: person }))
      .then(Navigating.move({ person, destination }))
      .then(respond({ position: destination })),
  { input: { required: ["session", "destination"] }, validators: { input: moveInput } },
);

const LeaveFair = endpoint(
  "/fairs/leave",
  ({ session, person }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: person }))
      .then(Navigating.leave({ person }))
      .then(respond({ left: true })),
  { input: { required: ["session"] } },
);

const FairPresence = former(
  "the people in (fair)",
  ({ fair }, { person, position }) => where(Hosting._exists({ fair }).is({ exists: true })).form({
    people: each(Navigating._present({ space: fair }).is({ person, position })).form({ person, position }),
  }),
);

const GetPresence = endpoint(
  "/fairs/presence",
  ({ fair }) => receive({ fair }).then(respond({ presence: FairPresence({ fair }) })),
  { input: { required: ["fair"] } },
);

const OpenCall = endpoint(
  "/calls/open",
  ({ session, person, booth, joinUrl, space, position, call }) =>
    receive({ session, booth, joinUrl })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
        Exhibiting._get({ booth }).is({ space }),
        Navigating._location({ person }).is({ space, position }),
        Exhibiting._contains({ booth, position }).is({ contains: true }),
      )
      .then(Calling.open({ host: person, place: booth, joinUrl }).responds({ call }))
      .then(respond({ call })),
  { input: { required: ["session", "booth", "joinUrl"] }, validators: { input: openCallInput } },
);

const JoinCall = endpoint(
  "/calls/join",
  ({ session, person, booth, space, position, call, joinUrl }) =>
    receive({ session, booth })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Exhibiting._get({ booth }).is({ space }),
        Navigating._location({ person }).is({ space, position }),
        Exhibiting._contains({ booth, position }).is({ contains: true }),
        Calling._openAt({ place: booth }).is({ call }),
      )
      .then(Calling.join({ person, call }).responds({ joinUrl }))
      .then(respond({ joinUrl })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const GuestJoinCall = endpoint(
  "/calls/guest-join",
  ({ code, booth, space, call, joinUrl }) =>
    receive({ code, booth })
      .where(
        Hosting._byCode({ code }).is({ fair: space }),
        Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
        Calling._openAt({ place: booth }).is({ call }),
      )
      .then(Calling.join({ person: "guest", call }).responds({ joinUrl }))
      .then(respond({ joinUrl })),
  { input: { required: ["code", "booth"] }, validators: { input: guestCallInput } },
);

const GuestJoinCallUnknownFair = endpoint(
  "/calls/guest-join",
  ({ code, booth }) => receive({ code, booth })
    .where(Hosting._codeExists({ code }).is({ exists: false }))
    .then(respond({ error: "NOT_FOUND" })),
);

const GuestJoinCallWrongBooth = endpoint(
  "/calls/guest-join",
  ({ code, booth, space }) => receive({ code, booth })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: false }),
    )
    .then(respond({ error: "NOT_FOUND" })),
);

const GuestJoinCallClosed = endpoint(
  "/calls/guest-join",
  ({ code, booth, space }) => receive({ code, booth })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Calling._isOpen({ place: booth }).is({ open: false }),
    )
    .then(respond({ error: "NOT_FOUND" })),
);

const OpenCallNotRepresentative = endpoint(
  "/calls/open",
  ({ session, booth, joinUrl, person }) => receive({ session, booth, joinUrl })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._exists({ booth }).is({ exists: true }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: false }),
    ).then(respond({ error: "NOT_ALLOWED" })),
);

const OpenCallOutside = endpoint(
  "/calls/open",
  ({ session, booth, joinUrl, person, space, position }) => receive({ session, booth, joinUrl })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    ).then(respond({ error: "NOT_ALLOWED" })),
);

const OpenCallAbsent = endpoint(
  "/calls/open",
  ({ session, booth, joinUrl, person, space }) => receive({ session, booth, joinUrl })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._inSpace({ person, space }).is({ present: false }),
    ).then(respond({ error: "NOT_ALLOWED" })),
);

const JoinCallOutside = endpoint(
  "/calls/join",
  ({ session, booth, person, space, position }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    ).then(respond({ error: "NOT_ALLOWED" })),
);

const JoinCallAbsent = endpoint(
  "/calls/join",
  ({ session, booth, person, space }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._inSpace({ person, space }).is({ present: false }),
    ).then(respond({ error: "NOT_ALLOWED" })),
);

const JoinCallClosed = endpoint(
  "/calls/join",
  ({ session, booth, person, space, position }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
      Calling._isOpen({ place: booth }).is({ open: false }),
    ).then(respond({ error: "NOT_FOUND" })),
);

const OpenCallUnknownBooth = endpoint(
  "/calls/open",
  ({ session, booth, joinUrl }) => receive({ session, booth, joinUrl })
    .where(Exhibiting._exists({ booth }).is({ exists: false }))
    .then(respond({ error: "NOT_FOUND" })),
);

const JoinCallUnknownBooth = endpoint(
  "/calls/join",
  ({ session, booth }) => receive({ session, booth })
    .where(Exhibiting._exists({ booth }).is({ exists: false }))
    .then(respond({ error: "NOT_FOUND" })),
);

const OpenCallNoSession = endpoint(
  "/calls/open",
  ({ session, booth, joinUrl }) => receive({ session, booth, joinUrl })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const JoinCallNoSession = endpoint(
  "/calls/join",
  ({ session, booth }) => receive({ session, booth })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const CloseCall = endpoint(
  "/calls/close",
  ({ session, person, call }) =>
    receive({ session, call })
      .then(Sessioning.current({ session }).responds({ subject: person }))
      .then(Calling.close({ host: person, call }))
      .then(respond({ closed: true })),
  { input: { required: ["session", "call"] }, validators: { input: closeCallInput } },
);

const RemovedRepresentativeClosesCall = reaction(({ booth, representative, call }) =>
  when(Exhibiting.removeRepresentative({ booth, representative }).responds({}))
    .where(Calling._openAt({ place: booth }).is({ call, host: representative }))
    .then(Calling.close({ host: representative, call })),
);

const HostExitsBoothClosesCall = reaction(({ person, call, booth, position, space }) =>
  when(Navigating.move({ person }).responds({}))
    .where(
      Calling._hostedBy({ host: person }).is({ call, place: booth }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    )
    .then(Calling.close({ host: person, call })),
);

const DepartedHostClosesCall = reaction(({ person, call }) =>
  when(Navigating.leave({ person }).responds({}))
    .where(Calling._hostedBy({ host: person }).is({ call }))
    .then(Calling.close({ host: person, call })),
);

export const composition = {
  FairPage, PublicFairs, ListPublicFairs, SetFairListing,
  CreateFair, OpenFairCode, FairCodeNotFound, GetFairPage, FairNotFound,
  CreateBooth, EditBooth, SetBoothMeetingLink, GetBoothMeetingLink,
  AddRepresentative, RemoveRepresentative,
  EnterFair, Move, LeaveFair, FairPresence, GetPresence,
  OpenCall, JoinCall, GuestJoinCall, GuestJoinCallUnknownFair,
  GuestJoinCallWrongBooth, GuestJoinCallClosed, CloseCall,
  OpenCallNotRepresentative, OpenCallOutside, OpenCallAbsent,
  JoinCallOutside, JoinCallAbsent, JoinCallClosed,
  OpenCallUnknownBooth, JoinCallUnknownBooth, OpenCallNoSession, JoinCallNoSession,
  RemovedRepresentativeClosesCall, HostExitsBoothClosesCall, DepartedHostClosesCall,
};
