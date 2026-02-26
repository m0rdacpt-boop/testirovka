const users = [
  { username: "admin", password: "supersecret", role: "admin", isActive: true },
  { username: "user", password: "123456", role: "user", isActive: true }
];

const orders = [
  { id: crypto.randomUUID(), owner: "user", item: "Keyboard", note: "Public replacement request" },
  { id: crypto.randomUUID(), owner: "admin", item: "Server access card", note: "Do not expose" },
  { id: crypto.randomUUID(), owner: "user", item: "Mouse", note: "Low priority" }
];

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

const consoleInput = document.getElementById("consoleInput");
const consoleRunBtn = document.getElementById("consoleRunBtn");
const consoleClearBtn = document.getElementById("consoleClearBtn");
const consoleOutput = document.getElementById("consoleOutput");

const orderIdInput = document.getElementById("orderIdInput");
const viewOrderBtn = document.getElementById("viewOrderBtn");
const orderResult = document.getElementById("orderResult");

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
