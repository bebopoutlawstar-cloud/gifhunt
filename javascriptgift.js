// --- elements on the page ---
const grid = document.getElementById("results");
const form = document.getElementById("searchForm");
const input = document.getElementById("gifsearch");
const statusText = document.getElementById("status");
const heading = document.getElementById("heading");
const loadMoreBtn = document.getElementById("loadMore");
const toast = document.getElementById("toast");
const chips = document.querySelectorAll("#chips button");
const tabs = document.querySelectorAll(".tab");

// --- API settings ---
const API_KEY = "j48mHG8NqdGXnaItJSnY5P9VHFalsXqo";
const LIMIT = 12;

// --- what we're showing right now ---
let type = "gifs";   // "gifs" or "stickers"
let keyword = "";    // empty means trending
let offset = 0;      // how many we've already loaded

// --- build the right GIPHY url ---
function buildUrl() {
  let url = "https://api.giphy.com/v1/" + type;

  if (keyword === "") {
    url += "/trending?";
  } else {
    url += "/search?q=" + encodeURIComponent(keyword) + "&";
  }

  return url + "api_key=" + API_KEY + "&limit=" + LIMIT + "&offset=" + offset + "&rating=pg-13";
}

// --- fetch gifs and put them in the grid ---
// addMore = true keeps the old ones (for "Summon more")
function showGifs(addMore) {
  if (!addMore) {
    offset = 0;
    grid.innerHTML = "";
  }

  statusText.textContent = "Summoning...";
  loadMoreBtn.hidden = true;

  fetch(buildUrl())
    .then(response => {
      if (!response.ok) {
        throw new Error("Bad response");
      }
      return response.json();
    })
    .then(data => {
      statusText.textContent = "";

      if (data.data.length === 0 && offset === 0) {
        statusText.textContent = "Nothing found for \"" + keyword + "\". Try another word.";
        return;
      }

      data.data.forEach(gif => {
        grid.appendChild(makeGif(gif));
      });

      offset += data.data.length;

      // only show "Summon more" if there are more to get
      const total = data.pagination.total_count;
      loadMoreBtn.hidden = offset >= total || data.data.length < LIMIT;
    })
    .catch(() => {
      statusText.textContent = "Something went wrong. Check your connection and try again.";
    });
}

// --- make one clickable gif ---
function makeGif(gif) {
  const btn = document.createElement("button");
  btn.className = "gif";
  btn.type = "button";
  btn.title = "Click to copy link";

  const img = document.createElement("img");
  img.src = gif.images.fixed_width.url;
  img.alt = gif.title || "GIF";
  img.loading = "lazy";

  btn.appendChild(img);

  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(gif.images.original.url)
      .then(() => showToast("Link copied!"))
      .catch(() => showToast("Couldn't copy. Try again."));
  });

  return btn;
}

// --- little popup at the bottom of the screen ---
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

// --- start a new search ---
function search(word) {
  keyword = word.trim();
  heading.textContent = keyword === "" ? "Trending" : "Results for \"" + keyword + "\"";
  showGifs(false);
}

// --- search: runs when the form is submitted ---
form.addEventListener("submit", event => {
  event.preventDefault();
  if (input.value.trim() === "") {
    statusText.textContent = "Type something to hunt for first.";
    input.focus();
    return;
  }
  search(input.value);
});

// --- clearing the search box goes back to trending ---
input.addEventListener("search", () => {
  if (input.value === "") {
    search("");
  }
});

// --- quick search chips ---
chips.forEach(chip => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.word;
    search(chip.dataset.word);
  });
});

// --- GIFs / Stickers tabs ---
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    type = tab.dataset.type;
    showGifs(false);
  });
});

// --- load more button ---
loadMoreBtn.addEventListener("click", () => showGifs(true));

// --- show trending gifs when the page first loads ---
showGifs(false);