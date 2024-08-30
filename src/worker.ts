import { Env } from "./types";
import { isGithubPayload, isTelegramPayload } from "./types/typeguards";
import { handleGithubWebhook } from "./handlers/github/webhook";
import { handleTelegramWebhook } from "./handlers/telegram/webhook";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const payload = await request.clone().json();

    try {
      if (isGithubPayload(payload)) {
        await handleGithubWebhook(request, env);
      } else if (isTelegramPayload(payload)) {
        await handleTelegramWebhook(request, env);
      } else {
        return new Response(JSON.stringify({ error: "Invalid environment provided" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response("OK", { status: 200, headers: { "content-type": "application/json" } });
    } catch (err) {
      return handleUncaughtError(err);
    }
  },
};

function handleUncaughtError(error: unknown) {
  console.error(error);
  const status = 500;
  return new Response(JSON.stringify({ error }), { status: status, headers: { "content-type": "application/json" } });
}
