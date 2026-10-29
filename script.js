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
      document.querySelectorAll(".cat, .field, .rec").forEach((element) => {
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
      fitField();
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

    let links = [];
    let slots = [];
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
      { period: 9, turn: 1, eccentricity: 0.62 },
      { period: 13, turn: -1, eccentricity: 0.4 },
      { period: 11, turn: 1, eccentricity: 0.55 },
      { period: 16, turn: -1, eccentricity: 0.34 },
      { period: 10, turn: 1, eccentricity: 0.7 },
      { period: 14, turn: -1, eccentricity: 0.48 }
    ];

    function parseLinks(text) {
      const items = [];
      text.split(/\r?\n/).forEach((raw) => {
        const line = raw.trim();
        if (!line || line.startsWith("#")) return;
        const arrow = line.indexOf("->");
        if (arrow === -1) return;
        const label = line.slice(0, arrow).trim();
        const url = line.slice(arrow + 2).trim();
        if (label && url) items.push({ label, url });
      });
      return items;
    }

    function buildOrbits() {
      orbit.replaceChildren();
      slots = links.map((item, index) => {
      const term = item.label;
      const motion = rings[index % rings.length];
      const ring = document.createElement("div");
      ring.className = "ring";
      const slot = document.createElement("div");
      slot.className = "slot";
      const label = document.createElement("button");
      label.type = "button";
      label.className = "rec";
      label.textContent = term;
      label.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onPick(entry);
      });
      slot.appendChild(label);
      ring.appendChild(slot);
      orbit.appendChild(ring);
      const entry = {
        term,
        slot,
        label,
        ring,
        state: "orbit",
        period: motion.period,
        turn: motion.turn,
        eccentricity: motion.eccentricity,
        tilt: index * 0.85,
        semiMajor: 180
      };
      return entry;
    });
    }

    function eccentricAnomaly(mean, eccentricity) {
      let anomaly = mean;
      for (let step = 0; step < 6; step++) {
        const slope = 1 - eccentricity * Math.cos(anomaly);
        anomaly -= (anomaly - eccentricity * Math.sin(anomaly) - mean) / slope;
      }
      return anomaly;
    }

    const orbitStart = performance.now();
    function spinOrbit(now) {
      const seconds = (now - orbitStart) / 1000;
      slots.forEach((entry) => {
        const mean = (seconds / entry.period) * Math.PI * 2 * entry.turn;
        const anomaly = eccentricAnomaly(mean, entry.eccentricity);
        const axis = entry.semiMajor;
        const x = axis * (Math.cos(anomaly) - entry.eccentricity);
        const y = axis * Math.sqrt(1 - entry.eccentricity * entry.eccentricity) * Math.sin(anomaly);
        const cos = Math.cos(entry.tilt);
        const sin = Math.sin(entry.tilt);
        const left = x * cos - y * sin;
        const top = x * sin + y * cos;
        entry.label.style.transform = "translate(-50%, -50%) translate(" + left + "px, " + top + "px)";
      });
      requestAnimationFrame(spinOrbit);
    }
    requestAnimationFrame(spinOrbit);

    function syncOrbit() {
      const half = Math.min(window.innerWidth, window.innerHeight) / 2;
      const farthest = Math.max(320, half - 48);
      slots.forEach((entry, index) => {
        const peri = 176 + (index % 4) * 14;
        const apo = Math.min(farthest, Math.max(peri * 3.1, farthest - (index % 3) * 42));
        entry.semiMajor = (apo + peri) / 2;
        entry.eccentricity = (apo - peri) / (apo + peri);
      });
    }

    fetch("links.txt")
      .then((response) => response.text())
      .then((text) => {
        links = parseLinks(text);
        buildOrbits();
        syncOrbit();
        paint();
      });

    function paint() {
      const value = input.value;
      const folded = value.toLowerCase();
      suggestion = "";
      if (folded && !reserve) {
        const match = links.find((item) => {
          const foldedTerm = item.label.toLowerCase();
          return foldedTerm.startsWith(folded) && foldedTerm !== folded;
        });
        suggestion = match ? match.label : "";
      }
      ghost.textContent = suggestion;
      sizer.textContent = suggestion || value || reserve || " ";
      fitField();
    }

    function fitField() {
      const text = sizer.textContent || " ";
      const style = getComputedStyle(input);
      const max = Math.max(48, window.innerWidth - 48);
      measure.style.fontFamily = style.fontFamily;
      measure.style.fontSize = "27px";
      measure.style.lineHeight = "1";
      measure.textContent = text;
      const natural = Math.max(1, measure.offsetWidth);
      const size = natural > max ? 27 * (max / natural) : 27;
      const pixels = size + "px";
      sizer.style.fontSize = pixels;
      ghost.style.fontSize = pixels;
      input.style.fontSize = pixels;
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

    function randomFlowColor() {
      const hue = Math.floor(Math.random() * 360);
      return "hsl(" + hue + ", 85%, 64%)";
    }

    function fly(slot, fromRect, getTarget, direction, onDone) {
      const previous = motions.get(slot.term);
      if (previous) previous.cancel();

      const labelStyle = getComputedStyle(slot.label);
      const fieldStyle = getComputedStyle(input);
      const flow = direction === "in" ? randomFlowColor() : "";
      const startColor = flow || (direction === "in" ? labelStyle.color : fieldStyle.color);
      const endColor = flow || (direction === "in" ? fieldStyle.color : labelStyle.color);
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
      const exact = links.find((item) => item.label.toLowerCase() === word);
      if (exact) return exact.url;
      const prefixed = links.filter((item) => item.label.toLowerCase().startsWith(word));
      if (prefixed.length === 1) return prefixed[0].url;
      const close = links.filter((item) => editDistance(word, item.label.toLowerCase()) <= 2);
      if (close.length === 1) return close[0].url;
      return "https://www.google.com/search?q=" + encodeURIComponent(query.trim());
    }

    document.getElementById("search").addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim() || (ghost.textContent ? suggestion : "");
      const url = destination(query);
      if (url) location.href = url;
    });
