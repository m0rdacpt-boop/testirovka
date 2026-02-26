const users = [
  { username: "admin", password: "supersecret", role: "admin", isActive: true },
  { username: "user", password: "123456", role: "user", isActive: true }
];

const orders = [
  { id: crypto.randomUUID(), owner: "user", item: "Keyboard", note: "Public replacement request" },
  { id: crypto.randomUUID(), owner: "admin", item: "Server access card", note: "Do not expose" },
  { id: crypto.randomUUID(), owner: "user", item: "Mouse", note: "Low priority" }
];

const virtualFiles = {
  "templates/welcome.txt": "Welcome template v1",
  "templates/help.txt": "Help page draft",
  "templates/mail/reset.txt": "Reset your password with token: DEMO-TOKEN",
  "secrets/admin.txt": "FLAG{path-traversal-demo}",
  "secrets/config.env": "INTERNAL_API_KEY=demo-local-key"
};

let labSettings = {
  theme: { accent: "amber" },
  flags: { compact: false }
};

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const sqlPreview = document.getElementById("sqlPreview");
const loginResult = document.getElementById("loginResult");

const commentInput = document.getElementById("commentInput");
const commentBtn = document.getElementById("commentBtn");
const comments = document.getElementById("comments");

const openAdminBtn = document.getElementById("openAdminBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminPanel = document.getElementById("adminPanel");

const orderIdInput = document.getElementById("orderIdInput");
const viewOrderBtn = document.getElementById("viewOrderBtn");
const orderResult = document.getElementById("orderResult");

const noticeInput = document.getElementById("noticeInput");
const applyNoticeBtn = document.getElementById("applyNoticeBtn");
const noticeBanner = document.getElementById("noticeBanner");

const profileJsonInput = document.getElementById("profileJsonInput");
const importProfileBtn = document.getElementById("importProfileBtn");
const profileImportResult = document.getElementById("profileImportResult");

const filePathInput = document.getElementById("filePathInput");
const readFileBtn = document.getElementById("readFileBtn");
const fileReadResult = document.getElementById("fileReadResult");

const settingsJsonInput = document.getElementById("settingsJsonInput");
const applySettingsBtn = document.getElementById("applySettingsBtn");
const checkPollutionBtn = document.getElementById("checkPollutionBtn");
const settingsResult = document.getElementById("settingsResult");

const consoleInput = document.getElementById("consoleInput");
const consoleRunBtn = document.getElementById("consoleRunBtn");
const consoleClearBtn = document.getElementById("consoleClearBtn");
const consoleOutput = document.getElementById("consoleOutput");

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("sessionData") || "{}");
  } catch (e) {
    return {};
  }
}

function safeLogin(usernameInput, passwordInput) {
  // Простое сравнение свойств объекта с переменными
  const found = users.find((u) => {
    return u.username === usernameInput && 
           u.password === passwordInput && 
           u.isActive === true;
  });

  return found || null;
}
loginBtn.addEventListener("click", () => {
  try {
    const user = unsafeLogin(loginUser.value, loginPass.value);

    if (user) {
      localStorage.setItem(
        "sessionData",
        JSON.stringify({ user: user.username, role: user.role, ts: Date.now() })
      );
      loginResult.className = "result ok";
      loginResult.textContent = `Успех: вошли как ${user.username} (role=${user.role})`;
      renderProfileSession();
    } else {
      loginResult.className = "result bad";
      loginResult.textContent = "Ошибка: неверный логин/пароль";
    }
  } catch (e) {
    loginResult.className = "result bad";
    loginResult.textContent = `Ошибка выражения: ${e.message}`;
  }
});

