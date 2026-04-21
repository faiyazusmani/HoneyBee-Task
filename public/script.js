// ===== ELEMENTS =====
let count = 0;
let autoColorTimer;

const taskInput = document.getElementById("taskInput");
const todoForm = document.getElementById("todoForm");
const taskList = document.getElementById("taskList");
const countText = document.getElementById("count");

const form = document.getElementById("form");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const contactBtn = document.getElementById("contactBtn");
const registerSection = document.getElementById("registerSection");
const registerMessage = document.getElementById("registerMessage");
const colorCodeText = document.getElementById("colorCode");

// ===== TODO APP =====
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask();
});

function addTask() {
  const task = taskInput.value.trim();
  if (!task) {
    return;
  }

  const li = document.createElement("li");

  const taskText = document.createElement("span");
  taskText.className = "task-text";
  taskText.innerText = task;

  const editInput = document.createElement("input");
  editInput.className = "task-edit-input";
  editInput.type = "text";
  editInput.value = task;
  editInput.style.display = "none";

  taskText.onclick = () => {
    li.classList.toggle("done");
  };

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "task-btn edit-btn";
  editBtn.type = "button";
  editBtn.innerText = "Edit";
  editBtn.onclick = (e) => {
    e.stopPropagation();

    if (editBtn.innerText === "Edit") {
      editInput.value = taskText.innerText;
      taskText.style.display = "none";
      editInput.style.display = "block";
      editBtn.innerText = "Save";
      editInput.focus();
      editInput.select();
      return;
    }

    const cleanValue = editInput.value.trim();
    if (!cleanValue) {
      li.remove();
      count--;
      updateCount();
      return;
    }

    taskText.innerText = cleanValue;
    taskText.style.display = "block";
    editInput.style.display = "none";
    editBtn.innerText = "Edit";
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editBtn.click();
    }
  });

  editInput.addEventListener("blur", () => {
    if (editBtn.innerText === "Save") {
      editBtn.click();
    }
  });

  const delBtn = document.createElement("button");
  delBtn.className = "task-btn delete-btn";
  delBtn.type = "button";
  delBtn.innerText = "Delete";
  delBtn.onclick = (e) => {
    e.stopPropagation();
    li.remove();
    count--;
    updateCount();
  };

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  li.appendChild(taskText);
  li.appendChild(editInput);
  li.appendChild(actions);
  taskList.prepend(li);

  count++;
  updateCount();
  taskInput.value = "";
}

function updateCount() {
  countText.innerText = "Tasks: " + count;
}

// ===== REGISTRATION =====
togglePasswordBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePasswordBtn.innerText = isHidden ? "Hide" : "Show";
  togglePasswordBtn.setAttribute(
    "aria-label",
    isHidden ? "Hide password" : "Show password"
  );
});

contactBtn.addEventListener("click", () => {
  registerSection.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("name").focus();
});

function setRegisterMessage(message, isError = false) {
  registerMessage.innerText = message;
  registerMessage.classList.toggle("error", isError);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    phone: document.getElementById("phone").value.trim()
  };

  setRegisterMessage("");

  if (!data.name || !data.email || !data.password || !data.phone) {
    setRegisterMessage("Please fill all fields", true);
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    setRegisterMessage("Please enter a valid email", true);
    return;
  }

  if (data.password.length < 6) {
    setRegisterMessage("Password must be at least 6 characters", true);
    return;
  }

  const phoneDigits = data.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    setRegisterMessage("Phone number should contain 10 to 15 digits", true);
    return;
  }

  data.phone = phoneDigits;

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const rawBody = await response.text();
    let result = {};

    if (rawBody) {
      try {
        result = JSON.parse(rawBody);
      } catch {
        result = { message: "Server returned an invalid response" };
      }
    }

    if (!response.ok) {
      throw new Error(result.message || "Submission failed");
    }

    setRegisterMessage(result.message || "Submitted successfully");
    form.reset();
    togglePasswordBtn.innerText = "Show";
    togglePasswordBtn.setAttribute("aria-label", "Show password");
  } catch (error) {
    setRegisterMessage("Error: " + error.message, true);
  }
});

// ===== COLOR CHANGER =====
const colorPalette = [
  "#ff7b72",
  "#36cfc9",
  "#7aa2ff",
  "#f59e0b",
  "#e879f9",
  "#22c55e",
  "#fb7185",
  "#0ea5e9"
];

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shiftColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (n) => Math.max(0, Math.min(255, n));
  return rgbToHex(clamp(r + amount), clamp(g + amount), clamp(b + amount));
}

function applyBackgroundColor(baseColor) {
  const soft = shiftColor(baseColor, 70);
  const deep = shiftColor(baseColor, -55);
  const warm = shiftColor(baseColor, 30);

  document.documentElement.style.setProperty(
    "--dynamic-bg",
    `radial-gradient(circle at 12% 15%, ${soft}55 0, transparent 42%), radial-gradient(circle at 88% 16%, ${baseColor}55 0, transparent 40%), linear-gradient(145deg, ${soft} 0%, ${warm} 45%, ${deep} 100%)`
  );

  colorCodeText.innerText = "Current: " + baseColor.toUpperCase();
}

function pickRandomColor() {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

function runAutoColorChange() {
  clearInterval(autoColorTimer);
  autoColorTimer = setInterval(() => {
    applyBackgroundColor(pickRandomColor());
  }, 5000);
}

function changeColor() {
  const nextColor = pickRandomColor();
  applyBackgroundColor(nextColor);
}

applyBackgroundColor(pickRandomColor());
runAutoColorChange();
window.changeColor = changeColor;