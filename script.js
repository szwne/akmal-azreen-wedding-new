"use strict";
//AKMAL & AZREEN — WEDDING INVITATION
/* GOOGLE SHEETS GUEST WISHES — JSONP API */
const WISHES_API =
"https://script.google.com/macros/s/AKfycbzY3fQInBdLlajCxOSdQNcgzz-g8xYSvtX5auTaoDCBh5bO-iRVB1d4A64KaV_E2VwY-w/exec";

const WISHES_REFRESH_INTERVAL = 15000;
const WISHES_REQUEST_TIMEOUT = 12000;

/* MAIN ELEMENTS */
const envelopeScreen = document.getElementById("envelopeScreen");
const openInvitation = document.getElementById("openInvitation");
const openHint = document.getElementById("openHint");
const revealSection = document.getElementById("revealSection");
const invitationContent = document.getElementById("invitationContent");
const weddingFilm = document.getElementById("weddingFilm");
const scrollCue = document.getElementById("scrollCue");
const backToTop = document.getElementById("backToTop");
const weddingSong = document.getElementById("weddingSong");

let invitationOpened = false;
let wishesRefreshTimer = null;
let wishesRequestTimer = null;
let latestWishes = [];
let lastWishesSignature = "";
let isLoadingWishes = false;
let wishesRequestId = 0;

//GOLD PARTICLES AROUND THE ENVELOPE
const envelopeWrap = document.querySelector(".envelope-wrap");

if (envelopeWrap) {
  for (let i = 0; i < 16; i++) {
    const particle = document.createElement("span");
    particle.className = "royal-particle";
    particle.style.left = `${5 + Math.random() * 90}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 3}s`;
    particle.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    envelopeWrap.appendChild(particle);
  }
}

//OPEN THE WEDDING ENVELOPE

function openEnvelope() {
  if (invitationOpened) return;

  if (!envelopeScreen || !revealSection || !invitationContent) {
    console.error("One or more invitation elements are missing.");
    return;
  }

  invitationOpened = true;

  if (weddingSong) {
    weddingSong.volume = 0.5;

    const audioPromise = weddingSong.play();

    if (audioPromise && typeof audioPromise.catch === "function") {
      audioPromise.catch(() => {});
    }
  }

  envelopeScreen.classList.add("opening");

  if (openInvitation) openInvitation.disabled = true;

  if (openHint) {
    openHint.disabled = true;
    openHint.textContent = "OPENING YOUR INVITATION...";
  }

  window.setTimeout(() => {
    envelopeScreen.style.display = "none";

    revealSection.classList.remove("hidden");
    invitationContent.classList.remove("hidden");

    revealSection.classList.add("show");
    invitationContent.classList.add("show");

    window.scrollTo({ top: 0, behavior: "auto" });

    if (weddingFilm) {
      const videoPromise = weddingFilm.play();

      if (videoPromise && typeof videoPromise.catch === "function") {
        videoPromise.catch(() => {});
      }
    }

    startWishesAutoRefresh();
  }, 1350);
}

if (openInvitation) {
  openInvitation.addEventListener("click", openEnvelope);
}

if (openHint) {
  openHint.addEventListener("click", openEnvelope);
}

