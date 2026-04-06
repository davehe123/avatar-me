// AvatarMe Cloudflare Worker - AI Avatar Generation API
// Note: FRONTEND_URL and WORKER_URL come from env (wrangler vars) at runtime
const FALLBACK_FRONTEND = "https://avatar-me.pages.dev";

const FAL_API_URL = "https://queue.fal.run/fal-ai/flux-schnell";

// ========== PayPal 配置 ==========
const PAYPAL_BASE = "https://api-m.paypal.com";

async function getPayPalAccessToken(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_SECRET;
  const credentials = btoa(clientId + ":" + secret);
  const res = await fetch(PAYPAL_BASE + "/v1/oauth2/token", {
    method: "POST",
    headers: { "Authorization": "Basic " + credentials, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal OAuth failed: " + await res.text());
  return (await res.json()).access_token;
}

async function paypalApi(path, method, accessToken, body) {
  const res = await fetch(PAYPAL_BASE + path, {
    method,
    headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// ========== 辅助函数 ==========
function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function getSessionToken(request) {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.substring(7);
  const cookies = request.headers.get("Cookie") || "";
  const m = cookies.match(/session_token=([^;]+)/);
  return m ? m[1] : null;
}

function base64urlEncode(data) {
  return btoa(JSON.stringify(data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str) {
  const standard = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(standard);
}

function generateId() {
  return crypto.randomUUID();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ========== 数据库操作 ==========
async function getUserByEmail(env, email) {
  if (!email) return null;
  const result = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  return result;
}

async function getUserById(env, id) {
  if (!id) return null;
  const result = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  return result;
}

async function getSession(env, token) {
  if (!token) return null;
  const result = await env.DB.prepare("SELECT * FROM sessions WHERE token = ?").bind(token).first();
  return result;
}

async function createSession(env, token, userId, expiresAt) {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
  ).bind(token, userId, expiresAt).run();
}

async function deleteSession(env, token) {
  if (!token) return;
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

async function createUser(env, id, email, name, avatar_url) {
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, avatar_url, plan, daily_credits, last_reset_date, created_at) VALUES (?, ?, ?, ?, 'free', 3, ?, CURRENT_TIMESTAMP)"
  ).bind(id, email || "", name || "User", avatar_url || null, todayStr()).run();
}

async function updateUserCredits(env, userId, credits, date) {
  await env.DB.prepare("UPDATE users SET daily_credits = ?, last_reset_date = ? WHERE id = ?").bind(credits, date, userId).run();
}

async function recordGeneration(env, id, userId, style, similarity, inputFeatures, outputUrl) {
  await env.DB.prepare(
    "INSERT INTO generations (id, user_id, style, similarity, input_features, output_url, has_watermark, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)"
  ).bind(id, userId, style, Number(similarity) || 80, inputFeatures || "[]", outputUrl || "").run();
}

// ========== 次数限制检查 ==========
async function checkAndUseCredits(env, userId) {
  const user = await getUserById(env, userId);
  if (!user) return { allowed: false, reason: "用户不存在" };

  if (user.plan !== "free") {
    return { allowed: true, remaining: -1 };
  }

  const today = todayStr();
  if (user.last_reset_date !== today) {
    await updateUserCredits(env, userId, 3, today);
    return { allowed: true, remaining: 3 };
  }

  if (user.daily_credits <= 0) {
    return { allowed: false, reason: "今日次数已用完，请升级到 Pro" };
  }

  await updateUserCredits(env, userId, user.daily_credits - 1, today);
  return { allowed: true, remaining: user.daily_credits - 1 };
}

// ========== 风格提示词 ==========
function getStylePrompt(styleId) {
  const prompts = {
    anime: "Japanese anime style portrait, big expressive eyes, soft lighting, cel shading, manga",
    cartoon: "Pixar Disney 3D cartoon style portrait, vibrant colors, smooth render, character",
    kpop: "Korean K-pop idol illustration style, detailed hair, makeup, fashion, vibrant",
    chibi: "Chibi anime style portrait, cute round face, big head small body, adorable",
    sumin: "Chinese sumi-e ink painting style anime portrait, black ink, traditional",
    rpg: "Fantasy RPG video game character portrait, Zelda Genshin Impact style, epic, detailed armor",
    pixel: "Pixel art style portrait, 16-bit retro video game character, nostalgic",
    cyberpunk: "Cyberpunk 2077 style portrait, neon lights, futuristic, rain, glow effects",
    fantasy: "Epic fantasy Warcraft style portrait, ornate armor, dramatic lighting, legendary",
    steampunk: "Steampunk Victorian style portrait, mechanical gears, brass copper tones, goggles",
    oil: "Rembrandt oil painting portrait, dramatic chiaroscuro lighting, classical, museum quality",
    watercolor: "Watercolor illustration style portrait, soft brush strokes, delicate, artistic",
    sketch: "Pencil sketch portrait, black and white, detailed shading, graphite on paper",
    y2k: "Y2K 2000s aesthetic portrait, butterfly clips, blonde hair, low rise fashion, nostalgic",
    suits: "Handsome businessman suit portrait, sharp jawline, confident pose, professional lighting",
  };
  return prompts[styleId] || styleId;
}

// ========== 请求处理 ==========
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/avatar-me-api", "");

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(request.headers.get("Origin")) });
  }

  // ========== 认证相关 ==========
  if (path === "/auth/google") {
    const state = base64urlEncode({ redirect: url.searchParams.get("redirect") || "/" });
    const scopes = encodeURIComponent("email profile");
    const callback = encodeURIComponent(`${env.WORKER_URL}/auth/callback`);
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${callback}&response_type=code&scope=${scopes}&state=${state}&access_type=offline`;
    return Response.redirect(googleUrl, 302);
  }

  if (path === "/auth/callback") {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Missing code", { status: 400 });

    const FRONTEND = env.FRONTEND_URL || FALLBACK_FRONTEND;

    let state = { redirect: "/" };
    try {
      const stateParam = url.searchParams.get("state");
      if (stateParam) state = JSON.parse(base64urlDecode(stateParam));
    } catch (e) { /* use default */ }

    // 换 access_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.WORKER_URL}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return Response.redirect(`${FRONTEND}/login?error=token_exchange_failed`, 302);
    }

    // 获取用户信息
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      console.error("Google userinfo missing email:", googleUser);
      return Response.redirect(`${FRONTEND}/login?error=userinfo_failed`, 302);
    }

    // 查找或创建用户
    let user = await getUserByEmail(env, googleUser.email);
    if (!user) {
      const userId = generateId();
      await createUser(env, userId, googleUser.email, googleUser.name, googleUser.picture);
      user = await getUserById(env, userId);
    }

    // 创建持久化 session
    const sessionToken = generateId();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await createSession(env, sessionToken, user.id, expiresAt);

    // 确保 redirect 是绝对 URL
    let redirectUrl = state.redirect || `${FRONTEND}/profile`;
    if (!redirectUrl.startsWith("http")) {
      redirectUrl = redirectUrl.startsWith("/") ? `${FRONTEND}${redirectUrl}` : `${FRONTEND}/${redirectUrl}`;
    }

    const response = Response.redirect(`${redirectUrl}?session=${sessionToken}`, 302);
    response.headers.set("Set-Cookie", `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    return response;
  }

  if (path === "/auth/me") {
    const token = getSessionToken(request);
    if (!token) return new Response(JSON.stringify({ error: "未登录" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });

    const session = await getSession(env, token);
    if (!session || session.expires_at < Date.now()) {
      if (session) await deleteSession(env, token);
      return new Response(JSON.stringify({ error: "会话过期" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    }

    const user = await getUserById(env, session.user_id);
    if (!user) return new Response(JSON.stringify({ error: "用户不存在" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });

    const { daily_credits, last_reset_date, ...rest } = user;
    const today = todayStr();
    const remaining = user.plan !== "free" ? -1 : (last_reset_date !== today ? 3 : daily_credits);

    return new Response(JSON.stringify({
      user: { ...rest, remaining_credits: remaining },
    }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }

  if (path === "/auth/logout") {
    const token = getSessionToken(request);
    if (token) await deleteSession(env, token);
    const response = new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    response.headers.set("Set-Cookie", "session_token=; Path=/; HttpOnly; Max-Age=0");
    return response;
  }

  // ========== API ==========
  if (path === "/api/styles") {
    const styles = [
      { id: "anime", name: "日系动漫", category: "anime", emoji: "🎨" },
      { id: "cartoon", name: "美式卡通", category: "anime", emoji: "🎬" },
      { id: "kpop", name: "韩系插画", category: "anime", emoji: "💃" },
      { id: "chibi", name: "Q版卡通", category: "anime", emoji: "🐱" },
      { id: "sumin", name: "水墨动漫", category: "anime", emoji: "🖌️" },
      { id: "rpg", name: "RPG角色", category: "game", emoji: "⚔️" },
      { id: "pixel", name: "像素头像", category: "game", emoji: "👾" },
      { id: "cyberpunk", name: "赛博朋克", category: "game", emoji: "🤖" },
      { id: "fantasy", name: "魔兽风格", category: "game", emoji: "🛡️" },
      { id: "steampunk", name: "蒸汽朋克", category: "game", emoji: "⚙️" },
      { id: "oil", name: "油画肖像", category: "art", emoji: "🖼️" },
      { id: "watercolor", name: "水彩插画", category: "art", emoji: "🎨" },
      { id: "sketch", name: "素描线稿", category: "art", emoji: "✏️" },
      { id: "y2k", name: "Y2K", category: "trendy", emoji: "🦋" },
      { id: "suits", name: "痞帅西装", category: "trendy", emoji: "🤵" },
    ];
    return new Response(JSON.stringify({ styles }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }

  if (path === "/api/user/credits") {
    const token = getSessionToken(request);
    if (!token) return new Response(JSON.stringify({ error: "未登录" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });

    const session = await getSession(env, token);
    if (!session || session.expires_at < Date.now()) {
      return new Response(JSON.stringify({ error: "会话过期" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    }

    const user = await getUserById(env, session.user_id);
    const today = todayStr();
    const remaining = user.plan !== "free" ? -1 : (user.last_reset_date !== today ? 3 : user.daily_credits);

    return new Response(JSON.stringify({ remaining_credits: remaining, plan: user.plan }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }

  if (path === "/api/generate" && request.method === "POST") {
    const token = getSessionToken(request);
    if (!token) return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } });

    const session = await getSession(env, token);
    if (!session || session.expires_at < Date.now()) {
      return new Response(JSON.stringify({ error: "会话过期" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } });
    }

    const check = await checkAndUseCredits(env, session.user_id);
    if (!check.allowed) {
      return new Response(JSON.stringify({ error: check.reason }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } });
    }

    const contentType = request.headers.get("Content-Type") || "";
    let style, similarity, descriptor, imageBase64;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      style = formData.get("style");
      similarity = formData.get("similarity") || "80";
      descriptor = formData.get("descriptor");
      const imageFile = formData.get("image");
      if (imageFile) imageBase64 = btoa(await imageFile.arrayBuffer().then(b => String.fromCharCode(...new Uint8Array(b))));
    } else {
      const body = await request.json();
      style = body.style;
      similarity = body.similarity || "80";
      descriptor = body.descriptor;
      imageBase64 = body.image_base64;
    }

    if (!style || !imageBase64) {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } });
    }

    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
    const prompt = `A high-quality avatar portrait in ${getStylePrompt(style)} style. The face should maintain ${similarity}% visual similarity to the reference photo. Award winning portrait photography, sharp focus, detailed, 4K quality.`;

    let imageUrl;
    if (env.FAL_API_KEY) {
      const falRes = await fetch(FAL_API_URL, {
        method: "POST",
        headers: { Authorization: "Key " + env.FAL_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image_url: imageDataUrl,
          num_inference_steps: 4,
          guidance_scale: 3.5,
          enable_safety_checker: true,
        }),
      });

      if (!falRes.ok) {
        const err = await falRes.text();
        console.error("Fal.ai error:", err);
        return new Response(JSON.stringify({ error: "AI 生成失败，请稍后重试" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } });
      }

      const falData = await falRes.json();
      imageUrl = falData.images?.[0]?.url || falData.image?.url;
    } else {
      imageUrl = `https://picsum.photos/seed/${crypto.randomUUID()}/512/512`;
    }

    const genId = generateId();
    await recordGeneration(env, genId, session.user_id, style, Number(similarity), descriptor || "[]", imageUrl);

    return new Response(JSON.stringify({
      imageUrl,
      generationId: genId,
      remaining: check.remaining,
    }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }

  // ========== PayPal ==========
  if (path === "/api/paypal/create-subscription" && request.method === "POST") {
    const token = getSessionToken(request);
    if (!token) return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } });
    const session = await getSession(env, token);
    if (!session || session.expires_at < Date.now()) return new Response(JSON.stringify({ error: "会话过期" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } });

    const body = await request.json();
    const user = await getUserById(env, session.user_id);

    try {
      const accessToken = await getPayPalAccessToken(env);
      const productRes = await paypalApi("/v1/catalogs/products", "POST", accessToken, {
        name: "AvatarMe Pro",
        description: "AvatarMe Pro 月度订阅 - 无限生成",
        type: "DIGITAL",
      });
      const product = await productRes.json();

      const subRes = await paypalApi("/v1/billing/plans", "POST", accessToken, {
        product_id: product.id,
        name: "AvatarMe Pro Monthly",
        description: "无限 AI 头像生成",
        billing_cycles: [{ frequency: { interval_unit: "MONTH", interval_count: 1 }, tenure_type: "REGULAR", sequence: 1, pricing_scheme: { fixed_price: { value: "4.99", currency_code: "USD" } } }],
        payment_preferences: { auto_bill_outstanding: true, setup_required: false },
      });
      const planData = await subRes.json();

      const orderRes = await paypalApi("/v1/billing/subscriptions", "POST", accessToken, {
        plan_id: planData.id,
        subscriber: { email_address: user.email },
        custom_id: JSON.stringify({ user_id: user.id, plan: "pro" }),
        return_url: `${env.FRONTEND_URL || FALLBACK_FRONTEND}/profile?subscription_return=1&plan=pro`,
        cancel_url: `${env.FRONTEND_URL || FALLBACK_FRONTEND}/profile?subscription_cancel=1`,
      });
      const order = await orderRes.json();
      const approvalUrl = order.links?.find(l => l.rel === "approve")?.href;
      return new Response(JSON.stringify({ approvalUrl }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    } catch (e) {
      console.error("PayPal error:", e);
      return new Response(JSON.stringify({ error: "支付服务错误" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } });
    }
  }

  if (path === "/api/paypal/webhook" && request.method === "POST") {
    const body = await request.json();
    if (body.event_type === "BILLING.SUBSCRIPTION.ACTIVATED" || body.event_type === "BILLING.SUBSCRIPTION.REACTIVATED") {
      const custom = JSON.parse(body.resource.custom_id || "{}");
      if (custom.user_id) {
        await env.DB.prepare("UPDATE users SET plan = ? WHERE id = ?").bind(custom.plan || "pro", custom.user_id).run();
      }
    }
    if (body.event_type === "BILLING.SUBSCRIPTION.CANCELLED" || body.event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
      const custom = JSON.parse(body.resource.custom_id || "{}");
      if (custom.user_id) {
        await env.DB.prepare("UPDATE users SET plan = 'free' WHERE id = ?").bind(custom.user_id).run();
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }

  if (path === "/" || path === "") {
    return new Response(JSON.stringify({ name: "AvatarMe API", version: "1.0.0" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders() } });
}

export default {
  async fetch(request, env, ctx) {
    try {
      const response = await handleRequest(request, env);
      const origin = request.headers.get("Origin") || "*";
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", origin);
      newHeaders.set("Access-Control-Allow-Credentials", "true");
      return new Response(response.body, { status: response.status, headers: newHeaders });
    } catch (e) {
      console.error("Worker error:", e);
      return new Response(JSON.stringify({ error: "Internal Server Error", detail: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
};
