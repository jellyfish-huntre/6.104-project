import { computed, createApp, onMounted, onUnmounted, reactive, ref } from "vue/dist/vue.esm-bundler.js";
import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { RoamWireHttp } from "../generated/wire.ts";

const client = createHttpClient<RoamWireHttp>({ baseUrl: "/api" });
type FairPage = RoamWireHttp["/fairs/page"]["output"]["page"];
type PublicFair = RoamWireHttp["/fairs/public"]["output"]["directory"]["fairs"][number];

function messageFor(error: string) {
  switch (error) {
    case "UNAUTHORIZED": return "Sign in to continue, or check your password.";
    case "NOT_FOUND": return "That fair, booth, or representative account was not found.";
    case "CONFLICT": return "That username, booth area, or assignment is already in use.";
    case "INVALID_REQUEST": return "Check the information you entered and try again.";
    case "FORBIDDEN": return "Move into this booth, or ask the organizer to assign you as its representative.";
    default: return "The request did not complete. Try again.";
  }
}

function pointsToRoam(value: string) {
  try {
    const link = new URL(value);
    const current = new URL(window.location.href);
    const local = ["localhost", "127.0.0.1"];
    return link.origin === current.origin ||
      (local.includes(link.hostname) && local.includes(current.hostname) && link.port === current.port);
  } catch { return false; }
}

function browserGuestToken() {
  const saved = window.sessionStorage.getItem("roam-guest-token");
  if (saved && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(saved)) return saved;
  const token = crypto.randomUUID();
  window.sessionStorage.setItem("roam-guest-token", token);
  return token;
}

const avatarPalette = [
  "#1d4ed8", "#dc2626", "#15803d", "#9333ea", "#c2410c", "#0f766e",
  "#be185d", "#7c2d12", "#4d7c0f", "#6d28d9", "#0369a1", "#b45309",
];

