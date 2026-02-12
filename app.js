const users = [
  { username: "admin", password: "supersecret", role: "admin" },
  { username: "user", password: "123456", role: "user" }
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

function unsafeLogin(usernameInput, passwordInput) {
  const whereClause = `username == '${usernameInput}' && password == '${passwordInput}'`;
  sqlPreview.textContent = `SELECT * FROM users WHERE ${whereClause}`;

  const found = users.find((u) => {
    const username = u.username;
    const password = u.password;

    // INTENTIONALLY VULNERABLE: evaluates injected expression
    return eval(whereClause);
  });

  return found || null;
}

loginBtn.addEventListener("click", () => {
  try {
    const user = unsafeLogin(loginUser.value, loginPass.value);

    if (user) {
      localStorage.setItem("role", user.role);
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

  // INTENTIONALLY VULNERABLE: direct HTML injection (DOM XSS)
  comments.innerHTML += `<div class="comment">${text}</div>`;
  commentInput.value = "";
});

openAdminBtn.addEventListener("click", () => {
  // INTENTIONALLY VULNERABLE: client-only auth check
  const role = localStorage.getItem("role");
  if (role === "admin") {
    adminPanel.classList.remove("hidden");
  } else {
    adminPanel.classList.add("hidden");
    alert("Нет доступа: нужна роль admin");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("role");
  adminPanel.classList.add("hidden");
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
