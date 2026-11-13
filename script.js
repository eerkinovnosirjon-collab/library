
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAHY_B3QZtxPt-jfdl_Q6eVpYS236-uqHY",
  authDomain: "kutubxona-5b660.firebaseapp.com",
  projectId: "kutubxona-5b660",
  storageBucket: "kutubxona-5b660.firebasestorage.app",
  messagingSenderId: "663714188930",
  appId: "1:663714188930:web:007989f4dafc5f052dee9b",
  measurementId: "G-CDDT7HXJ76"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ELEMENTLAR
const bosh = document.getElementById("bosh");
const forma = document.getElementById("forma");
const saytlarJoy = document.getElementById("saytlar");
const holat = document.getElementById("holat");
const saytForm = document.getElementById("saytForm");
const qoshishBtn = document.getElementById("qoshishBtn");
const fullscreen = document.getElementById("fullscreen");
const saytFrame = document.getElementById("saytFrame");

let foydalanuvchi = null;
let barchaSaytlar = [];

// XABAR
function xabar(matn) {
  holat.textContent = matn;
}

// SAHIFA
function sahifa(s) {
  bosh.classList.toggle("yashirin", s !== "bosh");
  forma.classList.toggle("yashirin", s !== "forma");
}

document.getElementById("homeBtn").onclick = () => {
  sahifa("bosh");
  xabar("");
};

document.getElementById("addBtn").onclick = () => {
  sahifa("forma");
  xabar("");
};

// TO'LIQ EKRANDA OCHISH
function saytOch(s) {
  try {
    const url = new URL(s.link);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Noto'g'ri havola");
    }

    document.getElementById("fullTitle").textContent = s.nom;
    document.getElementById("tashqiLink")?.remove();

    saytFrame.src = url.href;
    fullscreen.classList.remove("yashirin");

  } catch (error) {
    xabar(error.message);
  }
}

// TO'LIQ EKRANDAN CHIQISH
function yopish() {
  fullscreen.classList.add("yashirin");
  saytFrame.src = "about:blank";
}

document.getElementById("closeFull").onclick = yopish;

// ESC BILAN CHIQISH
document.addEventListener("keydown", event => {
  if (event.key === "Escape") yopish();
});

// SAYTLARNI CHIQARISH
function chiqar(saytlar) {
  saytlarJoy.replaceChildren();

  if (saytlar.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Hozircha saytlar yo'q.";
    saytlarJoy.appendChild(p);
    return;
  }

  saytlar.forEach(s => {
    const karta = document.createElement("div");
    karta.className = "karta";

    const nom = document.createElement("h3");
    nom.textContent = s.nom;

    const tavsif = document.createElement("p");
    tavsif.textContent = s.tavsif || "Tavsif yo'q";

    const muallif = document.createElement("p");
    muallif.textContent = "👤 " + s.muallif;

    const ochish = document.createElement("button");
    ochish.className = "ochish";
    ochish.textContent = "Saytni ochish";
    ochish.onclick = () => saytOch(s);

    karta.append(nom, tavsif, muallif, ochish);

    if (s.uid === foydalanuvchi?.uid) {
      const ochirish = document.createElement("button");
      ochirish.className = "ochirish";
      ochirish.textContent = "O'chirish";
      ochirish.onclick = () => saytOchirish(s);

      karta.appendChild(ochirish);
    }

    saytlarJoy.appendChild(karta);
  });
}

// QIDIRUV
function qidir() {
  const soz = document.getElementById("qidiruv")
    .value.toLowerCase().trim();

  const natija = barchaSaytlar.filter(s =>
    (s.nom || "").toLowerCase().includes(soz) ||
    (s.muallif || "").toLowerCase().includes(soz)
  );

  chiqar(natija);
}

document.getElementById("qidiruv").addEventListener("input", qidir);

// FIREBASE ULANISH
async function boshlash() {
  try {
    xabar("Firebase ulanmoqda...");

    const natija = await signInAnonymously(auth);
    foydalanuvchi = natija.user;

    const sorov = query(
      collection(db, "saytlar"),
      orderBy("createdAt", "desc")
    );

    onSnapshot(sorov, snapshot => {
      barchaSaytlar = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      qidir();
      xabar("✅ Firebase ulandi!");
    }, error => {
      console.error(error);
      xabar("Firebase xatosi: " + error.message);
    });

  } catch (error) {
    console.error(error);
    xabar("Ulanish xatosi: " + error.message);
  }
}

// SAYT QO'SHISH
saytForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!foydalanuvchi) {
    xabar("Firebase hali ulanmagan!");
    return;
  }

  const nom = document.getElementById("nom").value.trim();
  const muallif = document.getElementById("muallif").value.trim();
  const link = document.getElementById("link").value.trim();
  const tavsif = document.getElementById("tavsif").value.trim();

  let url;

  try {
    url = new URL(link);
  } catch {
    xabar("Sayt havolasi noto'g'ri!");
    return;
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    xabar("Faqat http yoki https havolalar mumkin!");
    return;
  }

  qoshishBtn.disabled = true;
  qoshishBtn.textContent = "Joylanmoqda...";

  try {
    await addDoc(collection(db, "saytlar"), {
      nom,
      muallif,
      link: url.href,
      tavsif,
      uid: foydalanuvchi.uid,
      createdAt: serverTimestamp()
    });

    saytForm.reset();
    sahifa("bosh");
    xabar("✅ Sayt muvaffaqiyatli qo'shildi!");

  } catch (error) {
    console.error(error);
    xabar("Qo'shishda xatolik: " + error.message);

  } finally {
    qoshishBtn.disabled = false;
    qoshishBtn.textContent = "🚀 Saytni joylash";
  }
});

// SAYTNI O'CHIRISH
async function saytOchirish(s) {
  if (s.uid !== foydalanuvchi?.uid) {
    xabar("Bu saytni o'chira olmaysiz!");
    return;
  }

  if (!confirm("Saytni o'chirmoqchimisiz?")) return;

  try {
    await deleteDoc(doc(db, "saytlar", s.id));
    xabar("Sayt o'chirildi!");
  } catch (error) {
    console.error(error);
    xabar("O'chirish xatosi: " + error.message);
  }
}

// ISHGA TUSHIRISH
boshlash();
