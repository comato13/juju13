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
    window.onresize = () => createGrid();

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
    const suggestion = terms[Math.floor(Math.random() * terms.length)];

    function paint() {
      const value = input.value;
      const matches = suggestion.toLowerCase().startsWith(value.toLowerCase());
      ghost.textContent = matches ? suggestion : "";
      sizer.textContent = ghost.textContent || value || " ";
    }

    input.addEventListener("input", paint);
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
