import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Authenticating, Calling, Exhibiting, Hosting, Navigating, Queueing, Sessioning } = concepts;

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
    !(x === 0 && y === 0);
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

const createSizedBoothInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.fair, 100) &&
    bounded(value.name, 100) && bounded(value.description, 1000) &&
    bounded(value.meetingUrl, 2000) &&
    ["small", "medium", "large"].includes(value.size as string)
    ? { ok: true }
    : { ok: false, detail: "Enter valid booth details and choose a size." };

const moveBoothInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    record(value.position) && Number.isSafeInteger(value.position.x) &&
    Number.isSafeInteger(value.position.y)
    ? { ok: true }
    : { ok: false, detail: "Choose a valid booth location." };

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

const freeMoveInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && record(value.destination) &&
    Number.isFinite(value.destination.x) && Number.isFinite(value.destination.y)
    ? { ok: true } : { ok: false, detail: "Enter a map destination." };

const callInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100)
    ? { ok: true } : { ok: false, detail: "Enter a booth." };

const guestCallInput: EndpointValidator = (value) =>
  record(value) && typeof value.code === "string" && /^[A-F0-9]{8}$/i.test(value.code) &&
    bounded(value.booth, 100) && typeof value.token === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.token)
    ? { ok: true } : { ok: false, detail: "Enter a fair code and booth." };

const guestFairInput: EndpointValidator = (value) =>
  record(value) && bounded(value.fair, 100) && typeof value.token === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.token)
    ? { ok: true } : { ok: false, detail: "Enter a fair and guest token." };

const guestMoveInput: EndpointValidator = (value) =>
  record(value) && typeof value.token === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.token) &&
    record(value.destination) && Number.isSafeInteger(value.destination.x) &&
    Number.isSafeInteger(value.destination.y)
    ? { ok: true } : { ok: false, detail: "Enter a guest token and grid destination." };

const guestFreeMoveInput: EndpointValidator = (value) =>
  record(value) && typeof value.token === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.token) &&
    record(value.destination) && Number.isFinite(value.destination.x) &&
    Number.isFinite(value.destination.y)
    ? { ok: true } : { ok: false, detail: "Enter a guest token and map destination." };

const guestTokenInput: EndpointValidator = (value) =>
  record(value) && typeof value.token === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.token)
    ? { ok: true } : { ok: false, detail: "Enter a guest token." };

const openCallInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    bounded(value.joinUrl, 2000)
    ? { ok: true } : { ok: false, detail: "Enter a booth and call link." };

const closeCallInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.call, 100)
    ? { ok: true } : { ok: false, detail: "Enter a call." };

const modeInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.call, 100) &&
    bounded(value.joinUrl, 2000) &&
    (value.mode === "OPEN_GROUP" || value.mode === "INVITE_ONLY")
    ? { ok: true } : { ok: false, detail: "Choose a call mode and meeting link." };

const acceptingInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    typeof value.accepting === "boolean"
    ? { ok: true } : { ok: false, detail: "Choose whether visitors may request a turn." };

const removeQueueInput: EndpointValidator = (value) =>
  record(value) && sessionFromCookie(value) && bounded(value.booth, 100) &&
    bounded(value.visitor, 100)
    ? { ok: true } : { ok: false, detail: "Choose a visitor to remove." };