commentBtn.addEventListener("click", () => {
  const text = commentInput.value;

  const newComment = document.createElement("div");
  newComment.className = "comment";
  
  // Ключевое изменение: используем textContent вместо innerHTML
  newComment.textContent = text; 

  comments.appendChild(newComment);
  commentInput.value = "";
});
openAdminBtn.addEventListener("click", () => {
  // INTENTIONALLY VULNERABLE: client-only auth check
  const role = getSession().role;
  if (role == "admin") {
    adminPanel.classList.remove("hidden");
  } else {
    adminPanel.classList.add("hidden");
    alert("Нет доступа: нужна роль admin");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("sessionData");
  adminPanel.classList.add("hidden");
  renderProfileSession();
});

viewOrderBtn.addEventListener("click", () => {
  const id = orderIdInput.value.trim();
  const session = getSession();
  const currentUser = session.user || "guest";
  const order = orders.find((o) => o.id === id);

  if (!order) {
    orderResult.textContent = "Order not found";
    return;
  }

  // INTENTIONALLY VULNERABLE: no owner check, returns any order by ID
  orderResult.textContent =
    `Current user: ${currentUser}\n` +
    `Order ID: ${order.id}\n` +
    `Owner: ${order.owner}\n` +
    `Item: ${order.item}\n` +
    `Internal note: ${order.note}`;
});

function renderNoticeFromHash() {
  const hash = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  if (!hash.startsWith("notice=")) {
    noticeBanner.textContent = "Hash-баннер пуст. Используй #notice=...";
    return;
  }

  try {
    const value = decodeURIComponent(hash.slice("notice=".length));

    // INTENTIONALLY VULNERABLE: reflected DOM XSS via hash -> innerHTML
    noticeBanner.innerHTML = `<strong>Banner:</strong> ${value}`;
  } catch (e) {
    noticeBanner.textContent = `Decode error: ${e.message}`;
  }
}

applyNoticeBtn.addEventListener("click", () => {
  location.hash = `notice=${encodeURIComponent(noticeInput.value)}`;
});

window.addEventListener("hashchange", renderNoticeFromHash);

function renderProfileSession(extra) {
  const session = getSession();
  const lines = [
    "Current sessionData:",
    JSON.stringify(session, null, 2)
  ];
  if (extra) {
    lines.push("", extra);
  }
  profileImportResult.textContent = lines.join("\n");
}

importProfileBtn.addEventListener("click", () => {
  try {
    const patch = JSON.parse(profileJsonInput.value);
    const currentSession = getSession();
    const base = Object.assign({ user: "guest", role: "user", ts: Date.now() }, currentSession);

    // INTENTIONALLY VULNERABLE: mass assignment (no field allowlist)
    Object.assign(base, patch);

    localStorage.setItem("sessionData", JSON.stringify(base));
    renderProfileSession("Импорт выполнен (без проверки разрешенных полей)");
  } catch (e) {
    profileImportResult.textContent = `JSON error: ${e.message}`;
  }
});

function normalizeVirtualPath(pathValue) {
  const parts = [];
  for (const part of pathValue.split("/")) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join("/");
}

readFileBtn.addEventListener("click", () => {
  const rawPath = filePathInput.value.trim();

  // INTENTIONALLY VULNERABLE: checks traversal markers before decode
  if (rawPath.includes("../")) {
    fileReadResult.textContent = "Blocked: '../' detected in raw input";
    return;
  }

  try {
    const decodedPath = decodeURIComponent(rawPath).replace(/\\/g, "/");
    const joined = decodedPath.startsWith("templates/") ? decodedPath : `templates/${decodedPath}`;
    const resolvedPath = normalizeVirtualPath(joined);
    const fileContent = virtualFiles[resolvedPath];

    if (!fileContent) {
      fileReadResult.textContent =
        `Raw: ${rawPath}\nDecoded: ${decodedPath}\nResolved: ${resolvedPath}\n\nFile not found`;
      return;
    }

    fileReadResult.textContent =
      `Raw: ${rawPath}\nDecoded: ${decodedPath}\nResolved: ${resolvedPath}\n\n${fileContent}`;
  } catch (e) {
    fileReadResult.textContent = `Decode error: ${e.message}`;
  }
});

function vulnerableDeepMerge(target, source) {
  for (const key in source) {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key]) {
        target[key] = {};
      }
      vulnerableDeepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function renderPollutionStatus(extra) {
  const polluted = ({}).trainerMode === true;
  const lines = [
    `trainerMode on empty object: ${String(({}).trainerMode)}`,
    `Settings snapshot: ${JSON.stringify(labSettings, null, 2)}`,
    polluted ? "Effect: prototype pollution likely succeeded" : "Effect: no visible pollution yet",
    "Tip: reload page to reset prototype state"
  ];

  if (extra) {
    lines.push(extra);
  }

  settingsResult.textContent = lines.join("\n\n");
}

applySettingsBtn.addEventListener("click", () => {
  try {
    const patch = JSON.parse(settingsJsonInput.value);

    // INTENTIONALLY VULNERABLE: deep merge allows __proto__/constructor/prototype keys
    vulnerableDeepMerge(labSettings, patch);
    renderPollutionStatus("Настройки применены");
  } catch (e) {
    settingsResult.textContent = `JSON error: ${e.message}`;
  }
});

checkPollutionBtn.addEventListener("click", () => {
  renderPollutionStatus("Проверка выполнена");
});

function appendConsoleLine(text) {
  consoleOutput.textContent += `${text}\n`;
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function runConsoleCommand() {
  const command = consoleInput.value.trim();
  if (!command) {
    return;
  }

  appendConsoleLine(`> ${command}`);
  try {
    // INTENTIONALLY VULNERABLE: executes arbitrary JS entered by user
    const result = eval(command);
    appendConsoleLine(String(result));
  } catch (e) {
    appendConsoleLine(`Error: ${e.message}`);
  }
}

consoleRunBtn.addEventListener("click", runConsoleCommand);

consoleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runConsoleCommand();
  }
});

consoleClearBtn.addEventListener("click", () => {
  consoleOutput.textContent = "";
});

renderNoticeFromHash();
renderProfileSession();
renderPollutionStatus();
