import { createApp, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { RoamWireHttp } from "../generated/wire.ts";

const client = createHttpClient<RoamWireHttp>({ baseUrl: "/api" });

createApp({
  setup() {
    const organizer = ref("");
    const name = ref("");
    const fair = ref<{ fair: string; name: string; organizer: string } | null>(null);
    const status = ref("");
    const busy = ref(false);

    async function loadFair(id: string) {
      busy.value = true;
      status.value = "Loading fair…";
      try {
        const result = await client.fairs.page({ fair: id });
        if ("error" in result || !result.page) {
          fair.value = null;
          status.value = "This fair could not be found.";
          return;
        }
        fair.value = result.page;
        status.value = "";
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    async function createFair() {
      if (!organizer.value.trim() || !name.value.trim()) {
        status.value = "Enter an organizer name and a fair name.";
        return;
      }
      busy.value = true;
      status.value = "Creating fair…";
      try {
        const result = await client.fairs.create({
          organizer: organizer.value.trim(),
          name: name.value.trim(),
        });
        if ("error" in result) {
          status.value =
            result.error === "INVALID_REQUEST"
              ? "Enter a valid fair name."
              : "Could not create the fair. Try again.";
          return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set("fair", result.fair);
        window.history.replaceState(null, "", url);
        await loadFair(result.fair);
        if (fair.value) status.value = "Fair created. This URL opens it again.";
      } catch {
        status.value = "Could not reach the server. Try again.";
      } finally {
        busy.value = false;
      }
    }

    onMounted(() => {
      const id = new URLSearchParams(window.location.search).get("fair");
      if (id) void loadFair(id);
    });

    return { organizer, name, fair, status, busy, createFair };
  },
}).mount("#app");
