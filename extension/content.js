// Reels Quick Block: floating "Block @user" button on Instagram reels.
(() => {
  const IG_APP_ID = "936619743392459";
  const RESERVED = new Set([
    "reels", "reel", "explore", "direct", "accounts", "stories", "p", "tv",
    "about", "legal", "privacy", "terms", "developer", "web", "api", "audio", "explore",
  ]);

  let currentUser = null;
  let confirming = false;
  let busy = false;
  let confirmTimer = null;

  // ---------- UI ----------
  const root = document.createElement("div");
  root.id = "rqb-root";
  root.innerHTML = '<div id="rqb-toast"></div><button id="rqb-btn" type="button"></button>';
  document.documentElement.appendChild(root);
  const btn = root.querySelector("#rqb-btn");
  const toast = root.querySelector("#rqb-toast");

  function showToast(msg, ms = 3000) {
    toast.textContent = msg;
    toast.classList.add("rqb-show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("rqb-show"), ms);
  }

  function render() {
    btn.classList.remove("rqb-confirm", "rqb-done");
    if (!currentUser) { btn.textContent = "Block"; btn.disabled = true; return; }
    btn.disabled = busy;
    if (busy) btn.textContent = `Blocking @${currentUser}…`;
    else if (confirming) { btn.textContent = `Tap again to block @${currentUser}`; btn.classList.add("rqb-confirm"); }
    else btn.textContent = `🚫 Block @${currentUser}`;
  }

  // ---------- Find the reel on screen ----------
  const isReelsPage = () => /^\/(reels?|reel)\//.test(location.pathname);

  function visibleVideo() {
    const mid = window.innerHeight / 2;
    let best = null, bestDist = Infinity;
    for (const v of document.querySelectorAll("video")) {
      const r = v.getBoundingClientRect();
      if (r.height < 150 || r.bottom < 0 || r.top > window.innerHeight) continue;
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bestDist) { bestDist = d; best = v; }
    }
    return best;
  }

  function usernameFromHref(href) {
    try {
      const u = new URL(href, location.origin);
      if (u.origin !== location.origin) return null;
      const m = u.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/(?:reels\/)?$/);
      if (!m || RESERVED.has(m[1].toLowerCase())) return null;
      return m[1];
    } catch { return null; }
  }

  function findReelAuthor() {
    const video = visibleVideo();
    if (!video) return null;
    // Walk up from the video until a container holds a profile link.
    let el = video;
    for (let i = 0; i < 12 && el; i++, el = el.parentElement) {
      for (const a of el.querySelectorAll("a[href]")) {
        const name = usernameFromHref(a.getAttribute("href"));
        if (name) return name;
      }
    }
    return null;
  }

  function refresh() {
    const show = isReelsPage();
    root.classList.toggle("rqb-visible", show);
    if (!show || busy) return;
    const user = findReelAuthor();
    if (user !== currentUser) {
      currentUser = user;
      confirming = false;
      render();
    }
  }

  // ---------- Instagram API ----------
  function csrfToken() {
    const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  async function getUserId(username) {
    const res = await fetch(
      `/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { credentials: "include", headers: { "x-ig-app-id": IG_APP_ID } }
    );
    if (!res.ok) throw new Error(`Profile lookup failed (${res.status})`);
    const json = await res.json();
    const id = json?.data?.user?.id;
    if (!id) throw new Error("Couldn't find that account");
    return id;
  }

  async function blockUser(username) {
    const id = await getUserId(username);
    const body = new URLSearchParams({ container_module: "profile", user_id: id });
    const res = await fetch(`/api/v1/web/friendships/${id}/block/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-csrftoken": csrfToken(),
        "x-ig-app-id": IG_APP_ID,
        "x-requested-with": "XMLHttpRequest",
      },
      body,
    });
    if (!res.ok) throw new Error(`Block failed (${res.status})`);
    const json = await res.json().catch(() => ({}));
    if (json.status && json.status !== "ok") throw new Error(json.message || "Block failed");
    return id;
  }

  async function recordBlock(username, id) {
    const { blocked = [] } = await chrome.storage.local.get("blocked");
    blocked.unshift({ username, id, at: Date.now() });
    await chrome.storage.local.set({ blocked: blocked.slice(0, 500) });
  }

  function skipToNextReel() {
    const video = visibleVideo();
    let el = video;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) {
        el.scrollBy({ top: el.clientHeight, behavior: "smooth" });
        return;
      }
      el = el.parentElement;
    }
    window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
  }

  // ---------- Actions ----------
  async function onActivate() {
    if (!currentUser || busy) return;
    if (!confirming) {
      confirming = true;
      render();
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => { confirming = false; render(); }, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    confirming = false;
    busy = true;
    const user = currentUser;
    render();
    try {
      const id = await blockUser(user);
      await recordBlock(user, id);
      busy = false;
      btn.textContent = `Blocked @${user} ✓`;
      btn.classList.add("rqb-done");
      showToast(`@${user} blocked`);
      const { autoSkip = true } = await chrome.storage.local.get("autoSkip");
      setTimeout(() => {
        if (autoSkip) skipToNextReel();
        currentUser = null;
        refresh();
      }, 900);
    } catch (e) {
      busy = false;
      render();
      showToast(`Couldn't block @${user}: ${e.message}`, 5000);
    }
  }

  btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); onActivate(); });

  // Keyboard: B (press twice to confirm). Ignored while typing.
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "b" || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!isReelsPage()) return;
    e.preventDefault();
    onActivate();
  }, true);

  // Instagram is a SPA; poll cheaply for scroll / navigation changes.
  setInterval(refresh, 500);
  refresh();
  render();
})();
