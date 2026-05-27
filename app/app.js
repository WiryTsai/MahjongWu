// 以固定順序定義 34 種牌，後續排序、計數與演算法都共用這個索引。
const tiles = [
  ...makeSuit("m", "萬子", "萬", "var(--char)"),
  ...makeSuit("p", "筒子", "筒", "var(--coin)"),
  ...makeSuit("s", "索子", "索", "var(--bamboo)"),
  { id: "E", group: "字牌", name: "東", symbol: "東", color: "var(--honor)" },
  { id: "S", group: "字牌", name: "南", symbol: "南", color: "var(--honor)" },
  { id: "W", group: "字牌", name: "西", symbol: "西", color: "var(--honor)" },
  { id: "N", group: "字牌", name: "北", symbol: "北", color: "var(--honor)" },
  { id: "P", group: "字牌", name: "白", symbol: "白", color: "var(--honor)" },
  { id: "F", group: "字牌", name: "發", symbol: "發", color: "var(--honor)" },
  { id: "C", group: "字牌", name: "中", symbol: "中", color: "var(--honor)" },
];

const terminalIds = new Set(["m1", "m9", "p1", "p9", "s1", "s9", "E", "S", "W", "N", "P", "F", "C"]);
const tileById = new Map(tiles.map((tile) => [tile.id, tile]));
const tileIndex = new Map(tiles.map((tile, index) => [tile.id, index]));

let selected = [];
let mode = "auto";

const tilePicker = document.querySelector("#tile-picker");
const selectedHand = document.querySelector("#selected-hand");
const tileCount = document.querySelector("#tile-count");
const targetText = document.querySelector("#target-text");
const statusMessage = document.querySelector("#status-message");
const waitResults = document.querySelector("#wait-results");
const resultCount = document.querySelector("#result-count");
const clearButton = document.querySelector("#clear-hand");
const modeButtons = document.querySelectorAll(".mode-button");

renderPicker();
render();

