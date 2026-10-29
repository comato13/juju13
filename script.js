    const wrapper = document.getElementById("tiles");
    let columns = 0, rows = 0, toggled = false;

    let waveId = 0;

    const hitAmount = (element) => {
      const rect = element.getBoundingClientRect();
      const tileW = wrapper.clientWidth / columns;
      const tileH = wrapper.clientHeight / rows;
      const c0 = Math.max(0, Math.floor(rect.left / tileW));
      const c1 = Math.min(columns - 1, Math.floor((rect.right - 0.01) / tileW));
      const r0 = Math.max(0, Math.floor(rect.top / tileH));
      const r1 = Math.min(rows - 1, Math.floor((rect.bottom - 0.01) / tileH));
      let sum = 0;
      let count = 0;
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const tile = wrapper.children[row * columns + col];
          if (!tile) continue;
          const opacity = tile.style.opacity === "" ? 1 : parseFloat(tile.style.opacity);
          sum += opacity;
          count++;
        }
      }
      return count ? 1 - sum / count : 0;
    };

    const syncColors = () => {
      document.querySelectorAll(".cat, .field").forEach((element) => {
        element.style.setProperty("--hit", hitAmount(element).toFixed(3));
      });
    };

    const handleOnClick = index => {
      const id = ++waveId;
      toggled = !toggled;
      document.body.classList.toggle("toggled", toggled);
      const follow = () => {
        if (id !== waveId) return;
        syncColors();
        requestAnimationFrame(follow);
      };
      requestAnimationFrame(follow);
      anime({
        targets: ".tile",
        opacity: toggled ? 0 : 1,
        delay: anime.stagger(50, {
          grid: [columns, rows],
          from: index
        }),
        complete: () => {
          if (id !== waveId) return;
          waveId++;
          syncColors();
        }
      });
    };

    const createTile = index => {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.style.opacity = toggled ? 0 : 1;
      tile.onclick = () => handleOnClick(index);
      return tile;
    };

    const createTiles = quantity => {
      Array.from(Array(quantity)).forEach((_, index) => {
        wrapper.appendChild(createTile(index));
      });
    };

    const createGrid = () => {
      wrapper.innerHTML = "";
      const size = document.body.clientWidth > 800 ? 25 : 5;
      columns = Math.floor(document.body.clientWidth / size);
      rows = Math.floor(document.body.clientHeight / size);
      wrapper.style.setProperty("--columns", columns);
      wrapper.style.setProperty("--rows", rows);
      createTiles(columns * rows);
    };

    createGrid();
    window.onresize = () => {
      createGrid();
      syncOrbit();
    };

    const irises = document.querySelectorAll(".eye");
    const cat = document.querySelector(".cat");
    const maxLookX = 5;
    const maxLookY = 4;

    function resetIrises() {
      irises.forEach((eye) => {
        const pupil = eye.querySelector(".iris-before");
        pupil.style.transform = "translate(-50%, -50%)";
        pupil.style.width = "7px";
      });
    }

    function moveIrises(event) {
      const rect = cat.getBoundingClientRect();
      const catCenterX = rect.left + rect.width / 2;
      const inRange = Math.abs(event.clientX - catCenterX) <= 800
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;

      if (!inRange) {
        resetIrises();
        return;
      }

      irises.forEach((eye) => {
        const pupil = eye.querySelector(".iris-before");
        const box = eye.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const nx = dx / maxLookX;
        const ny = dy / maxLookY;
        const mag = Math.hypot(nx, ny) || 1;
        const clamp = Math.min(1, 1 / mag);
        const x = nx * clamp * maxLookX;
        const y = ny * clamp * maxLookY;
        pupil.style.width = "14px";
        pupil.style.transform = "translate(calc(-50% + " + x + "px), calc(-50% + " + y + "px))";
      });
    }

    document.addEventListener("mousemove", moveIrises);

    const terms = ["Facebook", "fb", "ig", "Instagram", "game", "cv", "music"];
    const input = document.getElementById("q");
    const ghost = document.getElementById("ghost");
    const sizer = document.getElementById("sizer");
    const orbit = document.getElementById("orbit");
    const measure = document.createElement("span");
    measure.style.cssText = "position:absolute;visibility:hidden;white-space:pre;pointer-events:none;";
    document.body.appendChild(measure);

    let suggestion = "";
    let reserve = "";
    let held = null;
    const motions = new Map();

    const rings = [
      { duration: "12s", turn: "normal" },
      { duration: "16s", turn: "reverse" },
      { duration: "14s", turn: "normal" },
      { duration: "18s", turn: "reverse" },
      { duration: "13s", turn: "normal" },
      { duration: "17s", turn: "reverse" }
    ];

    const slots = terms.map((term, index) => {
      const motion = rings[index % rings.length];
      const ring = document.createElement("div");
      ring.className = "ring";
      ring.style.setProperty("--duration", motion.duration);
      ring.style.setProperty("--turn", motion.turn);
      ring.style.animation = "orbit-spin " + motion.duration + " linear infinite";
      ring.style.animationDirection = motion.turn;
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.style.setProperty("--angle", (137.5 * index) + "deg");
      const label = document.createElement("button");
      label.type = "button";
      label.className = "rec";
      label.textContent = term;
      label.style.animation = "rec-upright " + motion.duration + " linear infinite";
      label.style.animationDirection = motion.turn;
      label.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onPick(entry);
      });
      slot.appendChild(label);
      ring.appendChild(slot);
      orbit.appendChild(ring);
      const entry = { term, slot, label, state: "orbit" };
      return entry;
    });

    function syncOrbit() {
      const half = Math.min(window.innerWidth, window.innerHeight) / 2;
      const outer = Math.max(168, half - 36);
      const inner = Math.min(146, Math.max(118, outer * 0.46));
      const step = (outer - inner) / Math.max(1, terms.length - 1);
      slots.forEach((entry, index) => {
        entry.slot.style.setProperty("--r", Math.round(inner + step * index) + "px");
      });
    }

    syncOrbit();

    function paint() {
      const value = input.value;
      const folded = value.toLowerCase();
      suggestion = "";
      if (folded && !reserve) {
        const match = terms.find((term) => {
          const foldedTerm = term.toLowerCase();
          return foldedTerm.startsWith(folded) && foldedTerm !== folded;
        });
        suggestion = match || "";
      }
      ghost.textContent = suggestion;
      sizer.textContent = suggestion || value || reserve || " ";
    }

    function searchTextRect(text) {
      const box = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      measure.style.font = style.font;
      measure.textContent = text;
      return {
        left: box.left + parseFloat(style.paddingLeft),
        top: box.top + parseFloat(style.paddingTop),
        width: measure.offsetWidth,
        height: measure.offsetHeight
      };
    }

    function parseColor(color) {
      const channels = color.match(/\d+/g);
      return channels ? channels.slice(0, 3).map(Number) : [255, 255, 255];
    }

    function mixColor(from, to, amount) {
      const start = parseColor(from);
      const end = parseColor(to);
      const mixed = start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount));
      return "rgb(" + mixed[0] + ", " + mixed[1] + ", " + mixed[2] + ")";
    }

    function ease(amount) {
      return amount < 0.5
        ? 4 * amount * amount * amount
        : 1 - Math.pow(-2 * amount + 2, 3) / 2;
    }

    function fly(slot, fromRect, getTarget, direction, onDone) {
      const previous = motions.get(slot.term);
      if (previous) previous.cancel();

      const labelStyle = getComputedStyle(slot.label);
      const fieldStyle = getComputedStyle(input);
      const startColor = direction === "in" ? labelStyle.color : fieldStyle.color;
      const endColor = direction === "in" ? fieldStyle.color : labelStyle.color;
      const startSize = parseFloat(direction === "in" ? labelStyle.fontSize : fieldStyle.fontSize);
      const endSize = parseFloat(direction === "in" ? fieldStyle.fontSize : labelStyle.fontSize);
      const flyer = document.createElement("span");
      flyer.className = "flyer";
      flyer.textContent = slot.term;
      flyer.style.left = fromRect.left + "px";
      flyer.style.top = fromRect.top + "px";
      flyer.style.fontSize = startSize + "px";
      flyer.style.color = startColor;
      document.body.appendChild(flyer);

      const duration = 680;
      const started = performance.now();
      let frame = 0;
      let stopped = false;
      let current = fromRect;

      function tick(now) {
        if (stopped) return;
        const progress = Math.min(1, (now - started) / duration);
        const eased = ease(progress);
        const target = getTarget();
        const dx = target.left - fromRect.left;
        const dy = target.top - fromRect.top;
        const length = Math.hypot(dx, dy) || 1;
        const arc = Math.sin(Math.PI * progress) * 26;
        const x = fromRect.left + dx * eased + (-dy / length) * arc;
        const y = fromRect.top + dy * eased + (dx / length) * arc;
        flyer.style.left = x + "px";
        flyer.style.top = y + "px";
        flyer.style.fontSize = (startSize + (endSize - startSize) * eased) + "px";
        flyer.style.color = mixColor(startColor, endColor, eased);
        current = { left: x, top: y, width: target.width, height: target.height };
        if (progress < 1) frame = requestAnimationFrame(tick);
        else {
          onDone();
          flyer.remove();
          motions.delete(slot.term);
        }
      }

      frame = requestAnimationFrame(tick);
      motions.set(slot.term, {
        cancel() {
          stopped = true;
          cancelAnimationFrame(frame);
          flyer.remove();
          motions.delete(slot.term);
        },
        currentRect() {
          return current;
        }
      });
    }

    function sendBack(slot) {
      if (slot.state === "orbit" || slot.state === "outbound") return;
      const motion = motions.get(slot.term);
      let from = searchTextRect(slot.term);
      if (slot.state === "inbound" && motion) {
        from = motion.currentRect();
        motion.cancel();
      }
      if (input.value === slot.term) input.value = "";
      if (held === slot) held = null;
      if (reserve === slot.term) reserve = "";
      slot.state = "outbound";
      slot.label.style.visibility = "hidden";
      fly(slot, from, () => slot.label.getBoundingClientRect(), "out", () => {
        if (slot.state !== "outbound") return;
        slot.state = "orbit";
        slot.label.style.visibility = "";
      });
    }

    function onPick(slot) {
      if (slot.state === "docked" || slot.state === "inbound") return;
      const from = slot.label.getBoundingClientRect();
      if (held) sendBack(held);
      held = slot;
      slot.state = "inbound";
      slot.label.style.visibility = "hidden";
      input.value = "";
      reserve = slot.term;
      paint();
      fly(slot, from, () => searchTextRect(slot.term), "in", () => {
        if (slot.state !== "inbound") return;
        reserve = "";
        input.value = slot.term;
        slot.state = "docked";
        paint();
        input.focus({ preventScroll: true });
      });
    }

    input.addEventListener("input", () => {
      if (held && input.value !== held.term) sendBack(held);
      paint();
    });
    paint();

    function editDistance(a, b) {
      const row = Array.from({ length: a.length + 1 }, (_, i) => [i]);
      for (let j = 0; j <= b.length; j++) row[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          row[i][j] = a[i - 1] === b[j - 1]
            ? row[i - 1][j - 1]
            : 1 + Math.min(row[i - 1][j], row[i][j - 1], row[i - 1][j - 1]);
        }
      }
      return row[a.length][b.length];
    }

    function destination(query) {
      const word = query.trim().toLowerCase();
      if (!word) return "";
      if (word === "fb" || word === "facebook") return "https://www.facebook.com/cloud.sep0/";
      const likeInstagram = word === "ig"
        || word === "insta"
        || word.startsWith("instag")
        || editDistance(word, "instagram") <= 2;
      if (likeInstagram) return "https://www.instagram.com/13m.juju/";
      if (word === "music") return "https://www.youtube.com/watch?v=09-iCp0gwXQ";
      return "https://www.google.com/search?q=" + encodeURIComponent(query.trim());
    }

    document.getElementById("search").addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim() || (ghost.textContent ? suggestion : "");
      const url = destination(query);
      if (url) location.href = url;
    });