if (scrollCue) {
  scrollCue.addEventListener("click", () => {
    if (invitationContent) {
      invitationContent.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

//WEDDING COUNTDOWN

const weddingDate = new Date("2026-12-20T12:00:00+08:00").getTime();

const pad = (number) => String(number).padStart(2, "0");

function updateCountdown() {
  const daysElement = document.getElementById("days");
  const hoursElement = document.getElementById("hours");
  const minutesElement = document.getElementById("minutes");
  const secondsElement = document.getElementById("seconds");

  if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
    return;
  }

  const difference = weddingDate - Date.now();

  if (difference <= 0) {
    daysElement.textContent = "00";
    hoursElement.textContent = "00";
    minutesElement.textContent = "00";
    secondsElement.textContent = "00";

    const heading = document.querySelector(".countdown-heading h2");
    const note = document.querySelector(".countdown-note");

    if (heading) heading.textContent = "Their special day has arrived";
    if (note) note.textContent = "Best wishes to Akmal & Azreen!";

    return;
  }

  daysElement.textContent = String(Math.floor(difference / 86400000));
  hoursElement.textContent = pad(Math.floor((difference % 86400000) / 3600000));
  minutesElement.textContent = pad(Math.floor((difference % 3600000) / 60000));
  secondsElement.textContent = pad(Math.floor((difference % 60000) / 1000));
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

//LIVE GUEST WISHES — JSONP

function setWishesStatus(message) {
  const status = document.getElementById("wishesStatus");

  if (!status) return;

  status.textContent = message;
  status.hidden = false;
}

function formatGuestName(name) {
  return String(name ?? "").trim() || "Guest";
}

function formatGuestMessage(message) {
  return String(message ?? "").trim();
}


function renderWishes(wishes) {
  const list = document.getElementById("wishesList");
  const count = document.getElementById("wishesCount");
  const status = document.getElementById("wishesStatus");
  const updateMessage = document.getElementById("wishesUpdate");

  if (!list) return;

  const validWishes = (Array.isArray(wishes) ? wishes : [])
    .map((wish) => {
      const rawName = String(wish?.name ?? "").trim();
      const rawMessage = String(wish?.message ?? "").trim();

      return {
        name: rawName,
        message: rawMessage
      };
    })
    .filter((wish) => {
      const name = wish.name.toLowerCase().replace(/\s+/g, " ");
      const message = wish.message.toLowerCase().replace(/\s+/g, " ");

      // Ignore completely empty rows.
      if (!wish.name && !wish.message) return false;
      if (!wish.message) return false;

      // Ignore spreadsheet header rows.
      const headerNames = [
        "nama tetamu",
        "name",
        "guest name",
        "nama"
      ];

      const headerMessages = [
        "pesanan",
        "ucapan",
        "pesanan & ucapan kepada pengantin",
        "pesanan dan ucapan kepada pengantin",
        "ucapan kepada pengantin",
        "pesanan kepada pengantin",
        "message",
        "wish",
        "wishes",
        "message to the bride and groom"
      ];

      if (headerNames.includes(name)) return false;
      if (headerMessages.includes(message)) return false;

      // Ignore rows where both cells contain spreadsheet headings.
      if (
        (name.includes("nama tetamu") || name === "name") &&
        (
          message.includes("pesanan") ||
          message.includes("ucapan kepada pengantin")
        )
      ) {
        return false;
      }

      return true;
    })
    .map((wish) => ({
      name: formatGuestName(wish.name),
      message: formatGuestMessage(wish.message)
    }));

  // Update the count even if the displayed cards have not changed.
  if (count) {
    count.textContent = String(validWishes.length);
  }

  if (validWishes.length === 0) {
    list.replaceChildren();

    setWishesStatus(
      "No wishes yet. Be the first to share your heartfelt wishes."
    );

    if (updateMessage) {
      updateMessage.textContent =
        "This section will update when new wishes are received.";
    }

    lastWishesSignature = JSON.stringify(validWishes);
    return;
  }

  if (status) status.hidden = true;

  const signature = JSON.stringify(validWishes);

  // Do not rebuild the cards when the wishes have not changed.
  // This helps prevent unnecessary interruptions while scrolling.
  if (signature === lastWishesSignature) {

    return;
  }

  lastWishesSignature = signature;

  const fragment = document.createDocumentFragment();

  validWishes.forEach((wish) => {
    const card = document.createElement("article");
    card.className = "wish-card";

    const ornament = document.createElement("div");
    ornament.className = "wish-card-ornament";
    ornament.setAttribute("aria-hidden", "true");
    ornament.textContent = "❦";

    const name = document.createElement("h3");
    name.className = "wish-guest-name";
    name.textContent = wish.name;

    const divider = document.createElement("div");
    divider.className = "wish-card-divider";
    divider.setAttribute("aria-hidden", "true");

    const message = document.createElement("p");
    message.className = "wish-message";
    message.textContent = wish.message;

    card.append(ornament, name, divider, message);
    fragment.appendChild(card);
  });

  list.replaceChildren(fragment);

}

function loadWishes() {
  if (isLoadingWishes) return;

  const list = document.getElementById("wishesList");

  if (!list) {
    console.error("Guest Wishes element #wishesList was not found.");
    return;
  }

  isLoadingWishes = true;
  list.setAttribute("aria-busy", "true");

  if (latestWishes.length === 0) {
    setWishesStatus("Loading guest wishes...");
  }

  const requestId = ++wishesRequestId;
  const callbackName = "guestWishesCallback_" + requestId;
  const script = document.createElement("script");

  let finished = false;

  function cleanup() {
    if (finished) return;

    finished = true;

    if (wishesRequestTimer !== null) {
      window.clearTimeout(wishesRequestTimer);
      wishesRequestTimer = null;
    }

    delete window[callbackName];

    script.onerror = null;
    script.remove();

    isLoadingWishes = false;
    list.setAttribute("aria-busy", "false");
  }

  function handleFailure(message) {
    cleanup();

    console.error("Guest Wishes error:", message);

    if (latestWishes.length === 0) {
      setWishesStatus(
        "Guest wishes could not be loaded. Will try again automatically."
      );
    } else {
      const updateMessage = document.getElementById("wishesUpdate");

      if (updateMessage) {
        updateMessage.textContent =
          "Unable to check for new wishes. Will try again automatically.";
      }
    }
  }

  window[callbackName] = function (data) {
    if (finished) return;

    if (!data || data.success !== true || !Array.isArray(data.wishes)) {
      handleFailure(
        data && data.error ? data.error : "Invalid API response."
      );
      return;
    }

    latestWishes = data.wishes;
    cleanup();
    renderWishes(latestWishes);
  };

  script.async = true;

  script.onerror = function () {
    handleFailure("The API script could not be loaded.");
  };

  wishesRequestTimer = window.setTimeout(() => {
    handleFailure("The API request timed out.");
  }, WISHES_REQUEST_TIMEOUT);

  
const separator = WISHES_API.includes("?") ? "&" : "?";

script.src =
  WISHES_API +
  separator +
  "callback=" +
  encodeURIComponent(callbackName) +
  "&_=" +
  Date.now();

console.log("Guest Wishes request URL:", script.src);
  document.head.appendChild(script);
}

function startWishesAutoRefresh() {
  if (wishesRefreshTimer !== null) {
    window.clearInterval(wishesRefreshTimer);
    wishesRefreshTimer = null;
  }

  // Load once immediately after the invitation opens.
  loadWishes();

  // Check for new wishes every 15 seconds.
  wishesRefreshTimer = window.setInterval(() => {
    if (!document.hidden) {
      loadWishes();
    }
  }, WISHES_REFRESH_INTERVAL);
}

//BACK-TO-TOP BUTTON
function updateBackToTop() {
  if (!backToTop) return;

  backToTop.classList.toggle("visible", window.scrollY > 500);
}

window.addEventListener("scroll", updateBackToTop, {
  passive: true
});

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


//FLOATING ROSE PETALS

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

function createRosePetal() {
  if (reducedMotion.matches) return;

  const petal = document.createElement("span");
  petal.className = "rose-petal";
  petal.setAttribute("aria-hidden", "true");
  petal.textContent = Math.random() > 0.5 ? "❀" : "✿";
  petal.style.left = `${Math.random() * 100}vw`;
  petal.style.fontSize = `${10 + Math.random() * 12}px`;
  petal.style.animationDuration = `${8 + Math.random() * 7}s`;
  petal.style.opacity = String(0.35 + Math.random() * 0.35);

  document.body.appendChild(petal);

  petal.addEventListener("animationend", () => {
    petal.remove();
  }, { once: true });
}

if (!reducedMotion.matches) {
  window.setInterval(createRosePetal, 1400);
}