clearButton.addEventListener("click", () => {
  selected = [];
  render();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    modeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

function makeSuit(prefix, group, suffix, color) {
  return Array.from({ length: 9 }, (_, index) => {
    const rank = index + 1;
    return {
      id: `${prefix}${rank}`,
      group,
      name: `${rank}${suffix}`,
      symbol: String(rank),
      color,
    };
  });
}

function renderPicker() {
  // 選牌區依照萬子、筒子、索子、字牌分組產生，避免 HTML 重複維護 34 個按鈕。
  const groups = [...new Set(tiles.map((tile) => tile.group))];
  tilePicker.innerHTML = groups
    .map((group) => {
      const groupTiles = tiles.filter((tile) => tile.group === group);
      return `
        <section class="tile-group">
          <div class="tile-group-header">
            <span class="tile-group-title">${group}</span>
          </div>
          <div class="tile-grid">
            ${groupTiles.map(renderTileButton).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  tilePicker.querySelectorAll(".tile").forEach((button) => {
    button.addEventListener("click", () => addTile(button.dataset.id));
  });
}

function renderTileButton(tile) {
  return `
    <button class="tile" type="button" data-id="${tile.id}" style="--tile-color: ${tile.color}" aria-label="加入${tile.name}">
      <span class="tile-count" data-count-for="${tile.id}" hidden>0</span>
      <span class="tile-symbol">${tile.symbol}</span>
      <span class="tile-name">${tile.name}</span>
    </button>
  `;
}

function addTile(id) {
  const counts = getCounts(selected);
  if (counts[tileIndex.get(id)] >= 4) return;
  selected = [...selected, id].sort(compareTiles);
  render();
}

function removeTile(id) {
  const index = selected.indexOf(id);
  if (index === -1) return;
  selected = [...selected.slice(0, index), ...selected.slice(index + 1)];
  render();
}

function render() {
  // 所有畫面狀態都由 selected 重新計算，確保新增、移除、切換模式後結果一致。
  const counts = getCounts(selected);
  const handSize = selected.length;
  const activeMode = resolveMode(handSize);
  const waits = activeMode ? findWaits(counts, activeMode) : [];
  const maxTiles = mode === "16" ? 16 : mode === "13" ? 13 : 16;

  tileCount.textContent = handSize;
  targetText.textContent = activeMode ? `張，${activeMode.label}` : "張";
  statusMessage.textContent = getStatusText(handSize, activeMode, waits.length);
  statusMessage.classList.toggle("is-warning", handSize > maxTiles || (!activeMode && handSize > 0));

  selectedHand.innerHTML = selected.length
    ? selected
        .map((id) => {
          const tile = tileById.get(id);
          return `
            <button class="selected-tile" type="button" data-id="${id}" style="--tile-color: ${tile.color}" aria-label="移除${tile.name}">
              <span>${tile.symbol}</span><span>${tile.name}</span>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">從下方點選牌張加入手牌</div>`;

  selectedHand.querySelectorAll(".selected-tile").forEach((button) => {
    button.addEventListener("click", () => removeTile(button.dataset.id));
  });

  tilePicker.querySelectorAll(".tile").forEach((button) => {
    const id = button.dataset.id;
    const count = counts[tileIndex.get(id)];
    const badge = button.querySelector(".tile-count");
    button.disabled = count >= 4 || selected.length >= maxTiles;
    badge.hidden = count === 0;
    badge.textContent = count;
  });

  resultCount.textContent = `${waits.length} 種`;
  waitResults.innerHTML = waits.length ? waits.map(renderWaitTile).join("") : `<div class="empty-state">尚未形成聽牌。</div>`;
}

function renderWaitTile(id) {
  const tile = tileById.get(id);
  return `
    <div class="wait-tile" style="--tile-color: ${tile.color}">
      <strong>${tile.symbol}</strong>
      <span>${tile.name}</span>
    </div>
  `;
}

function getStatusText(handSize, activeMode, waitCount) {
  if (handSize === 0) return "請輸入 13 張或 16 張手牌。";
  if (!activeMode) {
    if (mode === "13") return "13 張模式需要剛好 13 張手牌。";
    if (mode === "16") return "16 張模式需要剛好 16 張手牌。";
    return "自動模式會在 13 張或 16 張時計算聽牌。";
  }
  if (waitCount > 0) return `已計算${activeMode.label}：共 ${waitCount} 種進張。`;
  return `${activeMode.label}，但目前沒有可胡進張。`;
}

function resolveMode(handSize) {
  // 聽牌時手牌張數會是 3n + 1；目前支援 13 張與台麻常見的 16 張。
  if (mode === "13" && handSize === 13) return { handSize: 13, winningSize: 14, melds: 4, label: "13 張聽 14 張" };
  if (mode === "16" && handSize === 16) return { handSize: 16, winningSize: 17, melds: 5, label: "16 張聽 17 張" };
  if (mode === "auto" && handSize === 13) return { handSize: 13, winningSize: 14, melds: 4, label: "13 張聽 14 張" };
  if (mode === "auto" && handSize === 16) return { handSize: 16, winningSize: 17, melds: 5, label: "16 張聽 17 張" };
  return null;
}

function compareTiles(a, b) {
  return tileIndex.get(a) - tileIndex.get(b);
}

function getCounts(ids) {
  // 將手牌轉成長度 34 的計數陣列，演算法只需要處理數字而不是 UI 文字。
  const counts = Array(34).fill(0);
  ids.forEach((id) => {
    counts[tileIndex.get(id)] += 1;
  });
  return counts;
}

function findWaits(counts, activeMode) {
  // 逐一嘗試補進每一種牌；補進後能胡牌的牌，就是目前聽的牌。
  return tiles
    .filter((tile, index) => counts[index] < 4)
    .filter((tile, index) => {
      const nextCounts = [...counts];
      nextCounts[index] += 1;
      return isWinning(nextCounts, activeMode);
    })
    .map((tile) => tile.id);
}

function isWinning(counts, activeMode) {
  // 13 張模式除了標準 4 面子 1 雀頭，也檢查七對子與國士無雙。
  if (activeMode.winningSize === 14 && (isSevenPairs(counts) || isThirteenOrphans(counts))) return true;
  return isStandardWin(counts, activeMode.melds);
}

function isSevenPairs(counts) {
  return counts.filter((count) => count === 2).length === 7;
}

function isThirteenOrphans(counts) {
  let hasPair = false;
  for (let index = 0; index < counts.length; index += 1) {
    const tile = tiles[index];
    const isTerminal = terminalIds.has(tile.id);
    if (!isTerminal && counts[index] > 0) return false;
    if (isTerminal && counts[index] === 0) return false;
    if (counts[index] === 2) hasPair = true;
    if (counts[index] > 2) return false;
  }
  return hasPair;
}

function isStandardWin(counts, neededMelds) {
  // 先嘗試每一種可能雀頭，再檢查剩餘牌能否拆成指定數量的面子。
  for (let pairIndex = 0; pairIndex < counts.length; pairIndex += 1) {
    if (counts[pairIndex] < 2) continue;
    const remaining = [...counts];
    remaining[pairIndex] -= 2;
    if (canMakeMelds(remaining, neededMelds, new Map())) return true;
  }
  return false;
}

function canMakeMelds(counts, neededMelds, memo) {
  // 遞迴拆牌：每次從最小索引的剩餘牌開始，嘗試刻子或順子，並用 memo 避免重複計算。
  const key = `${neededMelds}|${counts.join("")}`;
  if (memo.has(key)) return memo.get(key);

  const first = counts.findIndex((count) => count > 0);
  if (first === -1) return neededMelds === 0;
  if (neededMelds <= 0) return false;

  if (counts[first] >= 3) {
    counts[first] -= 3;
    if (canMakeMelds(counts, neededMelds - 1, memo)) {
      counts[first] += 3;
      memo.set(key, true);
      return true;
    }
    counts[first] += 3;
  }

  if (canTakeSequence(counts, first)) {
    counts[first] -= 1;
    counts[first + 1] -= 1;
    counts[first + 2] -= 1;
    if (canMakeMelds(counts, neededMelds - 1, memo)) {
      counts[first] += 1;
      counts[first + 1] += 1;
      counts[first + 2] += 1;
      memo.set(key, true);
      return true;
    }
    counts[first] += 1;
    counts[first + 1] += 1;
    counts[first + 2] += 1;
  }

  memo.set(key, false);
  return false;
}

function canTakeSequence(counts, index) {
  const id = tiles[index].id;
  if (!["m", "p", "s"].includes(id[0])) return false;
  const rank = Number(id[1]);
  return rank <= 7 && counts[index + 1] > 0 && counts[index + 2] > 0;
}
