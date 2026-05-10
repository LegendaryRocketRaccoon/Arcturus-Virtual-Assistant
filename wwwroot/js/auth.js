import { initializeApp }                      from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         sendPasswordResetEmail,
         onAuthStateChanged }                  from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyB8Ji1solW904fstUbIUcHCD8RnRn8CTsI",
  authDomain:        "deimos---ia.firebaseapp.com",
  databaseURL:       "https://deimos---ia-default-rtdb.firebaseio.com",
  projectId:         "deimos---ia",
  storageBucket:     "deimos---ia.firebasestorage.app",
  messagingSenderId: "418940529875",
  appId:             "1:418940529875:web:feebf6b23874ab81d8b826",
};

const auth = getAuth(initializeApp(firebaseConfig));

function feedback(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = `feedback ${type}`;
  if (type !== "success")
    setTimeout(() => { el.textContent = ""; el.className = "feedback"; }, 5500);
}

window.login = function () {
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value;
  if (!email || !pass) { feedback("login-msg", "Please fill in your email and password.", "error"); return; }

  signInWithEmailAndPassword(auth, email, pass)
    .then(({ user }) => {
      localStorage.setItem("arc_user", user.email);
      window.location.href = "arcturus.html";
    })
    .catch(() => feedback("login-msg", "Invalid credentials. Please try again.", "error"));
};

window.cadastrar = function () {
  const email = document.getElementById("reg-email").value.trim();
  const pass  = document.getElementById("reg-password").value;
  const conf  = document.getElementById("reg-confirm").value;

  if (!email || !pass)  { feedback("reg-msg", "Please fill in all fields.", "error"); return; }
  if (pass !== conf)    { feedback("reg-msg", "Passwords do not match.", "error"); return; }
  if (pass.length < 6)  { feedback("reg-msg", "Password must be at least 6 characters.", "error"); return; }

  createUserWithEmailAndPassword(auth, email, pass)
    .then(() => feedback("reg-msg", "Account created. You can now log in.", "success"))
    .catch(err => feedback("reg-msg", "Error: " + err.message, "error"));
};

window.esqueciSenha = function () {
  const email = document.getElementById("email").value.trim();
  if (!email) { feedback("login-msg", "Enter your email first.", "info"); return; }

  sendPasswordResetEmail(auth, email)
    .then(() => feedback("login-msg", "Reset email sent. Check your inbox.", "success"))
    .catch(err => feedback("login-msg", "Error: " + err.message, "error"));
};

// If already authenticated, redirect
onAuthStateChanged(auth, user => {
  if (user) window.location.href = "arcturus.html";
});

window.switchTab = function (tab) {
  document.querySelectorAll(".tab-btn")  .forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".form-panel").forEach(p => p.classList.toggle("active", p.id === tab + "-panel"));
};