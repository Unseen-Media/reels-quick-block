const list = document.getElementById("list");
const autoSkip = document.getElementById("autoSkip");

chrome.storage.local.get({ blocked: [], autoSkip: true }).then(({ blocked, autoSkip: skip }) => {
  autoSkip.checked = skip;
  document.getElementById("count").textContent = blocked.length;
  if (!blocked.length) {
    list.innerHTML = '<li class="empty">Nobody yet.</li>';
    return;
  }
  for (const b of blocked) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `https://www.instagram.com/${b.username}/`;
    a.target = "_blank";
    a.textContent = "@" + b.username;
    const when = document.createElement("span");
    when.textContent = new Date(b.at).toLocaleDateString();
    li.append(a, when);
    list.appendChild(li);
  }
});

autoSkip.addEventListener("change", () => chrome.storage.local.set({ autoSkip: autoSkip.checked }));