function identityHash(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

createApp({
  setup() {
    const mode = ref<"register" | "sign-in">("register");
    const username = ref("");
    const password = ref("");
    const account = ref<string | null>(null);
    const guestToken = browserGuestToken();
    const ownPerson = ref<string | null>(null);
    const fairName = ref("");
    const listNewFair = ref(false);
    const fair = ref<FairPage | null>(null);
    const fairCode = ref("");
    const publicFairs = ref<PublicFair[]>([]);
    const publicQuery = ref("");
    const boothQuery = ref("");
    const selectedBoothId = ref<string | null>(null);
    const boothName = ref("");
    const boothDescription = ref("");
    const boothMeetingUrl = ref("");
    const area = reactive({ x: 1, y: 1, width: 2, height: 2 });
    const avatar = reactive({ x: 0, y: 0 });
    const joinedFair = ref(false);
    const moving = ref(false);
    const people = ref<Array<{ person: string; position: { x: number; y: number } }>>([]);
    const callUrl = ref("");
    const newCallMode = ref<"OPEN_GROUP" | "INVITE_ONLY">("OPEN_GROUP");
    const modeUrl = ref("");
    const inviteCount = ref(1);
    const nowMs = ref(Date.now());
    const myQueues = reactive<Record<string, { order: number; invitedUntil: string } | null>>({});
    const queueRoster = ref<Array<{ person: string; order: number; invitedUntil: string }>>([]);
    const waitingRosterCount = computed(() => queueRoster.value.filter((request) => !request.invitedUntil).length);
    const joinLink = ref("");
    const joinedCall = ref("");
    const joinedMode = ref("");
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    let countdownTimer: ReturnType<typeof setInterval> | undefined;
    const drafts = reactive<Record<string, { name: string; description: string; representative: string; meetingUrl: string }>>({});
    const status = ref("");
    const busy = ref(false);
    const canManage = computed(() => account.value !== null && account.value === fair.value?.organizer);
    const visiblePublicFairs = computed(() => publicFairs.value.filter(({ name, organizer }) =>
      `${name} ${organizer}`.toLowerCase().includes(publicQuery.value.trim().toLowerCase()),
    ));
    const visibleBooths = computed(() => fair.value?.booths.filter((booth) =>
      `${booth.name} ${booth.description} ${booth.representatives.map((rep) => rep.representative).join(" ")}`
        .toLowerCase().includes(boothQuery.value.trim().toLowerCase()),
    ) ?? []);
    const selectedBooth = computed(() =>
      fair.value?.booths.find((booth) => booth.booth === selectedBoothId.value) ?? null,
    );
    const selectedCall = computed(() => selectedBooth.value?.calls[0] ?? null);
    const selectedQueue = computed(() => selectedBooth.value?.queues[0] ?? null);
    const selectedMyRequest = computed(() => selectedBoothId.value ? myQueues[selectedBoothId.value] ?? null : null);
    const activeRequests = computed(() => fair.value?.booths.flatMap((booth) =>
      myQueues[booth.booth] ? [{ booth, request: myQueues[booth.booth]! }] : [],
    ) ?? []);
    const validJoinLink = computed(() => !!joinLink.value && !!fair.value?.booths.some((booth) =>
      booth.calls.some((call) => call.call === joinedCall.value && call.mode === joinedMode.value),
    ));
    const invitationActive = (invitedUntil: string) => Date.parse(invitedUntil) > nowMs.value;
    const remainingTime = (invitedUntil: string) => {
      const seconds = Math.max(0, Math.ceil((Date.parse(invitedUntil) - nowMs.value) / 1000));
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    };
    const insideSelectedBooth = computed(() => selectedBooth.value ?
      avatar.x >= selectedBooth.value.footprint.x &&
      avatar.x < selectedBooth.value.footprint.x + selectedBooth.value.footprint.width &&
      avatar.y >= selectedBooth.value.footprint.y &&
      avatar.y < selectedBooth.value.footprint.y + selectedBooth.value.footprint.height : false);
    const representsSelectedBooth = computed(() => !!account.value &&
      !!selectedBooth.value?.representatives.some((rep) => rep.representative === account.value));
    const avatarColors = computed(() => {
      const identities = [...new Set([
        ...people.value.map(({ person }) => person), ...(ownPerson.value ? [ownPerson.value] : []),
      ])].sort();
      const colors: Record<string, string> = {};
      const used = new Set<number>();
      for (const identity of identities) {
        let color = identityHash(identity) % avatarPalette.length;
        for (let offset = 0; offset < avatarPalette.length && used.has(color); offset++) {
          color = (color + 1) % avatarPalette.length;
        }
        if (used.has(color)) colors[identity] = `hsl(${identityHash(identity) % 360} 75% 38%)`;
        else { used.add(color); colors[identity] = avatarPalette[color]!; }
      }
      return colors;
    });
    const mapCells = computed(() => Array.from({ length: 100 }, (_, index) => {
      const x = index % 10;
      const y = Math.floor(index / 10);
      const boothIndex = fair.value?.booths.findIndex(({ footprint }) =>
        x >= footprint.x && x < footprint.x + footprint.width &&
        y >= footprint.y && y < footprint.y + footprint.height,
      ) ?? -1;
      const booth = boothIndex >= 0 ? fair.value?.booths[boothIndex] : undefined;
      const atCell = people.value.filter(({ position }) => position.x === x && position.y === y);
      if (ownPerson.value && avatar.x === x && avatar.y === y &&
          !atCell.some(({ person }) => person === ownPerson.value)) {
        atCell.push({ person: ownPerson.value, position: { x, y } });
      }
      const avatars = atCell.map(({ person }) => ({
        person,
        own: person === ownPerson.value,
        color: avatarColors.value[person] ?? avatarPalette[0]!,
        label: person === ownPerson.value ? "You" : person.startsWith("guest:")
          ? `Guest ${person.slice(6, 10).toUpperCase()}` : person,
      }));
      return {
        x, y, booth,
        avatars: avatars.slice(0, 5), extraAvatars: Math.max(0, avatars.length - 5),
        avatarLabels: avatars.map(({ label }) => label).join(", "),
        hue: (boothIndex * 67 + 195) % 360,
        showName: booth?.footprint.x === x && booth.footprint.y === y,
      };
    }));

    async function loadFair(id: string, silent = false) {
      if (!silent) status.value = "Loading fair…";
      try {
        const result = await client.fairs.page({ fair: id });
        if ("error" in result || !result.page) {
          fair.value = null;
          status.value = "This fair could not be found.";
          return;
        }
        const changedFair = fair.value?.fair !== result.page.fair;
        if (changedFair) {
          avatar.x = 0;
          avatar.y = 0;
        }
        fair.value = result.page;
        if (!result.page.booths.some((booth) => booth.calls.some((call) =>
          call.call === joinedCall.value && call.mode === joinedMode.value))) joinLink.value = "";
        fairCode.value = result.page.code;
        if (!silent) selectedBoothId.value = null;
        for (const booth of result.page.booths) {
          drafts[booth.booth] = silent && drafts[booth.booth] ? drafts[booth.booth]! : {
            name: booth.name,
            description: booth.description,
            representative: drafts[booth.booth]?.representative ?? "",
            meetingUrl: drafts[booth.booth]?.meetingUrl ?? "",
          };
        }
        if (!silent) status.value = "";
        if (!silent || changedFair) {
          if (account.value) await enterFair(id);
          else await enterGuest(id);
        }
        await refreshQueues();
      } catch {
        if (!silent) status.value = "Could not reach the server. Try again.";
      }
    }

    async function refreshPresence(id: string) {
      const result = await client.fairs.presence({ fair: id });
      if ("error" in result || !result.presence) return;
      people.value = result.presence.people;
      const own = people.value.find((person) => person.person === ownPerson.value);
      joinedFair.value = !!own;
      if (own) { avatar.x = own.position.x; avatar.y = own.position.y; }
    }

    async function enterFair(id: string) {
      if (!account.value) return;
      ownPerson.value = account.value;
      await refreshPresence(id);
      if (joinedFair.value) return;
      let result = await client.fairs.enter({ fair: id });
      if ("error" in result && result.error === "CONFLICT") {
        await client.fairs.leave({});
        result = await client.fairs.enter({ fair: id });
      }
      if ("error" in result) { status.value = messageFor(result.error); return; }
      joinedFair.value = true;
      avatar.x = 0; avatar.y = 0;
      await refreshPresence(id);
    }

    async function enterGuest(id: string) {
      const result = await client.fairs["guest-enter"]({ fair: id, token: guestToken });
      if ("error" in result) { status.value = messageFor(result.error); return; }
      ownPerson.value = result.person;
      joinedFair.value = true;
      avatar.x = result.position.x;
      avatar.y = result.position.y;
      await refreshPresence(id);
    }

    async function openFairByCode() {
      const code = fairCode.value.trim().toUpperCase();
      if (!/^[A-F0-9]{8}$/.test(code)) {
        status.value = "Enter the eight-character code your organizer shared.";
        return;
      }
      busy.value = true;
      status.value = "Opening fair…";
      try {
        const result = await client.fairs["by-code"]({ code });
        if ("error" in result) {
          status.value = result.error === "NOT_FOUND"
            ? "No fair has that code. Check it with the organizer."
            : messageFor(result.error);
          return;
        }
        await openFair(result.fair);
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    async function loadPublicFairs() {
      try {
        const result = await client.fairs.public({});
        if (!("error" in result)) publicFairs.value = result.directory.fairs;
      } catch { /* Keep the latest directory if the server is temporarily unavailable. */ }
    }

    async function openFair(id: string) {
      const url = new URL(window.location.href);
      url.searchParams.set("fair", id);
      window.history.replaceState(null, "", url);
      await loadFair(id);
      document.getElementById("fair-details")?.scrollIntoView({ behavior: "smooth" });
    }

    async function submitAuth() {
      const chosenUsername = username.value.trim();
      if (mode.value === "register") {
        if (!/^[A-Za-z0-9_-]{3,32}$/.test(chosenUsername)) {
          status.value = "Use 3 to 32 letters, numbers, underscores, or hyphens for your username. Spaces, periods, and @ are not allowed.";
          return;
        }
        if (password.value.length < 8 || password.value.length > 128) {
          status.value = "Use a password with 8 to 128 characters.";
          return;
        }
      }
      busy.value = true;
      status.value = mode.value === "register" ? "Creating account…" : "Signing in…";
      try {
        const credentials = { username: chosenUsername, password: password.value };
        const result = mode.value === "register"
          ? await client.auth.register(credentials)
          : await client.auth["sign-in"](credentials);
        if ("error" in result) {
          status.value = result.error === "CONFLICT"
            ? "That username is already registered."
            : result.error === "INVALID_REQUEST" && mode.value === "register"
              ? "Use a username with 3 to 32 letters, numbers, underscores, or hyphens, and a password with 8 to 128 characters."
            : messageFor(result.error);
          return;
        }
        if (fair.value) await client.fairs["guest-leave"]({ token: guestToken }).catch(() => {});
        account.value = result.account;
        ownPerson.value = result.account;
        joinedFair.value = false;
        password.value = "";
        status.value = `Signed in as ${result.account}.`;
        if (fair.value) await enterFair(fair.value.fair);
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    async function signOut() {
      busy.value = true;
      try {
        if (joinedFair.value) await client.fairs.leave({});
        const result = await client.auth["sign-out"]({});
        if ("error" in result) {
          status.value = messageFor(result.error);
          return;
        }
        account.value = null;
        ownPerson.value = null;
        joinedFair.value = false;
        people.value = [];
        avatar.x = 0; avatar.y = 0;
        if (fair.value) await enterGuest(fair.value.fair);
        status.value = "Signed out.";
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    async function createFair() {
      busy.value = true;
      try {
        const result = await client.fairs.create({ name: fairName.value.trim() });
        if ("error" in result) {
          status.value = messageFor(result.error);
          return;
        }
        if (listNewFair.value) {
          const listing = await client.fairs.listing({ fair: result.fair, listed: true });
          if ("error" in listing) {
            await openFair(result.fair);
            status.value = `Fair created with code ${result.code}, but public listing failed: ${messageFor(listing.error)}`;
            return;
          }
        }
        await openFair(result.fair);
        await loadPublicFairs();
        if (fair.value) status.value = listNewFair.value
          ? `Fair created and listed publicly. Its code is ${result.code}.`
          : `Fair created. Share code ${result.code} with students.`;
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    async function setFairListing(listed: boolean) {
      if (!fair.value) return;
      busy.value = true;
      try {
        const result = await client.fairs.listing({ fair: fair.value.fair, listed });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        await loadFair(fair.value.fair, true);
        await loadPublicFairs();
        status.value = listed ? "Fair added to the public list." : "Fair removed from the public list.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function createBooth() {
      if (!fair.value) return;
      if (boothMeetingUrl.value && pointsToRoam(boothMeetingUrl.value)) {
        status.value = "Use a video meeting link, not this Roam page's address.";
        return;
      }
      busy.value = true;
      try {
        const result = await client.booths.create({
          fair: fair.value.fair,
          footprint: { ...area },
          name: boothName.value.trim(),
          description: boothDescription.value.trim(),
          meetingUrl: boothMeetingUrl.value.trim(),
        });
        if ("error" in result) {
          status.value = result.error === "CONFLICT"
            ? "That booth area overlaps another booth."
            : result.error === "NOT_FOUND"
              ? "That fair was not found or you do not own it."
              : messageFor(result.error);
          return;
        }
        boothName.value = "";
        boothDescription.value = "";
        boothMeetingUrl.value = "";
        await loadFair(fair.value.fair);
        selectedBoothId.value = result.booth;
        status.value = "Booth added.";
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    async function editBooth(booth: string) {
      const draft = drafts[booth];
      if (!draft || !fair.value) return;
      busy.value = true;
      try {
        const result = await client.booths.edit({
          booth, name: draft.name.trim(), description: draft.description.trim(),
        });
        if ("error" in result) {
          status.value = result.error === "NOT_FOUND"
            ? "That booth was not found or you do not own it."
            : messageFor(result.error);
          return;
        }
        await loadFair(fair.value.fair);
        status.value = "Booth updated.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function setBoothMeetingLink(booth: string, meetingUrl: string) {
      if (!fair.value) return;
      if (meetingUrl && pointsToRoam(meetingUrl)) {
        status.value = "Use a video meeting link, not this Roam page's address.";
        return;
      }
      busy.value = true;
      try {
        const result = await client.booths["meeting-link"].set({ booth, meetingUrl: meetingUrl.trim() });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        drafts[booth]!.meetingUrl = "";
        await loadFair(fair.value.fair, true);
        status.value = meetingUrl.trim() ? "Meeting link saved for this booth." : "Meeting link removed from this booth.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function addRepresentative(booth: string) {
      const representative = drafts[booth]?.representative.trim();
      if (!representative || !fair.value) return;
      busy.value = true;
      try {
        const result = await client.booths.representatives.add({ booth, representative });
        if ("error" in result) {
          status.value = result.error === "CONFLICT"
            ? "That person already represents this booth."
            : result.error === "NOT_FOUND"
              ? "Register that representative account first, and check that you own this booth."
              : messageFor(result.error);
          return;
        }
        drafts[booth]!.representative = "";
        await loadFair(fair.value.fair);
        status.value = "Representative assigned.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function removeRepresentative(booth: string, representative: string) {
      if (!fair.value) return;
      busy.value = true;
      try {
        const result = await client.booths.representatives.remove({ booth, representative });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        await loadFair(fair.value.fair);
        status.value = "Representative removed.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function openCall(booth: string) {
      busy.value = true;
      try {
        let joinUrl = callUrl.value.trim();
        if (newCallMode.value === "OPEN_GROUP" && selectedBooth.value?.meetingLinkSaved) {
          const saved = await client.booths["meeting-link"]({ booth });
          if ("error" in saved) { status.value = messageFor(saved.error); return; }
          joinUrl = saved.joinUrl;
        }
        if (!joinUrl) {
          status.value = "Enter a video call link, or ask the organizer to save one for this booth.";
          return;
        }
        if (pointsToRoam(joinUrl)) {
          status.value = "Use a video meeting link, not this Roam page's address.";
          return;
        }
        const result = newCallMode.value === "INVITE_ONLY"
          ? await client.calls["open-invite"]({ booth, joinUrl })
          : await client.calls.open({ booth, joinUrl });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        callUrl.value = "";
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = newCallMode.value === "INVITE_ONLY" ? "Invite-only call and queue opened." : "Call opened at this booth.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function resumeInviteCall(booth: string) {
      busy.value = true;
      try {
        const result = await client.calls["resume-invite"]({ booth });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = "Invite-only call and queue resumed with the same meeting link.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function changeCallMode(call: string, mode: "OPEN_GROUP" | "INVITE_ONLY") {
      const joinUrl = modeUrl.value.trim();
      if (!joinUrl || pointsToRoam(joinUrl)) {
        status.value = "Enter a video meeting link for the new mode.";
        return;
      }
      busy.value = true;
      try {
        const result = await client.calls.mode({ call, mode, joinUrl });
        if ("error" in result) {
          status.value = result.error === "INVALID_REQUEST" && mode === "INVITE_ONLY"
            ? "Use a different meeting link for invite-only mode." : messageFor(result.error);
          return;
        }
        modeUrl.value = "";
        joinLink.value = "";
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = mode === "INVITE_ONLY" ? "Invite-only queue opened." : "Open group call ready. Waiting requests were cleared.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function refreshQueues() {
      if (!fair.value) return;
      await Promise.all(fair.value.booths.map(async (booth) => {
        if (!booth.queues.length && !myQueues[booth.booth]) return;
        const result = account.value
          ? await client.queues.mine({ booth: booth.booth })
          : await client.queues["guest-mine"]({ code: fairCode.value, booth: booth.booth, token: guestToken });
        if (!("error" in result)) myQueues[booth.booth] = result.status.requests[0] ?? null;
      }));
      const booth = selectedBooth.value;
      if (booth && representsSelectedBooth.value && insideSelectedBooth.value && booth.queues.length) {
        const result = await client.queues.booth({ booth: booth.booth });
        if (!("error" in result)) queueRoster.value = result.queue.visitors;
      } else queueRoster.value = [];
    }

    async function joinQueue(booth: string) {
      busy.value = true;
      try {
        const result = account.value
          ? await client.queues.join({ booth })
          : await client.queues["guest-join"]({ code: fairCode.value, booth, token: guestToken });
        if ("error" in result) {
          status.value = result.error === "CONFLICT"
            ? selectedMyRequest.value ? "You already have a request at this booth."
              : "This booth is not taking new requests right now."
            : messageFor(result.error);
          return;
        }
        await refreshQueues();
        status.value = "You are waiting for an invitation. You can keep exploring.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function leaveQueue(booth: string) {
      busy.value = true;
      try {
        const result = account.value
          ? await client.queues.leave({ booth })
          : await client.queues["guest-leave"]({ code: fairCode.value, booth, token: guestToken });
        if ("error" in result) {
          status.value = result.error === "NOT_FOUND" ? "Your request is no longer in this queue." : messageFor(result.error);
          await refreshQueues();
          return;
        }
        myQueues[booth] = null;
        await refreshQueues();
        status.value = "You left the queue.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function claimInvitation(booth: string) {
      busy.value = true;
      joinLink.value = "";
      try {
        const result = account.value
          ? await client.calls["claim-invitation"]({ booth })
          : await client.calls["guest-claim-invitation"]({ code: fairCode.value, booth, token: guestToken });
        if ("error" in result) { status.value = "That invitation is no longer available. Check the queue status."; await refreshQueues(); return; }
        joinLink.value = result.joinUrl;
        const call = fair.value?.booths.find((candidate) => candidate.booth === booth)?.calls[0];
        joinedCall.value = call?.call ?? "";
        joinedMode.value = call?.mode ?? "";
        status.value = "Meeting link ready. Open it below.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function setQueueAccepting(booth: string, accepting: boolean) {
      busy.value = true;
      try {
        const result = await client.queues.accepting({ booth, accepting });
        if ("error" in result) {
          status.value = result.error === "CONFLICT" ? "This queue is paused or closed." : messageFor(result.error);
          await refreshQueues();
          return;
        }
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = accepting ? "Visitors can request a turn." : "New requests are closed; existing visitors remain in the queue.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function removeQueueVisitor(booth: string, visitor: string) {
      busy.value = true;
      try {
        const result = await client.queues.remove({ booth, visitor });
        if ("error" in result) {
          status.value = result.error === "NOT_FOUND" ? "That visitor is no longer in the queue." : messageFor(result.error);
          await refreshQueues();
          return;
        }
        await refreshQueues();
        status.value = "Visitor removed from the queue.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function inviteNext(booth: string) {
      busy.value = true;
      let invited = 0;
      try {
        for (let n = 0; n < Math.min(3, Math.max(1, inviteCount.value)); n++) {
          const result = await client.queues["invite-next"]({ booth });
          if ("error" in result) {
            if (!invited) status.value = result.error === "NOT_FOUND"
              ? "No visitors are waiting for an invitation." : messageFor(result.error);
            break;
          }
          invited++;
        }
        if (invited) status.value = `${invited} ${invited === 1 ? "visitor" : "visitors"} invited for two minutes.`;
        await refreshQueues();
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function joinCall(booth: string) {
      if (!insideSelectedBooth.value) {
        status.value = "Move into this booth to get its call link.";
        return;
      }
      busy.value = true;
      joinLink.value = "";
      try {
        const result = account.value && joinedFair.value
          ? await client.calls.join({ booth })
          : await client.calls["guest-join"]({ code: fairCode.value, booth, token: guestToken });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        joinLink.value = result.joinUrl;
        joinedCall.value = selectedBooth.value?.calls[0]?.call ?? "";
        joinedMode.value = "OPEN_GROUP";
        status.value = "Call link ready. Open it below.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function closeCall(call: string) {
      busy.value = true;
      try {
        const result = await client.calls.close({ call });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = "Call closed.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function moveAvatar(event: KeyboardEvent) {
      if (!fair.value || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement &&
          (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const steps: Record<string, [number, number]> = {
        arrowup: [0, -1], w: [0, -1],
        arrowdown: [0, 1], s: [0, 1],
        arrowleft: [-1, 0], a: [-1, 0],
        arrowright: [1, 0], d: [1, 0],
      };
      const step = steps[event.key.toLowerCase()];
      if (!step) return;
      event.preventDefault();
      const x = avatar.x + step[0];
      const y = avatar.y + step[1];
      if (x < 0 || x > 9 || y < 0 || y > 9) return;
      if (!joinedFair.value || moving.value) return;
      moving.value = true;
      try {
        const destination = { x, y };
        const result = account.value
          ? await client.fairs.move({ destination })
          : await client.fairs["guest-move"]({ token: guestToken, destination });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        await refreshPresence(fair.value.fair);
        await loadFair(fair.value.fair, true);
      } catch { status.value = "Could not reach the server. Try again."; return; }
      finally { moving.value = false; }
      avatar.x = x;
      avatar.y = y;
      const booth = fair.value.booths.find(({ footprint }) =>
        x >= footprint.x && x < footprint.x + footprint.width &&
        y >= footprint.y && y < footprint.y + footprint.height,
      );
      selectedBoothId.value = booth?.booth ?? null;
    }

    onMounted(async () => {
      countdownTimer = setInterval(() => { nowMs.value = Date.now(); }, 1000);
      window.addEventListener("keydown", moveAvatar);
      const current = await client.auth.current({}).catch(() => ({ error: "UNAVAILABLE" as const }));
      if (!("error" in current)) {
        account.value = current.account;
        ownPerson.value = current.account;
        await client.fairs["guest-leave"]({ token: guestToken }).catch(() => {});
      }
      const id = new URLSearchParams(window.location.search).get("fair");
      await loadPublicFairs();
      if (id) await loadFair(id);
      refreshTimer = setInterval(async () => {
        await loadPublicFairs();
        if (!fair.value) return;
        try {
          if (!account.value) await enterGuest(fair.value.fair);
          else await refreshPresence(fair.value.fair);
          await loadFair(fair.value.fair, true);
        } catch { /* Keep the last available map during a network interruption. */ }
      }, 4000);
    });
    onUnmounted(() => {
      window.removeEventListener("keydown", moveAvatar);
      if (refreshTimer) clearInterval(refreshTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    });

    return {
      mode, username, password, account, fairName, listNewFair, fair, fairCode,
      publicFairs, publicQuery, visiblePublicFairs, loadPublicFairs, setFairListing, openFair,
      boothQuery, visibleBooths, mapCells, openFairByCode,
      selectedBoothId, selectedBooth, avatar, boothName,
      boothDescription, boothMeetingUrl, area, drafts, status, busy, canManage, submitAuth,
      signOut, createFair, createBooth, editBooth, setBoothMeetingLink, addRepresentative,
      removeRepresentative,
      joinedFair, people, insideSelectedBooth, representsSelectedBooth,
      callUrl, newCallMode, modeUrl, inviteCount, myQueues, queueRoster, waitingRosterCount,
      selectedCall, selectedQueue, selectedMyRequest, activeRequests, invitationActive, remainingTime,
      joinLink, joinedCall, joinedMode, validJoinLink, openCall, resumeInviteCall, joinCall, closeCall, changeCallMode,
      joinQueue, leaveQueue, claimInvitation, setQueueAccepting, removeQueueVisitor, inviteNext,
    };
  },
}).mount("#app");
