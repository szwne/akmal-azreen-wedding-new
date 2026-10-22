
const envelopeScreen = document.getElementById("envelopeScreen");
const openInvitation = document.getElementById("openInvitation");
const openHint = document.getElementById("openHint");
const revealSection = document.getElementById("revealSection");
const invitationContent = document.getElementById("invitationContent");
const weddingFilm = document.getElementById("weddingFilm");
const scrollCue = document.getElementById("scrollCue");
const backToTop = document.getElementById("backToTop");

let invitationOpened = false;

/* GOLD PARTICLES AROUND THE ENVELOPE */
const envelopeWrap = document.querySelector(".envelope-wrap");

if (envelopeWrap) {
  for (let i = 0; i < 16; i++) {
    const particle = document.createElement("span");
    particle.className = "royal-particle";

    particle.style.left = (5 + Math.random() * 90) + "%";
    particle.style.top = (Math.random() * 100) + "%";
    particle.style.animationDelay = (Math.random() * 3) + "s";
    particle.style.animationDuration = (2.5 + Math.random() * 2) + "s";

    envelopeWrap.appendChild(particle);
  }
}

function openEnvelope() {
  if (invitationOpened) return;
  
  invitationOpened = true;

  const weddingSong = document.getElementById("weddingSong");
  if (weddingSong) {
    weddingSong.volume = 0.5;
    weddingSong.play().catch(() => {
      // Tetamu boleh cuba mainkan lagu semula jika diperlukan.
    });
  }

  envelopeScreen.classList.add("opening");


  openInvitation.disabled = true;
  openHint.disabled = true;
  openHint.textContent = "OPENING YOUR INVITATION...";

  window.setTimeout(() => {
    envelopeScreen.style.display = "none";

    revealSection.classList.remove("hidden");
    invitationContent.classList.remove("hidden");

    revealSection.classList.add("show");
    invitationContent.classList.add("show");

    window.scrollTo({ top: 0, behavior: "instant" });

    weddingFilm.play().catch(() => {
      // Video boleh dimulakan semula oleh tetamu jika autoplay disekat.
    });
 }, 1350);
}

openInvitation.addEventListener("click", openEnvelope);
openHint.addEventListener("click", openEnvelope);

scrollCue.addEventListener("click", () => {
  invitationContent.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* Countdown to the wedding */
const weddingDate = new Date("2026-12-20T12:00:00+08:00").getTime();

const pad = (number) => String(number).padStart(2, "0");

function updateCountdown() {
  let difference = weddingDate - Date.now();

  if (difference <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach((id) => {
      document.getElementById(id).textContent = "00";
    });

    document.querySelector(".countdown-heading h2").innerHTML =
      'Hari bahagia mereka <span>♡</span>';

    document.querySelector(".countdown-note").textContent =
      "Selamat pengantin baru, Akmal & Azreen!";

    return;
  }

  const days = Math.floor(difference / 86400000);
  difference %= 86400000;

  const hours = Math.floor(difference / 3600000);
  difference %= 3600000;

  const minutes = Math.floor(difference / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  document.getElementById("days").textContent = pad(days);
  document.getElementById("hours").textContent = pad(hours);
  document.getElementById("minutes").textContent = pad(minutes);
  document.getElementById("seconds").textContent = pad(seconds);
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

/* Back-to-top button */
window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 500);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

/* FLOATING ROSE PETALS */
function createRosePetal() {
    const petal = document.createElement("span");

    petal.className = "rose-petal";
    petal.textContent = Math.random() > 0.5 ? "🌹" : "🌸";

    petal.style.left = Math.random() * 100 + "vw";
    petal.style.fontSize = (12 + Math.random() * 12) + "px";
    petal.style.animationDuration = (8 + Math.random() * 7) + "s";

    document.body.appendChild(petal);

    setTimeout(() => petal.remove(), 16000);
}

setInterval(createRosePetal, 1400);