const FairPage = former(
  "the fair page for (fair)",
  ({ fair }, { name, organizer, code, listed, width, height, booth, boothName, description, footprint, meetingLinkSaved, representative, call, host, mode, accepting, pausedUntil, waiting }) =>
    where(Hosting._get({ fair }).is({ name, organizer, code, listed }),
      Exhibiting._extent({ space: fair }).is({ width, height })).form({
      fair,
      name,
      organizer,
      code,
      listed,
      extent: form({ width, height }),
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
        calls: each(Calling._openAt({ place: booth }).is({ call, host, mode })).form({ call, host, mode }),
        queues: each(Queueing._status({ target: booth }).is({ accepting, pausedUntil, waiting }))
          .form({ accepting, pausedUntil, waiting }),
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

const CreateSizedBooth = endpoint(
  "/booths/create-sized",
  ({ session, organizer, fair, size, name, description, meetingUrl, booth }) =>
    receive({ session, fair, size, name, description, meetingUrl })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Hosting.verifyOwner({ organizer, fair }))
      .then(Exhibiting.createSized({ organizer, space: fair, size, name, description, meetingUrl }).responds({ booth }))
      .then(respond({ booth })),
  {
    input: { required: ["session", "fair", "size", "name", "description", "meetingUrl"] },
    validators: { input: createSizedBoothInput },
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

const MoveBooth = endpoint(
  "/booths/move",
  ({ session, organizer, booth, position }) =>
    receive({ session, booth, position })
      .where(
        Calling._isOpen({ place: booth }).is({ open: false }),
        Calling._suspendedAt({ place: booth }).is({ suspended: false }),
      )
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Exhibiting.move({ organizer, booth, position }))
      .then(respond({ booth })),
  {
    input: { required: ["session", "booth", "position"] },
    validators: { input: moveBoothInput },
  },
);

const MoveBoothDuringCall = endpoint(
  "/booths/move",
  ({ session, organizer, booth, position }) => receive({ session, booth, position })
    .where(
      Sessioning._active({ session }).is({ subject: organizer }),
      Exhibiting._get({ booth }).is({ organizer }),
      Calling._isOpen({ place: booth }).is({ open: true }),
    )
    .then(respond({ error: "PLACE_BUSY" })),
);

const MoveBoothWhilePaused = endpoint(
  "/booths/move",
  ({ session, organizer, booth, position }) => receive({ session, booth, position })
    .where(
      Sessioning._active({ session }).is({ subject: organizer }),
      Exhibiting._get({ booth }).is({ organizer }),
      Calling._suspendedAt({ place: booth }).is({ suspended: true }),
    )
    .then(respond({ error: "PLACE_BUSY" })),
);

const DeleteBooth = endpoint(
  "/booths/delete",
  ({ session, organizer, booth }) =>
    receive({ session, booth })
      .then(Sessioning.current({ session }).responds({ subject: organizer }))
      .then(Exhibiting.verifyOwner({ organizer, booth }))
      .then(Calling.discardAt({ place: booth }))
      .then(Queueing.discard({ target: booth }))
      .then(Exhibiting.remove({ organizer, booth }))
      .then(respond({ deleted: true })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
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
  ({ session, person, destination, space, position }) =>
    receive({ session, destination })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Navigating._location({ person }).is({ space, position }),
        Exhibiting._walkable({ space, from: position, to: destination }).is({ walkable: true }),
      )
      .then(Navigating.move({ person, destination }))
      .then(respond({ position: destination })),
  { input: { required: ["session", "destination"] }, validators: { input: moveInput } },
);

const MoveBlocked = endpoint(
  "/fairs/move",
  ({ session, person, destination, space, position }) => receive({ session, destination })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._walkable({ space, from: position, to: destination }).is({ walkable: false }),
    )
    .then(respond({ error: "INVALID_MOVE" })),
);

const MoveNoSession = endpoint(
  "/fairs/move",
  ({ session, destination }) => receive({ session, destination })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const MoveFree = endpoint(
  "/fairs/move-free",
  ({ session, person, destination, space, position }) => receive({ session, destination })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._walkable({ space, from: position, to: destination }).is({ walkable: true }),
    )
    .then(Navigating.moveFree({ person, destination }))
    .then(respond({ position: destination })),
  { input: { required: ["session", "destination"] }, validators: { input: freeMoveInput } },
);

const MoveFreeBlocked = endpoint(
  "/fairs/move-free",
  ({ session, person, destination, space, position }) => receive({ session, destination })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._walkable({ space, from: position, to: destination }).is({ walkable: false }),
    )
    .then(respond({ error: "INVALID_MOVE" })),
);

const MoveFreeNoSession = endpoint(
  "/fairs/move-free",
  ({ session, destination }) => receive({ session, destination })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
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

const GuestEnterFair = endpoint(
  "/fairs/guest-enter",
  ({ fair, token, person, position }) => receive({ fair, token })
    .where(Hosting._exists({ fair }).is({ exists: true }))
    .then(Navigating.enterGuest({ token, space: fair }).responds({ person, position }))
    .then(respond({ person, position })),
  { input: { required: ["fair", "token"] }, validators: { input: guestFairInput } },
);

const GuestEnterUnknownFair = endpoint(
  "/fairs/guest-enter",
  ({ fair, token }) => receive({ fair, token })
    .where(Hosting._exists({ fair }).is({ exists: false }))
    .then(respond({ error: "NOT_FOUND" })),
);

const GuestMove = endpoint(
  "/fairs/guest-move",
  ({ token, destination, person, position, previous, space }) => receive({ token, destination })
    .where(
      Navigating._guestLocation({ token }).is({ person, space, position: previous }),
      Exhibiting._walkable({ space, from: previous, to: destination }).is({ walkable: true }),
    )
    .then(Navigating.moveGuest({ token, destination }).responds({ person, position }))
    .then(respond({ person, position })),
  { input: { required: ["token", "destination"] }, validators: { input: guestMoveInput } },
);

const GuestMoveBlocked = endpoint(
  "/fairs/guest-move",
  ({ token, destination, space, position }) => receive({ token, destination })
    .where(
      Navigating._guestLocation({ token }).is({ space, position }),
      Exhibiting._walkable({ space, from: position, to: destination }).is({ walkable: false }),
    )
    .then(respond({ error: "INVALID_MOVE" })),
);

const GuestMoveFree = endpoint(
  "/fairs/guest-move-free",
  ({ token, destination, person, space, position, previous }) => receive({ token, destination })
    .where(
      Navigating._guestLocation({ token }).is({ person, space, position: previous }),
      Exhibiting._walkable({ space, from: previous, to: destination }).is({ walkable: true }),
    )
    .then(Navigating.moveGuestFree({ token, destination }).responds({ person, position }))
    .then(respond({ person, position })),
  { input: { required: ["token", "destination"] }, validators: { input: guestFreeMoveInput } },
);

const GuestMoveFreeBlocked = endpoint(
  "/fairs/guest-move-free",
  ({ token, destination, space, position }) => receive({ token, destination })
    .where(
      Navigating._guestLocation({ token }).is({ space, position }),
      Exhibiting._walkable({ space, from: position, to: destination }).is({ walkable: false }),
    )
    .then(respond({ error: "INVALID_MOVE" })),
);

const GuestLeaveFair = endpoint(
  "/fairs/guest-leave",
  ({ token, person }) => receive({ token })
    .then(Navigating.leaveGuest({ token }).responds({ person }))
    .then(respond({ left: true })),
  { input: { required: ["token"] }, validators: { input: guestTokenInput } },
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
      .then(Calling.open({ host: person, place: booth, joinUrl, mode: "OPEN_GROUP" }).responds({ call }))
      .then(respond({ call })),
  { input: { required: ["session", "booth", "joinUrl"] }, validators: { input: openCallInput } },
);

const OpenInviteCall = endpoint(
  "/calls/open-invite",
  ({ session, person, booth, joinUrl, space, position, call }) =>
    receive({ session, booth, joinUrl })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
        Exhibiting._get({ booth }).is({ space }),
        Navigating._location({ person }).is({ space, position }),
        Exhibiting._contains({ booth, position }).is({ contains: true }),
      )
      .then(Calling.open({ host: person, place: booth, joinUrl, mode: "INVITE_ONLY" }).responds({ call }))
      .then(respond({ call })),
  { input: { required: ["session", "booth", "joinUrl"] }, validators: { input: openCallInput } },
);

const ResumeInviteCall = endpoint(
  "/calls/resume-invite",
  ({ session, person, booth, space, position, call }) =>
    receive({ session, booth })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
        Exhibiting._get({ booth }).is({ space }),
        Navigating._location({ person }).is({ space, position }),
        Exhibiting._contains({ booth, position }).is({ contains: true }),
        Queueing._paused({ target: booth }).is({ paused: true }),
        Calling._suspendedAt({ place: booth }).is({ suspended: true }),
      )
      .then(Calling.resume({ host: person, place: booth }).responds({ call }))
      .then(Queueing.resume({ target: booth }))
      .then(respond({ call })),
  { input: { required: ["session", "booth"] } },
);

