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

createApp({
  setup() {
    const mode = ref<"register" | "sign-in">("register");
    const username = ref("");
    const password = ref("");
    const account = ref<string | null>(null);
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
    const joinLink = ref("");
    const joinedCall = ref("");
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
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
    const insideSelectedBooth = computed(() => selectedBooth.value ?
      avatar.x >= selectedBooth.value.footprint.x &&
      avatar.x < selectedBooth.value.footprint.x + selectedBooth.value.footprint.width &&
      avatar.y >= selectedBooth.value.footprint.y &&
      avatar.y < selectedBooth.value.footprint.y + selectedBooth.value.footprint.height : false);
    const representsSelectedBooth = computed(() => !!account.value &&
      !!selectedBooth.value?.representatives.some((rep) => rep.representative === account.value));
    const mapCells = computed(() => Array.from({ length: 100 }, (_, index) => {
      const x = index % 10;
      const y = Math.floor(index / 10);
      const boothIndex = fair.value?.booths.findIndex(({ footprint }) =>
        x >= footprint.x && x < footprint.x + footprint.width &&
        y >= footprint.y && y < footprint.y + footprint.height,
      ) ?? -1;
      const booth = boothIndex >= 0 ? fair.value?.booths[boothIndex] : undefined;
      return {
        x, y, booth,
        hasAvatar: avatar.x === x && avatar.y === y,
        others: people.value.filter((person) => person.person !== account.value &&
          person.position.x === x && person.position.y === y).length,
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
        if (fair.value?.fair !== result.page.fair) {
          avatar.x = 0;
          avatar.y = 0;
        }
        fair.value = result.page;
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
        if (account.value && !silent) await enterFair(id);
        else if (!account.value) { joinedFair.value = false; people.value = []; }
      } catch {
        if (!silent) status.value = "Could not reach the server. Try again.";
      }
    }

    async function refreshPresence(id: string) {
      const result = await client.fairs.presence({ fair: id });
      if ("error" in result || !result.presence) return;
      people.value = result.presence.people;
      const own = people.value.find((person) => person.person === account.value);
      joinedFair.value = !!own;
      if (own) { avatar.x = own.position.x; avatar.y = own.position.y; }
    }

    async function enterFair(id: string) {
      if (!account.value) return;
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
        account.value = result.account;
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
        joinedFair.value = false;
        people.value = [];
        avatar.x = 0; avatar.y = 0;
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
        if (selectedBooth.value?.meetingLinkSaved) {
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
        const result = await client.calls.open({ booth, joinUrl });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        callUrl.value = "";
        if (fair.value) await loadFair(fair.value.fair, true);
        status.value = "Call opened at this booth.";
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
          : await client.calls["guest-join"]({ code: fairCode.value, booth });
        if ("error" in result) { status.value = messageFor(result.error); return; }
        joinLink.value = result.joinUrl;
        joinedCall.value = selectedBooth.value?.calls[0]?.call ?? "";
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
      if (account.value) {
        if (!joinedFair.value || moving.value) return;
        moving.value = true;
        try {
          const result = await client.fairs.move({ destination: { x, y } });
          if ("error" in result) { status.value = messageFor(result.error); return; }
          await refreshPresence(fair.value.fair);
          await loadFair(fair.value.fair, true);
        } catch { status.value = "Could not reach the server. Try again."; return; }
        finally { moving.value = false; }
      }
      avatar.x = x;
      avatar.y = y;
      const booth = fair.value.booths.find(({ footprint }) =>
        x >= footprint.x && x < footprint.x + footprint.width &&
        y >= footprint.y && y < footprint.y + footprint.height,
      );
      selectedBoothId.value = booth?.booth ?? null;
    }

    onMounted(async () => {
      window.addEventListener("keydown", moveAvatar);
      const current = await client.auth.current({}).catch(() => ({ error: "UNAVAILABLE" as const }));
      if (!("error" in current)) account.value = current.account;
      const id = new URLSearchParams(window.location.search).get("fair");
      await loadPublicFairs();
      if (id) await loadFair(id);
      refreshTimer = setInterval(async () => {
        await loadPublicFairs();
        if (!fair.value) return;
        try {
          await refreshPresence(fair.value.fair);
          await loadFair(fair.value.fair, true);
        } catch { /* Keep the last available map during a network interruption. */ }
      }, 4000);
    });
    onUnmounted(() => {
      window.removeEventListener("keydown", moveAvatar);
      if (refreshTimer) clearInterval(refreshTimer);
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
      callUrl, joinLink, joinedCall, openCall, joinCall, closeCall,
    };
  },
}).mount("#app");
