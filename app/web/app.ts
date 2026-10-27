import { computed, createApp, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue/dist/vue.esm-bundler.js";
import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { RoamWireHttp } from "../generated/wire.ts";
import { boothContains, boothLayout, defaultMapExtent, mapObstacles, plantCells, visibleHallDecor, walkableSegment } from "../src/map-geometry.ts";

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

function displayDescription(description: string) {
  const text = description.trim();
  const normalized = text.replace(/\s+/g, " ").toLowerCase();
  return normalized === "representatives can open a video call here. visitors can walk into this booth to get its link."
    ? "" : text;
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
const walkStepMs = 420;
const walkSpeed = 2.2;
const movementSteps: Record<string, [number, number]> = {
  arrowup: [0, -1], w: [0, -1],
  arrowdown: [0, 1], s: [0, 1],
  arrowleft: [-1, 0], a: [-1, 0],
  arrowright: [1, 0], d: [1, 0],
};

function identityHash(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

createApp({
  setup() {
    const mode = ref<"register" | "sign-in">("register");
    const landingView = ref<"enter" | "browse">("enter");
    const accountPanelOpen = ref(false);
    const accountPanelIntent = ref<"create" | "sign-in">("create");
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
    const pendingDeleteBoothId = ref<string | null>(null);
    const boothPanelExpanded = ref(true);
    const directoryOpen = ref(false);
    const boothName = ref("");
    const boothDescription = ref("");
    const boothMeetingUrl = ref("");
    const boothSize = ref<"small" | "medium" | "large">("medium");
    const avatar = reactive({ x: 0, y: 0 });
    const mapViewport = ref<HTMLElement | null>(null);
    const minimapViewport = reactive({ left: 0, top: 0, width: 100, height: 100 });
    const windowWidth = ref(window.innerWidth);
    const joinedFair = ref(false);
    const moving = ref(false);
    const people = ref<Array<{ person: string; position: { x: number; y: number } }>>([]);
    type Facing = "up" | "down" | "left" | "right";
    const facingByPerson = reactive<Record<string, Facing>>({});
    const walkingByPerson = reactive<Record<string, boolean>>({});
    const walkDurationByPerson = reactive<Record<string, number>>({});
    const walkTimers = new Map<string, ReturnType<typeof setTimeout>>();
    const heldMovementKeys = new Map<string, [number, number]>();
    let movementFrame = 0;
    let previousFrame = 0;
    let lastSyncAt = 0;
    let syncInFlight = false;
    const acknowledged = reactive({ x: 0, y: 0 });
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
    const callError = ref<{ booth: string; message: string } | null>(null);
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    let presenceTimer: ReturnType<typeof setInterval> | undefined;
    let countdownTimer: ReturnType<typeof setInterval> | undefined;
    const drafts = reactive<Record<string, { name: string; description: string; representative: string; meetingUrl: string; x: number; y: number }>>({});
    const status = ref("");
    const busy = ref(false);
    watch(busy, (started) => { if (started) status.value = ""; }, { flush: "sync" });
    const canManage = computed(() => account.value !== null && account.value === fair.value?.organizer);
    const visiblePublicFairs = computed(() => publicFairs.value.filter(({ name, organizer }) =>
      `${name} ${organizer}`.toLowerCase().includes(publicQuery.value.trim().toLowerCase()),
    ));
    const visibleBooths = computed(() => fair.value?.booths.filter((booth) =>
      `${booth.name} ${booth.description} ${booth.representatives.map((rep) => rep.representative).join(" ")}`
        .toLowerCase().includes(boothQuery.value.trim().toLowerCase()),
    ) ?? []);
    const mapExtent = computed(() => fair.value?.extent ?? defaultMapExtent);
    const mapStyle = computed(() => ({
      width: `${Math.max(90, windowWidth.value / 10) * mapExtent.value.width}px`,
      height: `${Math.max(90, windowWidth.value / 10) * mapExtent.value.height}px`,
      "--map-columns": String(mapExtent.value.width),
      "--map-rows": String(mapExtent.value.height),
    }));
    const boothAreas = computed(() => fair.value?.booths.map((booth) => {
      const layout = boothLayout({ ...booth.footprint, booth: booth.booth });
      return {
        ...booth,
        style: {
          left: `${booth.footprint.x * 100 / mapExtent.value.width}%`,
          top: `${booth.footprint.y * 100 / mapExtent.value.height}%`,
          width: `${booth.footprint.width * 100 / mapExtent.value.width}%`,
          height: `${booth.footprint.height * 100 / mapExtent.value.height}%`,
        },
        variant: layout.variant,
        furnishings: layout.furnishings.map((item, index) => ({
          ...item,
          key: `${item.kind}-${index}`,
          style: {
            left: `${item.x * 100 / booth.footprint.width}%`,
            top: `${item.y * 100 / booth.footprint.height}%`,
            width: `${item.width * 100 / booth.footprint.width}%`,
            height: `${item.height * 100 / booth.footprint.height}%`,
          },
        })),
        roomy: booth.footprint.width > 1 && booth.footprint.height > 1,
      };
    }) ?? []);
    const hallPlants = computed(() => plantCells.filter(({ x, y }) =>
      !fair.value?.booths.some(({ footprint }) =>
        x >= footprint.x && x < footprint.x + footprint.width &&
        y >= footprint.y && y < footprint.y + footprint.height,
      ),
    ).map(({ x, y }) => ({ x, y, style: {
      left: `${(x + 0.5) * 100 / mapExtent.value.width}%`,
      top: `${(y + 0.5) * 100 / mapExtent.value.height}%`,
      width: `${35 / mapExtent.value.width}%`,
    } })));
    const hallFurniture = computed(() => visibleHallDecor(fair.value?.booths.map(({ footprint }) => footprint) ?? [])
      .map((item) => ({ ...item, style: {
        left: `${(item.x + 0.5) * 100 / mapExtent.value.width}%`,
        top: `${(item.y + 0.5) * 100 / mapExtent.value.height}%`,
        width: `${item.width * 100 / mapExtent.value.width}%`,
        height: `${item.height * 100 / mapExtent.value.height}%`,
      } })));
    const obstacles = computed(() => mapObstacles(fair.value?.booths.map((booth) =>
      ({ ...booth.footprint, booth: booth.booth })) ?? []));
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
      boothContains(selectedBooth.value.footprint, acknowledged) : false);
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
    const mapAvatars = computed(() => {
      const present = [...people.value];
      if (ownPerson.value && joinedFair.value && !present.some(({ person }) => person === ownPerson.value)) {
        present.push({ person: ownPerson.value, position: { x: avatar.x, y: avatar.y } });
      }
      const cellCounts = new Map<string, number>();
      return present.map(({ person, position }) => {
        const own = person === ownPerson.value;
        const x = own ? avatar.x : position.x;
        const y = own ? avatar.y : position.y;
        const cellKey = `${x},${y}`;
        const stack = cellCounts.get(cellKey) ?? 0;
        cellCounts.set(cellKey, stack + 1);
        return {
          person, own, x, y,
          label: own ? "You" : person.startsWith("guest:")
            ? `Guest ${person.slice(6, 10).toUpperCase()}` : person,
          facing: facingByPerson[person] ?? "down",
          walking: walkingByPerson[person] ?? false,
          style: {
            left: `${(x + 0.5) * 100 / mapExtent.value.width}%`,
            top: `${(y + 0.5) * 100 / mapExtent.value.height}%`,
            "--avatar-color": avatarColors.value[person] ?? avatarPalette[0]!,
            "--stack-x": `${(stack % 3 - 1) * 10}px`,
            "--stack-y": `${Math.floor(stack / 3) * 6}px`,
            "--walk-duration": `${own ? 0 : walkDurationByPerson[person] ?? walkStepMs}ms`,
          },
        };
      });
    });

    function selectBooth(id: string, expand = true) {
      selectedBoothId.value = id;
      if (expand) {
        boothPanelExpanded.value = true;
        directoryOpen.value = false;
      }
    }

    function markWalking(person: string, dx: number, dy: number, duration = walkStepMs) {
      if (dx > 0) facingByPerson[person] = "right";
      else if (dx < 0) facingByPerson[person] = "left";
      else if (dy > 0) facingByPerson[person] = "down";
      else if (dy < 0) facingByPerson[person] = "up";
      walkingByPerson[person] = true;
      walkDurationByPerson[person] = duration;
      const previous = walkTimers.get(person);
      if (previous) clearTimeout(previous);
      walkTimers.set(person, setTimeout(() => {
        walkingByPerson[person] = false;
        walkTimers.delete(person);
      }, duration + 40));
    }

    function clearHeldMovement() {
      heldMovementKeys.clear();
      if (movementFrame) cancelAnimationFrame(movementFrame);
      movementFrame = 0;
      previousFrame = 0;
      moving.value = syncInFlight;
      if (ownPerson.value) walkingByPerson[ownPerson.value] = false;
    }
    watch(accountPanelOpen, (open) => {
      if (open) clearHeldMovement();
    });

    function keepAvatarInView() {
      const viewport = mapViewport.value;
      const map = viewport?.querySelector<HTMLElement>(".fair-map");
      if (!viewport || !map) return;
      const left = (avatar.x + 0.5) * map.clientWidth / mapExtent.value.width - viewport.clientWidth / 2;
      const top = (avatar.y + 0.5) * map.clientHeight / mapExtent.value.height - viewport.clientHeight / 2;
      const behavior = moving.value || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      viewport.scrollTo({ left, top, behavior });
      updateMinimapViewport();
    }
    function updateMinimapViewport() {
      const viewport = mapViewport.value;
      const map = viewport?.querySelector<HTMLElement>(".fair-map");
      if (!viewport || !map) return;
      minimapViewport.left = viewport.scrollLeft * 100 / map.clientWidth;
      minimapViewport.top = viewport.scrollTop * 100 / map.clientHeight;
      minimapViewport.width = Math.min(100, viewport.clientWidth * 100 / map.clientWidth);
      minimapViewport.height = Math.min(100, viewport.clientHeight * 100 / map.clientHeight);
    }
    function resizeMap() {
      windowWidth.value = window.innerWidth;
      void nextTick(updateMinimapViewport);
    }
    function panFromMinimap(event: MouseEvent) {
      const viewport = mapViewport.value;
      const map = viewport?.querySelector<HTMLElement>(".fair-map");
      const button = event.currentTarget as HTMLElement;
      if (!viewport || !map) return;
      const bounds = button.getBoundingClientRect();
      const x = event.detail === 0 ? 0.5 : Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = event.detail === 0 ? 0.5 : Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      viewport.scrollTo({
        left: x * map.clientWidth - viewport.clientWidth / 2,
        top: y * map.clientHeight - viewport.clientHeight / 2,
        behavior: "smooth",
      });
    }
    watch(() => [avatar.x, avatar.y, joinedFair.value, mapExtent.value.width, mapExtent.value.height], () => {
      void nextTick(keepAvatarInView);
    });

    function openAccountPanel(intent: "create" | "sign-in") {
      accountPanelIntent.value = intent;
      accountPanelOpen.value = true;
      if (!account.value) mode.value = intent === "sign-in" ? "sign-in" : "register";
    }

    async function loadFair(id: string, silent = false) {
      if (!silent) status.value = "";
      try {
        const result = await client.fairs.page({ fair: id });
        if ("error" in result || !result.page) {
          fair.value = null;
          status.value = "This fair could not be found.";
          return;
        }
        const changedFair = fair.value?.fair !== result.page.fair;
        if (changedFair) {
          clearHeldMovement();
          avatar.x = 0;
          avatar.y = 0;
          Object.assign(acknowledged, { x: 0, y: 0 });
          people.value = [];
          directoryOpen.value = false;
          pendingDeleteBoothId.value = null;
          boothPanelExpanded.value = true;
          for (const timer of walkTimers.values()) clearTimeout(timer);
          walkTimers.clear();
          for (const person of Object.keys(walkingByPerson)) delete walkingByPerson[person];
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
            x: booth.footprint.x,
            y: booth.footprint.y,
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
      const prior = new Map(people.value.map(({ person, position }) => [person, position]));
      for (const { person, position } of result.presence.people) {
        const before = prior.get(person);
        if (!before || person === ownPerson.value || (before.x === position.x && before.y === position.y)) continue;
        const distance = Math.hypot(position.x - before.x, position.y - before.y);
        markWalking(person, position.x - before.x, position.y - before.y,
          Math.min(450, Math.max(100, distance * 450)));
      }
      people.value = result.presence.people;
      const own = people.value.find((person) => person.person === ownPerson.value);
      joinedFair.value = !!own;
      if (own && !moving.value) {
        Object.assign(acknowledged, own.position);
        avatar.x = own.position.x; avatar.y = own.position.y;
      }
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
      Object.assign(acknowledged, { x: 0, y: 0 });
      await refreshPresence(id);
    }

    async function enterGuest(id: string) {
      const result = await client.fairs["guest-enter"]({ fair: id, token: guestToken });
      if ("error" in result) { status.value = messageFor(result.error); return; }
      ownPerson.value = result.person;
      joinedFair.value = true;
      avatar.x = result.position.x;
      avatar.y = result.position.y;
      Object.assign(acknowledged, result.position);
      await refreshPresence(id);
    }

    async function openFairByCode() {
      const code = fairCode.value.trim().toUpperCase();
      if (!/^[A-F0-9]{8}$/.test(code)) {
        status.value = "Enter the eight-character code your organizer shared.";
        return;
      }
      busy.value = true;
      status.value = "";
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
      if (fair.value) accountPanelOpen.value = false;
      document.getElementById("fair-details")?.scrollIntoView({ behavior: "smooth" });
    }

    async function leaveFairView() {
      if (!fair.value || busy.value) return;
      clearHeldMovement();
      busy.value = true;
      try {
        if (joinedFair.value) {
          if (account.value) await client.fairs.leave({});
          else await client.fairs["guest-leave"]({ token: guestToken });
        }
        fair.value = null;
        selectedBoothId.value = null;
        pendingDeleteBoothId.value = null;
        directoryOpen.value = false;
        boothPanelExpanded.value = true;
        joinedFair.value = false;
        people.value = [];
        for (const timer of walkTimers.values()) clearTimeout(timer);
        walkTimers.clear();
        for (const person of Object.keys(walkingByPerson)) delete walkingByPerson[person];
        joinLink.value = "";
        for (const booth of Object.keys(myQueues)) delete myQueues[booth];
        const url = new URL(window.location.href);
        url.searchParams.delete("fair");
        window.history.replaceState(null, "", url);
        landingView.value = "enter";
        status.value = "";
        window.scrollTo(0, 0);
      } catch {
        status.value = "Could not leave the fair. Try again.";
      } finally {
        busy.value = false;
      }
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
      status.value = "";
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
        status.value = "";
        if (accountPanelIntent.value === "sign-in") accountPanelOpen.value = false;
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
        status.value = "";
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
        accountPanelOpen.value = false;
        await loadPublicFairs();
        status.value = "";
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
        status.value = "";
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
        const result = await client.booths["create-sized"]({
          fair: fair.value.fair,
          size: boothSize.value,
          name: boothName.value.trim(),
          description: boothDescription.value.trim(),
          meetingUrl: boothMeetingUrl.value.trim(),
        });
        if ("error" in result) {
          status.value = result.error === "NOT_FOUND"
              ? "That fair was not found or you do not own it."
              : messageFor(result.error);
          return;
        }
        boothName.value = "";
        boothDescription.value = "";
        boothMeetingUrl.value = "";
        await loadFair(fair.value.fair);
        selectedBoothId.value = result.booth;
        status.value = "";
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
        status.value = "";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function moveBooth(booth: string) {
      const draft = drafts[booth];
      if (!draft || !fair.value) return;
      busy.value = true;
      try {
        const result = await client.booths.move({ booth, position: { x: draft.x, y: draft.y } });
        if ("error" in result) {
          status.value = result.error === "CONFLICT"
            ? "That spot overlaps another booth, or this booth has a live or paused call."
            : result.error === "INVALID_REQUEST"
              ? "That booth would go outside the map or cover the entrance."
              : result.error === "NOT_FOUND"
                ? "That booth was not found or you do not own it."
                : messageFor(result.error);
          return;
        }
        await loadFair(fair.value.fair);
        selectedBoothId.value = booth;
        status.value = "Booth location updated.";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function deleteBooth(booth: string) {
      if (!fair.value || pendingDeleteBoothId.value !== booth) return;
      busy.value = true;
      try {
        const result = await client.booths.delete({ booth });
        if ("error" in result) {
          status.value = result.error === "NOT_FOUND"
              ? "That booth was not found or you do not own it."
              : messageFor(result.error);
          return;
        }
        pendingDeleteBoothId.value = null;
        if (selectedBoothId.value === booth) selectedBoothId.value = null;
        delete drafts[booth];
        await loadFair(fair.value.fair, true);
        status.value = "Booth deleted.";
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
        status.value = "";
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
        status.value = "";
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
        status.value = "";
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
        status.value = "";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function resumeInviteCall(booth: string) {
      busy.value = true;
      try {
        const result = await client.calls["resume-invite"]({ booth });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = "";
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
        status.value = "";
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
        status.value = "";
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
        status.value = "";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function claimInvitation(booth: string) {
      const meetingTab = window.open("about:blank", "_blank");
      if (meetingTab) meetingTab.opener = null;
      busy.value = true;
      callError.value = null;
      joinLink.value = "";
      try {
        const result = account.value
          ? await client.calls["claim-invitation"]({ booth })
          : await client.calls["guest-claim-invitation"]({ code: fairCode.value, booth, token: guestToken });
        if ("error" in result) {
          meetingTab?.close();
          callError.value = { booth, message: "That invitation is no longer available. Check the queue status." };
          await refreshQueues();
          return;
        }
        const call = fair.value?.booths.find((candidate) => candidate.booth === booth)?.calls[0];
        joinedCall.value = call?.call ?? "";
        joinedMode.value = call?.mode ?? "";
        if (meetingTab && !meetingTab.closed) meetingTab.location.replace(result.joinUrl);
        else {
          joinLink.value = result.joinUrl;
          callError.value = { booth, message: "Your browser blocked the new tab. Use Open video call below." };
        }
      } catch {
        meetingTab?.close();
        callError.value = { booth, message: "Could not open the video call. Try again." };
      }
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
        status.value = "";
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
        status.value = "";
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
        if (invited) status.value = "";
        await refreshQueues();
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    async function joinCall(booth: string) {
      if (!insideSelectedBooth.value) {
        callError.value = { booth, message: "Move into this booth to open its video call." };
        return;
      }
      const meetingTab = window.open("about:blank", "_blank");
      if (meetingTab) meetingTab.opener = null;
      busy.value = true;
      callError.value = null;
      joinLink.value = "";
      try {
        const result = account.value && joinedFair.value
          ? await client.calls.join({ booth })
          : await client.calls["guest-join"]({ code: fairCode.value, booth, token: guestToken });
        if ("error" in result) {
          meetingTab?.close();
          callError.value = { booth, message: messageFor(result.error) };
          return;
        }
        joinedCall.value = selectedBooth.value?.calls[0]?.call ?? "";
        joinedMode.value = "OPEN_GROUP";
        if (meetingTab && !meetingTab.closed) meetingTab.location.replace(result.joinUrl);
        else {
          joinLink.value = result.joinUrl;
          callError.value = { booth, message: "Your browser blocked the new tab. Use Open video call below." };
        }
      } catch {
        meetingTab?.close();
        callError.value = { booth, message: "Could not open the video call. Try again." };
      }
      finally { busy.value = false; }
    }

    async function closeCall(call: string) {
      busy.value = true;
      try {
        const result = await client.calls.close({ call });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = "";
      } catch { status.value = "Could not reach the server. Try again."; }
      finally { busy.value = false; }
    }

    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    async function syncFreePosition() {
      if (syncInFlight || !fair.value || !joinedFair.value || distance(avatar, acknowledged) < 0.015) return;
      const fairId = fair.value.fair;
      const before = { ...acknowledged };
      const gap = distance(avatar, acknowledged);
      // Key release may sync immediately after the prior update. Stay below the
      // server's distance allowance even when almost no time has elapsed.
      const elapsed = Math.max(0, (performance.now() - lastSyncAt) / 1000);
      const fraction = Math.min(1, Math.min(0.28, 0.08 + 3 * elapsed) / gap);
      const destination = {
        x: Number((acknowledged.x + (avatar.x - acknowledged.x) * fraction).toFixed(3)),
        y: Number((acknowledged.y + (avatar.y - acknowledged.y) * fraction).toFixed(3)),
      };
      syncInFlight = true;
      moving.value = true;
      lastSyncAt = performance.now();
      try {
        const result = account.value
          ? await client.fairs["move-free"]({ destination })
          : await client.fairs["guest-move-free"]({ token: guestToken, destination });
        if (fair.value?.fair !== fairId) return;
        if ("error" in result) {
          avatar.x = before.x; avatar.y = before.y;
          if (result.error !== "INVALID_REQUEST")
            status.value = messageFor(result.error);
          clearHeldMovement();
          moving.value = false;
          await refreshPresence(fairId);
          return;
        }
        Object.assign(acknowledged, destination);
        const oldBooth = fair.value.booths.find(({ footprint }) => boothContains(footprint, before));
        const newBooth = fair.value.booths.find(({ footprint }) => boothContains(footprint, destination));
        if (newBooth && newBooth.booth !== oldBooth?.booth) selectBooth(newBooth.booth, false);
        if (oldBooth?.booth !== newBooth?.booth) await loadFair(fairId, true);
      } catch {
        if (fair.value?.fair === fairId) {
          avatar.x = before.x; avatar.y = before.y;
          status.value = "Could not reach the server. Try again.";
          clearHeldMovement();
        }
      } finally {
        syncInFlight = false;
        lastSyncAt = performance.now();
        moving.value = heldMovementKeys.size > 0;
        if (!heldMovementKeys.size && fair.value?.fair === fairId && distance(avatar, acknowledged) >= 0.015) {
          setTimeout(() => void syncFreePosition(), 110);
        }
      }
    }

    function movementTick(now: number) {
      movementFrame = 0;
      if (!heldMovementKeys.size || !fair.value || !joinedFair.value || accountPanelOpen.value) {
        moving.value = syncInFlight;
        return;
      }
      const delta = previousFrame ? Math.min(0.05, (now - previousFrame) / 1000) : 0;
      previousFrame = now;
      const direction = [...heldMovementKeys.values()].reduce((sum, step) =>
        [sum[0] + step[0], sum[1] + step[1]] as [number, number], [0, 0] as [number, number]);
      const magnitude = Math.hypot(...direction);
      if (magnitude && distance(avatar, acknowledged) < 0.28) {
        const stepLength = Math.min(walkSpeed * delta, 0.28 - distance(avatar, acknowledged));
        const dx = direction[0] / magnitude * stepLength;
        const dy = direction[1] / magnitude * stepLength;
        const current = { x: avatar.x, y: avatar.y };
        const diagonal = { x: current.x + dx, y: current.y + dy };
        if (walkableSegment(current, diagonal, obstacles.value, mapExtent.value)) {
          avatar.x = diagonal.x; avatar.y = diagonal.y;
        } else {
          const horizontal = { x: current.x + dx, y: current.y };
          if (walkableSegment(current, horizontal, obstacles.value, mapExtent.value)) avatar.x = horizontal.x;
          const vertical = { x: avatar.x, y: current.y + dy };
          if (walkableSegment({ x: avatar.x, y: avatar.y }, vertical, obstacles.value, mapExtent.value)) avatar.y = vertical.y;
        }
        if (ownPerson.value) {
          if (Math.abs(dx) > Math.abs(dy)) facingByPerson[ownPerson.value] = dx > 0 ? "right" : "left";
          else facingByPerson[ownPerson.value] = dy > 0 ? "down" : "up";
          walkingByPerson[ownPerson.value] = distance(current, avatar) > 0.001;
        }
      }
      moving.value = true;
      if (now - lastSyncAt >= 90) void syncFreePosition();
      movementFrame = requestAnimationFrame(movementTick);
    }

    function handleMovementKeyDown(event: KeyboardEvent) {
      if (!fair.value || accountPanelOpen.value || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement &&
          (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      const step = movementSteps[key];
      if (!step) return;
      event.preventDefault();
      if (!heldMovementKeys.has(key)) heldMovementKeys.set(key, step);
      if (!movementFrame) movementFrame = requestAnimationFrame(movementTick);
    }

    function handleMovementKeyUp(event: KeyboardEvent) {
      heldMovementKeys.delete(event.key.toLowerCase());
      if (!heldMovementKeys.size) {
        clearHeldMovement();
        void syncFreePosition();
      }
    }

    onMounted(async () => {
      countdownTimer = setInterval(() => { nowMs.value = Date.now(); }, 1000);
      window.addEventListener("keydown", handleMovementKeyDown);
      window.addEventListener("keyup", handleMovementKeyUp);
      window.addEventListener("blur", clearHeldMovement);
      window.addEventListener("resize", resizeMap);
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
      presenceTimer = setInterval(() => {
        if (fair.value && joinedFair.value) void refreshPresence(fair.value.fair);
      }, 300);
    });
    onUnmounted(() => {
      window.removeEventListener("keydown", handleMovementKeyDown);
      window.removeEventListener("keyup", handleMovementKeyUp);
      window.removeEventListener("blur", clearHeldMovement);
      window.removeEventListener("resize", resizeMap);
      clearHeldMovement();
      if (refreshTimer) clearInterval(refreshTimer);
      if (presenceTimer) clearInterval(presenceTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      for (const timer of walkTimers.values()) clearTimeout(timer);
    });

    return {
      mode, landingView, accountPanelOpen, accountPanelIntent, openAccountPanel,
      username, password, account, fairName, listNewFair, fair, fairCode,
      publicFairs, publicQuery, visiblePublicFairs, loadPublicFairs, setFairListing, openFair, leaveFairView,
      boothQuery, visibleBooths, boothAreas, hallPlants, hallFurniture, displayDescription, mapExtent, mapStyle,
      minimapViewport, updateMinimapViewport, panFromMinimap,
      mapAvatars, mapViewport, openFairByCode,
      selectedBoothId, selectedBooth, pendingDeleteBoothId, boothPanelExpanded, directoryOpen, selectBooth, avatar, boothName,
      boothDescription, boothMeetingUrl, boothSize, drafts, status, busy, canManage, submitAuth,
      signOut, createFair, createBooth, editBooth, moveBooth, deleteBooth, setBoothMeetingLink, addRepresentative,
      removeRepresentative,
      joinedFair, people, insideSelectedBooth, representsSelectedBooth,
      callUrl, newCallMode, modeUrl, inviteCount, myQueues, queueRoster, waitingRosterCount,
      selectedCall, selectedQueue, selectedMyRequest, activeRequests, invitationActive, remainingTime,
      joinLink, joinedCall, joinedMode, validJoinLink, callError, openCall, resumeInviteCall, joinCall, closeCall, changeCallMode,
      joinQueue, leaveQueue, claimInvitation, setQueueAccepting, removeQueueVisitor, inviteNext,
    };
  },
}).mount("#app");