const ChangeCallMode = endpoint(
  "/calls/mode",
  ({ session, person, call, mode, joinUrl, booth, space, position }) =>
    receive({ session, call, mode, joinUrl })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Calling._hostedBy({ host: person }).is({ call, place: booth }),
        Exhibiting._get({ booth }).is({ space }),
        Navigating._location({ person }).is({ space, position }),
        Exhibiting._contains({ booth, position }).is({ contains: true }),
      )
      .then(Calling.changeMode({ host: person, call, mode, joinUrl }))
      .then(respond({ call, mode })),
  { input: { required: ["session", "call", "mode", "joinUrl"] }, validators: { input: modeInput } },
);

const ChangeCallModeNotHost = endpoint(
  "/calls/mode",
  ({ session, person, call, mode, joinUrl }) => receive({ session, call, mode, joinUrl })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Calling._isHost({ host: person, call }).is({ hosting: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const ChangeCallModeNoSession = endpoint(
  "/calls/mode",
  ({ session, call, mode, joinUrl }) => receive({ session, call, mode, joinUrl })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const MyQueueStatus = former(
  "the queue request of (person) at (booth)",
  ({ person, booth }, { order, invitedUntil }) => form({
    requests: each(Queueing._mine({ person, target: booth }).is({ order, invitedUntil }))
      .form({ order, invitedUntil }),
  }),
);

const BoothQueue = former(
  "the waiting and invited visitors at (booth)",
  ({ booth }, { person, order, invitedUntil }) => form({
    visitors: each(Queueing._requests({ target: booth }).is({ person, order, invitedUntil }))
      .form({ person, order, invitedUntil }),
  }),
);

const JoinQueue = endpoint(
  "/queues/join",
  ({ session, person, booth, space, order }) =>
    receive({ session, booth })
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Exhibiting._get({ booth }).is({ space }),
        Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: false }),
        Navigating._inSpace({ person, space }).is({ present: true }),
        Calling._openAt({ place: booth }).is({ mode: "INVITE_ONLY" }),
      )
      .then(Queueing.join({ person, target: booth }).responds({ order }))
      .then(respond({ order })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const JoinQueueRepresentative = endpoint(
  "/queues/join",
  ({ session, person, booth }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const GuestJoinQueue = endpoint(
  "/queues/guest-join",
  ({ code, booth, token, space, person, order }) =>
    receive({ code, booth, token })
      .where(
        Hosting._byCode({ code }).is({ fair: space }),
        Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
        Navigating._guestLocation({ token }).is({ person, space }),
        Calling._openAt({ place: booth }).is({ mode: "INVITE_ONLY" }),
      )
      .then(Queueing.join({ person, target: booth }).responds({ order }))
      .then(respond({ order })),
  { input: { required: ["code", "booth", "token"] }, validators: { input: guestCallInput } },
);

const LeaveQueue = endpoint(
  "/queues/leave",
  ({ session, person, booth }) => receive({ session, booth })
    .then(Sessioning.current({ session }).responds({ subject: person }))
    .then(Queueing.leave({ person, target: booth }))
    .then(respond({ left: true })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const GuestLeaveQueue = endpoint(
  "/queues/guest-leave",
  ({ code, booth, token, space, person }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ person, space }),
    )
    .then(Queueing.leave({ person, target: booth }))
    .then(respond({ left: true })),
  { input: { required: ["code", "booth", "token"] }, validators: { input: guestCallInput } },
);

const GetMyQueueStatus = endpoint(
  "/queues/mine",
  ({ session, person, booth }) => receive({ session, booth })
    .then(Sessioning.current({ session }).responds({ subject: person }))
    .then(respond({ status: MyQueueStatus({ person, booth }) })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const GuestMyQueueStatus = endpoint(
  "/queues/guest-mine",
  ({ code, booth, token, space, person }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ person, space }),
    )
    .then(respond({ status: MyQueueStatus({ person, booth }) })),
  { input: { required: ["code", "booth", "token"] }, validators: { input: guestCallInput } },
);

const GetBoothQueue = endpoint(
  "/queues/booth",
  ({ session, person, booth, space, position }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
    )
    .then(respond({ queue: BoothQueue({ booth }) })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const SetQueueAccepting = endpoint(
  "/queues/accepting",
  ({ session, person, booth, accepting, space, position }) => receive({ session, booth, accepting })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
      Calling._openAt({ place: booth }).is({ mode: "INVITE_ONLY" }),
    )
    .then(Queueing.setAccepting({ target: booth, accepting }))
    .then(respond({ accepting })),
  { input: { required: ["session", "booth", "accepting"] }, validators: { input: acceptingInput } },
);

const SetQueueAcceptingNotRepresentative = endpoint(
  "/queues/accepting",
  ({ session, person, booth, accepting }) => receive({ session, booth, accepting })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const SetQueueAcceptingNoSession = endpoint(
  "/queues/accepting",
  ({ session, booth, accepting }) => receive({ session, booth, accepting })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const RemoveFromQueue = endpoint(
  "/queues/remove",
  ({ session, person, booth, visitor, space, position }) => receive({ session, booth, visitor })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
    )
    .then(Queueing.remove({ person: visitor, target: booth }))
    .then(respond({ removed: true })),
  { input: { required: ["session", "booth", "visitor"] }, validators: { input: removeQueueInput } },
);

const InviteNext = endpoint(
  "/queues/invite-next",
  ({ session, person, booth, space, position, visitor, invitedUntil }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
      Calling._openAt({ place: booth }).is({ mode: "INVITE_ONLY" }),
    )
    .then(Queueing.inviteNext({ target: booth }).responds({ person: visitor, invitedUntil }))
    .then(respond({ visitor, invitedUntil })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const InviteNextNotRepresentative = endpoint(
  "/queues/invite-next",
  ({ session, person, booth }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const InviteNextNoSession = endpoint(
  "/queues/invite-next",
  ({ session, booth }) => receive({ session, booth })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const ClaimInvitation = endpoint(
  "/calls/claim-invitation",
  ({ session, person, booth, space, call, joinUrl }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._inSpace({ person, space }).is({ present: true }),
      Queueing._invited({ person, target: booth }).is({ invited: true }),
      Calling._openAt({ place: booth }).is({ call, mode: "INVITE_ONLY" }),
    )
    .then(Calling.join({ person, call }).responds({ joinUrl }))
    .then(respond({ joinUrl })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const ClaimInvitationNotInvited = endpoint(
  "/calls/claim-invitation",
  ({ session, person, booth, space }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._inSpace({ person, space }).is({ present: true }),
      Queueing._invited({ person, target: booth }).is({ invited: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const GuestClaimInvitation = endpoint(
  "/calls/guest-claim-invitation",
  ({ code, booth, token, person, space, call, joinUrl }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ person, space }),
      Queueing._invited({ person, target: booth }).is({ invited: true }),
      Calling._openAt({ place: booth }).is({ call, mode: "INVITE_ONLY" }),
    )
    .then(Calling.join({ person, call }).responds({ joinUrl }))
    .then(respond({ joinUrl })),
  { input: { required: ["code", "booth", "token"] }, validators: { input: guestCallInput } },
);

const GuestClaimInvitationNotInvited = endpoint(
  "/calls/guest-claim-invitation",
  ({ code, booth, token, person, space }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ person, space }),
      Queueing._invited({ person, target: booth }).is({ invited: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const JoinCallInviteOnly = endpoint(
  "/calls/join",
  ({ session, person, booth, space, position }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
      Calling._openAt({ place: booth }).is({ mode: "INVITE_ONLY" }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const GuestJoinCallInviteOnly = endpoint(
  "/calls/guest-join",
  ({ code, booth, token, space, position }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
      Calling._openAt({ place: booth }).is({ mode: "INVITE_ONLY" }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const GetBoothQueueNotRepresentative = endpoint(
  "/queues/booth",
  ({ session, person, booth }) => receive({ session, booth })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._exists({ booth }).is({ exists: true }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const RemoveFromQueueNotRepresentative = endpoint(
  "/queues/remove",
  ({ session, person, booth, visitor }) => receive({ session, booth, visitor })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Exhibiting._exists({ booth }).is({ exists: true }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
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
        Calling._openAt({ place: booth }).is({ call, mode: "OPEN_GROUP" }),
      )
      .then(Calling.join({ person, call }).responds({ joinUrl }))
      .then(respond({ joinUrl })),
  { input: { required: ["session", "booth"] }, validators: { input: callInput } },
);

const GuestJoinCall = endpoint(
  "/calls/guest-join",
  ({ code, booth, token, space, position, person, call, joinUrl }) =>
    receive({ code, booth, token })
      .where(
        Hosting._byCode({ code }).is({ fair: space }),
        Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
        Navigating._guestLocation({ token }).is({ person, space, position }),
        Exhibiting._contains({ booth, position }).is({ contains: true }),
        Calling._openAt({ place: booth }).is({ call, mode: "OPEN_GROUP" }),
      )
      .then(Calling.join({ person, call }).responds({ joinUrl }))
      .then(respond({ joinUrl })),
  { input: { required: ["code", "booth", "token"] }, validators: { input: guestCallInput } },
);

const GuestJoinCallUnknownFair = endpoint(
  "/calls/guest-join",
  ({ code, booth, token }) => receive({ code, booth, token })
    .where(Hosting._codeExists({ code }).is({ exists: false }))
    .then(respond({ error: "NOT_FOUND" })),
);

const GuestJoinCallWrongBooth = endpoint(
  "/calls/guest-join",
  ({ code, booth, token, space }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: false }),
    )
    .then(respond({ error: "NOT_FOUND" })),
);

const GuestJoinCallClosed = endpoint(
  "/calls/guest-join",
  ({ code, booth, token, space, position }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: true }),
      Calling._isOpen({ place: booth }).is({ open: false }),
    )
    .then(respond({ error: "NOT_FOUND" })),
);

const GuestJoinCallOutside = endpoint(
  "/calls/guest-join",
  ({ code, booth, token, space, position }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestLocation({ token }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const GuestJoinCallAbsent = endpoint(
  "/calls/guest-join",
  ({ code, booth, token, space }) => receive({ code, booth, token })
    .where(
      Hosting._byCode({ code }).is({ fair: space }),
      Exhibiting._inSpace({ booth, space }).is({ inSpace: true }),
      Navigating._guestInSpace({ token, space }).is({ present: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
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
      .where(
        Sessioning._active({ session }).is({ subject: person }),
        Calling._hostedBy({ host: person }).is({ call, mode: "OPEN_GROUP" }),
      )
      .then(Calling.close({ host: person, call }))
      .then(respond({ closed: true })),
  { input: { required: ["session", "call"] }, validators: { input: closeCallInput } },
);

const CloseInviteCall = endpoint(
  "/calls/close",
  ({ session, person, call, booth }) => receive({ session, call })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Calling._hostedBy({ host: person }).is({ call, place: booth, mode: "INVITE_ONLY" }),
    )
    .then(Calling.close({ host: person, call }).responds({ place: booth }))
    .then(Queueing.close({ target: booth }))
    .then(respond({ closed: true })),
);

const CloseCallNotHost = endpoint(
  "/calls/close",
  ({ session, person, call }) => receive({ session, call })
    .where(
      Sessioning._active({ session }).is({ subject: person }),
      Calling._isHost({ host: person, call }).is({ hosting: false }),
    )
    .then(respond({ error: "NOT_ALLOWED" })),
);

const CloseCallNoSession = endpoint(
  "/calls/close",
  ({ session, call }) => receive({ session, call })
    .where(Sessioning._isActive({ session }).is({ active: false }))
    .then(respond({ error: "UNKNOWN_SESSION" })),
);

const InviteCallStartsQueue = reaction(({ host, place, call }) =>
  when(Calling.open({ host, place, mode: "INVITE_ONLY" }).responds({ call }))
    .where(Queueing._exists({ target: place }).is({ exists: false }))
    .then(Queueing.open({ target: place })),
);

const InviteCallResumesQueue = reaction(({ host, place, call }) =>
  when(Calling.open({ host, place, mode: "INVITE_ONLY" }).responds({ call }))
    .where(Queueing._exists({ target: place }).is({ exists: true }))
    .then(Queueing.resume({ target: place })),
);

const GroupCallClosesQueue = reaction(({ host, place, call }) =>
  when(Calling.open({ host, place, mode: "OPEN_GROUP" }).responds({ call }))
    .where(Queueing._exists({ target: place }).is({ exists: true }))
    .then(Queueing.close({ target: place })),
);

const ModeToInviteStartsQueue = reaction(({ host, call, place }) =>
  when(Calling.changeMode({ host, call, mode: "INVITE_ONLY" }).responds({}))
    .where(Calling._hostedBy({ host }).is({ call, place }))
    .then(Queueing.open({ target: place })),
);

const ModeToGroupClosesQueue = reaction(({ host, call, place }) =>
  when(Calling.changeMode({ host, call, mode: "OPEN_GROUP" }).responds({}))
    .where(
      Calling._hostedBy({ host }).is({ call, place }),
      Queueing._exists({ target: place }).is({ exists: true }),
    )
    .then(Queueing.close({ target: place })),
);

const RemovedRepresentativeClosesCall = reaction(({ booth, representative, call }) =>
  when(Exhibiting.removeRepresentative({ booth, representative }).responds({}))
    .where(Calling._openAt({ place: booth }).is({ call, host: representative, mode: "OPEN_GROUP" }))
    .then(Calling.close({ host: representative, call })),
);

const RemovedInviteRepresentativePausesQueue = reaction(({ booth, representative, call }) =>
  when(Exhibiting.removeRepresentative({ booth, representative }).responds({}))
    .where(Calling._openAt({ place: booth }).is({ call, host: representative, mode: "INVITE_ONLY" }))
    .then(Calling.suspend({ host: representative, call }).responds({ place: booth }))
    .then(Queueing.pause({ target: booth })),
);

const HostExitsBoothClosesCall = reaction(({ person, call, booth, position, space }) =>
  when(Navigating.move({ person }).responds({}))
    .where(
      Calling._hostedBy({ host: person }).is({ call, place: booth, mode: "OPEN_GROUP" }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    )
    .then(Calling.close({ host: person, call })),
);

const HostExitsInviteBoothPausesQueue = reaction(({ person, call, booth, position, space }) =>
  when(Navigating.move({ person }).responds({}))
    .where(
      Calling._hostedBy({ host: person }).is({ call, place: booth, mode: "INVITE_ONLY" }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    )
    .then(Calling.suspend({ host: person, call }).responds({ place: booth }))
    .then(Queueing.pause({ target: booth })),
);

const ReturnedRepresentativeResumesInviteCall = reaction(({ person, booth, position, space, call }) =>
  when(Navigating.move({ person }).responds({}))
    .where(
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._at({ space, position }).is({ booth }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Queueing._paused({ target: booth }).is({ paused: true }),
      Calling._suspendedAt({ place: booth }).is({ suspended: true }),
    )
    .then(Calling.resume({ host: person, place: booth }).responds({ call }))
    .then(Queueing.resume({ target: booth })),
);

const FreeHostExitsBoothClosesCall = reaction(({ person, call, booth, position, space }) =>
  when(Navigating.moveFree({ person }).responds({}))
    .where(
      Calling._hostedBy({ host: person }).is({ call, place: booth, mode: "OPEN_GROUP" }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    )
    .then(Calling.close({ host: person, call })),
);

const FreeHostExitsInviteBoothPausesQueue = reaction(({ person, call, booth, position, space }) =>
  when(Navigating.moveFree({ person }).responds({}))
    .where(
      Calling._hostedBy({ host: person }).is({ call, place: booth, mode: "INVITE_ONLY" }),
      Exhibiting._get({ booth }).is({ space }),
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._contains({ booth, position }).is({ contains: false }),
    )
    .then(Calling.suspend({ host: person, call }).responds({ place: booth }))
    .then(Queueing.pause({ target: booth })),
);

const FreeReturnedRepresentativeResumesInviteCall = reaction(({ person, booth, position, space, call }) =>
  when(Navigating.moveFree({ person }).responds({}))
    .where(
      Navigating._location({ person }).is({ space, position }),
      Exhibiting._at({ space, position }).is({ booth }),
      Exhibiting._isRepresentative({ booth, representative: person }).is({ assigned: true }),
      Queueing._paused({ target: booth }).is({ paused: true }),
      Calling._suspendedAt({ place: booth }).is({ suspended: true }),
    )
    .then(Calling.resume({ host: person, place: booth }).responds({ call }))
    .then(Queueing.resume({ target: booth })),
);

const DepartedHostClosesCall = reaction(({ person, call }) =>
  when(Navigating.leave({ person }).responds({}))
    .where(Calling._hostedBy({ host: person }).is({ call, mode: "OPEN_GROUP" }))
    .then(Calling.close({ host: person, call })),
);

const DepartedInviteHostPausesQueue = reaction(({ person, call, booth }) =>
  when(Navigating.leave({ person }).responds({}))
    .where(Calling._hostedBy({ host: person }).is({ call, place: booth, mode: "INVITE_ONLY" }))
    .then(Calling.suspend({ host: person, call }).responds({ place: booth }))
    .then(Queueing.pause({ target: booth })),
);

const DepartedVisitorLeavesQueue = reaction(({ person, target }) =>
  when(Navigating.leave({ person }).responds({}))
    .where(Queueing._targets({ person }).is({ target }))
    .then(Queueing.leave({ person, target })),
);

const DepartedGuestLeavesQueue = reaction(({ person, target }) =>
  when(Navigating.leaveGuest({}).responds({ person }))
    .where(Queueing._targets({ person }).is({ target }))
    .then(Queueing.leave({ person, target })),
);

export const composition = {
  FairPage, PublicFairs, ListPublicFairs, SetFairListing,
  CreateFair, OpenFairCode, FairCodeNotFound, GetFairPage, FairNotFound,
  CreateBooth, CreateSizedBooth, EditBooth, MoveBooth, MoveBoothDuringCall, MoveBoothWhilePaused,
  DeleteBooth,
  SetBoothMeetingLink, GetBoothMeetingLink,
  AddRepresentative, RemoveRepresentative,
  EnterFair, Move, MoveBlocked, MoveNoSession, MoveFree, MoveFreeBlocked, MoveFreeNoSession, LeaveFair,
  GuestEnterFair, GuestEnterUnknownFair, GuestMove, GuestMoveBlocked, GuestMoveFree, GuestMoveFreeBlocked,
  GuestLeaveFair, FairPresence, GetPresence,
  OpenCall, OpenInviteCall, ResumeInviteCall, ChangeCallMode, ChangeCallModeNotHost,
  ChangeCallModeNoSession,
  JoinCall, GuestJoinCall, GuestJoinCallUnknownFair,
  GuestJoinCallWrongBooth, GuestJoinCallClosed, GuestJoinCallOutside,
  GuestJoinCallAbsent, CloseCall, CloseInviteCall, CloseCallNotHost, CloseCallNoSession,
  OpenCallNotRepresentative, OpenCallOutside, OpenCallAbsent,
  JoinCallOutside, JoinCallAbsent, JoinCallClosed,
  OpenCallUnknownBooth, JoinCallUnknownBooth, OpenCallNoSession, JoinCallNoSession,
  RemovedRepresentativeClosesCall, RemovedInviteRepresentativePausesQueue,
  HostExitsBoothClosesCall, HostExitsInviteBoothPausesQueue, ReturnedRepresentativeResumesInviteCall,
  FreeHostExitsBoothClosesCall, FreeHostExitsInviteBoothPausesQueue,
  FreeReturnedRepresentativeResumesInviteCall,
  DepartedHostClosesCall, DepartedInviteHostPausesQueue, DepartedVisitorLeavesQueue,
  DepartedGuestLeavesQueue,
  MyQueueStatus, BoothQueue, JoinQueue, JoinQueueRepresentative, GuestJoinQueue, LeaveQueue, GuestLeaveQueue,
  GetMyQueueStatus, GuestMyQueueStatus, GetBoothQueue,
  SetQueueAccepting, SetQueueAcceptingNotRepresentative, SetQueueAcceptingNoSession,
  RemoveFromQueue, InviteNext, InviteNextNotRepresentative, InviteNextNoSession,
  ClaimInvitation, GuestClaimInvitation,
  ClaimInvitationNotInvited, GuestClaimInvitationNotInvited,
  JoinCallInviteOnly, GuestJoinCallInviteOnly,
  GetBoothQueueNotRepresentative, RemoveFromQueueNotRepresentative,
  InviteCallStartsQueue, InviteCallResumesQueue, GroupCallClosesQueue,
  ModeToInviteStartsQueue, ModeToGroupClosesQueue,
};
