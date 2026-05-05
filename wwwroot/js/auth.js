import { initializeApp }                         from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         sendPasswordResetEmail,
         onAuthStateChanged }                    from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyB8Ji1solW904fstUbIUcHCD8RnRn8CTsI",
  authDomain:        "deimos---ia.firebaseapp.com",
  databaseURL:       "https://deimos---ia-default-rtdb.firebaseio.com",
  projectId:         "deimos---ia",
  storageBucket:     "deimos---ia.firebasestorage.app",
  messagingSenderId: "418940529875",
  appId:             "1:418940529875:web:feebf6b23874ab81d8b826",
  measurementId:     "G-8ZDZ0Y837M"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

function feedback(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = `feedback ${type}`;
  if (type !== "success") setTimeout(() => { el.textContent = ""; el.className = "feedback"; }, 5000);
}

window.login = function () {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) { feedback("login-msg", "Preencha e-mail e senha.", "error"); return; }

  signInWithEmailAndPassword(auth, email, password)
    .then(({ user }) => {
      localStorage.setItem("arc_user", user.email);
      window.location.href = "arcturus.html";
    })
    .catch(err => feedback("login-msg", "Credenciais inválidas. Tente novamente.", "error"));
};

window.cadastrar = function () {
  const email = document.getElementById("reg-email").value.trim();
  const pass  = document.getElementById("reg-password").value;
  const conf  = document.getElementById("reg-confirm").value;

  if (!email || !pass) { feedback("reg-msg", "Preencha todos os campos.", "error"); return; }
  if (pass !== conf)   { feedback("reg-msg", "As senhas não conferem.", "error"); return; }
  if (pass.length < 6) { feedback("reg-msg", "A senha deve ter ao menos 6 caracteres.", "error"); return; }

  createUserWithEmailAndPassword(auth, email, pass)
    .then(() => feedback("reg-msg", "Conta criada! Faça login.", "success"))
    .catch(err => feedback("reg-msg", "Erro: " + err.message, "error"));
};

window.esqueciSenha = function () {
  const email = document.getElementById("email").value.trim();
  if (!email) { feedback("login-msg", "Digite seu e-mail primeiro.", "info"); return; }

  sendPasswordResetEmail(auth, email)
    .then(() => feedback("login-msg", "E-mail de redefinição enviado!", "success"))
    .catch(err => feedback("login-msg", "Erro: " + err.message, "error"));
};

onAuthStateChanged(auth, user => {
  if (user) window.location.href = "arcturus.html";
});

window.switchTab = function (tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".form-panel").forEach(p => p.classList.toggle("active", p.id === tab + "-panel"));
};
