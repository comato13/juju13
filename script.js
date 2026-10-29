    const wrapper = document.getElementById("tiles");
    let columns = 0, rows = 0, toggled = false;

    const toggle = () => {
      toggled = !toggled;
      document.body.classList.toggle("toggled");
    };

    const handleOnClick = index => {
      toggle();
      anime({
        targets: ".tile",
        opacity: toggled ? 0 : 1,
        delay: anime.stagger(50, {
          grid: [columns, rows],
          from: index
        })
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
    const eyeWidth = 7;
    const cat = document.querySelector(".cat");

    function resetIrises() {
      irises.forEach((iris) => {
        const irisBefore = iris.querySelector(".iris-before");
        irisBefore.style.transform = "translate(-50%, -50%)";
        irisBefore.style.width = eyeWidth + "px";
      });
    }

    function moveIrises(event) {
      const rect = cat.getBoundingClientRect();
      const catCenterX = rect.left + rect.width / 2;
      const catCenterLowerY = rect.top + rect.height;
      const catCenterUpperY = rect.top;
      const distanceToCenterX = event.clientX - catCenterX;

      if (Math.abs(distanceToCenterX) <= 800 && catCenterLowerY >= event.clientY && catCenterUpperY <= event.clientY) {
        irises.forEach((iris) => {
          const irisBefore = iris.querySelector(".iris-before");
          irisBefore.style.width = "14px";
          const newX = distanceToCenterX > 0
            ? Math.min(0.1, distanceToCenterX)
            : Math.max(-12, distanceToCenterX);
          irisBefore.style.transform = "translateX(" + newX + "px) translateY(-50%)";
        });
      } else {
        resetIrises();
      }
    }

    document.addEventListener("mousemove", moveIrises);

    const terms = ["Facebook", "fb", "ig", "Instagram", "game", "cv"];
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
      return "https://www.google.com/search?q=" + encodeURIComponent(query.trim());
    }

    document.getElementById("search").addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim() || (ghost.textContent ? suggestion : "");
      const url = destination(query);
      if (url) location.href = url;
    });
