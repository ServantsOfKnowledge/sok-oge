const PAGE_SIZE = 25;
const summaryUrl = "./data/summary.json";
const latestUrl = "./data/latest.json.gz";

const state = {
  summary: null,
  latestRecords: [],
  publicationCache: new Map(),
  currentMode: "latest",
  currentResults: [],
  currentPage: 1,
  lastCriteriaKey: "",
};

const elements = {
  recordCount: document.querySelector("#record-count"),
  stateCount: document.querySelector("#state-count"),
  publicationCount: document.querySelector("#publication-count"),
  stateList: document.querySelector("#state-list"),
  stateSelect: document.querySelector("#state-select"),
  publicationSelect: document.querySelector("#publication-select"),
  queryInput: document.querySelector("#query-input"),
  dateFromInput: document.querySelector("#date-from-input"),
  dateToInput: document.querySelector("#date-to-input"),
  resultSummary: document.querySelector("#result-summary"),
  statusMessage: document.querySelector("#status-message"),
  results: document.querySelector("#results"),
  prevPage: document.querySelector("#prev-page"),
  nextPage: document.querySelector("#next-page"),
  pageLabel: document.querySelector("#page-label"),
  searchButton: document.querySelector("#search-button"),
  resetButton: document.querySelector("#reset-button"),
  latestButton: document.querySelector("#latest-button"),
  clearStateButton: document.querySelector("#clear-state"),
  template: document.querySelector("#result-template"),
};

function numberFormat(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function titleCase(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildSearchText(record) {
  if (record.__searchText) {
    return record.__searchText;
  }
  const metadataBits = Object.entries(record.metadata || {}).map(([key, value]) => `${key} ${value}`);
  const notificationBits = (record.notifications || []).flatMap((entry) =>
    Object.entries(entry).map(([key, value]) => `${key} ${value}`),
  );
  record.__searchText = [
    record.state_name,
    record.publication_title,
    record.publication_slug,
    record.meta_file,
    record.raw_file,
    record.gazette_date,
    ...metadataBits,
    ...notificationBits,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return record.__searchText;
}

function matchesCriteria(record, criteria) {
  if (criteria.state && record.state_name !== criteria.state) {
    return false;
  }
  if (criteria.publication && record.publication_slug !== criteria.publication) {
    return false;
  }
  if (criteria.dateFrom && (record.gazette_date || "") < criteria.dateFrom) {
    return false;
  }
  if (criteria.dateTo && (record.gazette_date || "") > criteria.dateTo) {
    return false;
  }
  if (!criteria.query) {
    return true;
  }
  return buildSearchText(record).includes(criteria.query);
}

function currentCriteria() {
  return {
    query: elements.queryInput.value.trim().toLowerCase(),
    state: elements.stateSelect.value,
    publication: elements.publicationSelect.value,
    dateFrom: elements.dateFromInput.value,
    dateTo: elements.dateToInput.value,
  };
}

function criteriaKey(criteria) {
  return JSON.stringify(criteria);
}

function sortRecords(records) {
  return [...records].sort((left, right) => {
    const leftKey = `${left.gazette_date || ""}|${left.publication_slug || ""}|${left.file_stem || ""}`;
    const rightKey = `${right.gazette_date || ""}|${right.publication_slug || ""}|${right.file_stem || ""}`;
    return rightKey.localeCompare(leftKey);
  });
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

function setSummary(summary) {
  elements.recordCount.textContent = numberFormat(summary.record_count);
  elements.stateCount.textContent = numberFormat(summary.state_count);
  elements.publicationCount.textContent = numberFormat(summary.publication_count);
}

function renderStateList() {
  const activeState = elements.stateSelect.value;
  const states = state.summary.states || [];
  const counts = state.summary.state_record_counts || {};
  elements.stateList.innerHTML = states
    .map((stateName) => {
      const count = counts[stateName] || 0;
      const activeClass = activeState === stateName ? " active" : "";
      return `
        <button class="state-chip${activeClass}" type="button" data-state="${escapeHtml(stateName)}">
          <span>${escapeHtml(stateName)}</span>
          <small>${numberFormat(count)}</small>
        </button>
      `;
    })
    .join("");
}

function renderPublicationOptions() {
  const selectedState = elements.stateSelect.value;
  const manifest = state.summary.publications || [];
  const allowed = selectedState
    ? new Set(state.summary.state_publications[selectedState] || [])
    : null;
  const publications = manifest.filter((publication) => !allowed || allowed.has(publication.slug));
  const previousValue = elements.publicationSelect.value;
  elements.publicationSelect.innerHTML = [
    '<option value="">All publications</option>',
    ...publications.map(
      (publication) =>
        `<option value="${escapeHtml(publication.slug)}">${escapeHtml(publication.title)} (${numberFormat(publication.count)})</option>`,
    ),
  ].join("");
  if (publications.some((publication) => publication.slug === previousValue)) {
    elements.publicationSelect.value = previousValue;
  }
}

function renderResults(records, totalCount, descriptor) {
  elements.results.innerHTML = "";

  if (!records.length) {
    elements.results.innerHTML = `
      <div class="empty-state">
        No records matched the current filters. Try widening the date range, changing the state, or removing the search text.
      </div>
    `;
    elements.resultSummary.textContent = descriptor || "No matching records";
    elements.pageLabel.textContent = "Page 1 of 1";
    elements.prevPage.disabled = true;
    elements.nextPage.disabled = true;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = (state.currentPage - 1) * PAGE_SIZE;
  const pageRecords = records.slice(startIndex, startIndex + PAGE_SIZE);

  for (const record of pageRecords) {
    const fragment = elements.template.content.cloneNode(true);
    const article = fragment.querySelector(".result-card");
    fragment.querySelector(".breadcrumb").textContent = [
      record.state_name,
      record.publication_slug,
      record.gazette_date || "Undated",
      record.file_stem,
    ]
      .filter(Boolean)
      .join(" / ");
    fragment.querySelector(".result-title").textContent =
      record.metadata?.title || record.metadata?.subject || record.metadata?.department || record.meta_file;
    fragment.querySelector(".date-pill").textContent = record.gazette_date || "Unknown date";

    const fileLinks = fragment.querySelector(".file-links");
    const links = [
      ["Publication", record.raw_url],
      ["XML file", record.meta_url],
      [record.raw_file?.toLowerCase().endsWith(".pdf") ? "PDF file" : "Raw file", record.raw_url],
      ["Open source", record.source_url],
    ].filter(([, href], index, list) => href && list.findIndex((item) => item[1] === href) === index);
    fileLinks.innerHTML = links
      .map(([label, href]) => `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
      .join("");

    const metaGrid = fragment.querySelector(".meta-grid");
    const metadataEntries = [
      ["State", record.state_name],
      ["Publication", record.publication_title],
      ["Metadata file", record.meta_file],
      ["Raw file", record.raw_file],
      ...Object.entries(record.metadata || {}).slice(0, 10).map(([key, value]) => [titleCase(key), value]),
    ].filter(([, value]) => value);
    metaGrid.innerHTML = metadataEntries
      .map(
        ([key, value]) => `
          <div class="meta-row">
            <dt>${escapeHtml(key)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `,
      )
      .join("");

    const notificationWrap = fragment.querySelector(".notification-wrap");
    if (record.notifications?.length) {
      notificationWrap.innerHTML = record.notifications
        .slice(0, 3)
        .map((notification, idx) => {
          const body = Object.entries(notification)
            .map(
              ([key, value]) => `
                <div class="meta-row">
                  <dt>${escapeHtml(titleCase(key))}</dt>
                  <dd>${escapeHtml(value)}</dd>
                </div>
              `,
            )
            .join("");
          return `<section class="notification-card"><strong>Notification ${idx + 1}</strong><dl class="meta-grid">${body}</dl></section>`;
        })
        .join("");
    } else {
      notificationWrap.remove();
    }

    elements.results.appendChild(article);
  }

  elements.resultSummary.textContent = `${descriptor} · Showing ${numberFormat(startIndex + 1)}-${numberFormat(
    Math.min(startIndex + pageRecords.length, totalCount),
  )} of ${numberFormat(totalCount)}`;
  elements.pageLabel.textContent = `Page ${numberFormat(state.currentPage)} of ${numberFormat(totalPages)}`;
  elements.prevPage.disabled = state.currentPage <= 1;
  elements.nextPage.disabled = state.currentPage >= totalPages;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  if (!url.endsWith(".gz")) {
    return response.json();
  }
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support gzip archive loading for the static dataset.");
  }
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).json();
}

async function loadPublication(publicationSlug) {
  if (state.publicationCache.has(publicationSlug)) {
    return state.publicationCache.get(publicationSlug);
  }
  const manifestEntry = (state.summary.publications || []).find((item) => item.slug === publicationSlug);
  if (!manifestEntry) {
    return [];
  }
  const records = await fetchJson(manifestEntry.path);
  state.publicationCache.set(publicationSlug, records);
  return records;
}

async function loadMatchingRecords(criteria) {
  const manifest = state.summary.publications || [];

  if (!criteria.query && !criteria.state && !criteria.publication && !criteria.dateFrom && !criteria.dateTo) {
    state.currentMode = "latest";
    return {
      records: state.latestRecords,
      descriptor: "Latest published gazettes",
    };
  }

  let targetPublications = [];
  if (criteria.publication) {
    targetPublications = [criteria.publication];
  } else if (criteria.state) {
    targetPublications = state.summary.state_publications[criteria.state] || [];
  } else {
    targetPublications = manifest.map((item) => item.slug);
  }

  const uniquePublications = [...new Set(targetPublications)];
  const targetLabel =
    criteria.publication ||
    criteria.state ||
    (criteria.query ? "the full archive" : "the selected filters");

  const loaded = [];
  for (let index = 0; index < uniquePublications.length; index += 1) {
    const publicationSlug = uniquePublications[index];
    setStatus(`Loading ${index + 1} of ${uniquePublications.length} publication shards for ${targetLabel}…`);
    const records = await loadPublication(publicationSlug);
    loaded.push(...records);
  }

  const filtered = sortRecords(loaded.filter((record) => matchesCriteria(record, criteria)));
  state.currentMode = "search";
  return {
    records: filtered,
    descriptor: `Matching results`,
  };
}

async function executeSearch({ resetPage = true } = {}) {
  const criteria = currentCriteria();
  const key = criteriaKey(criteria);
  if (resetPage || key !== state.lastCriteriaKey) {
    state.currentPage = 1;
  }
  state.lastCriteriaKey = key;
  setStatus("Filtering records…");

  try {
    const { records, descriptor } = await loadMatchingRecords(criteria);
    state.currentResults = records;
    renderResults(records, records.length, descriptor);
    setStatus(
      state.currentMode === "latest"
        ? "Showing the latest preloaded records. Use filters or search to scan the full archive."
        : `Search complete across ${numberFormat(records.length)} matching records.`,
    );
  } catch (error) {
    elements.results.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    elements.resultSummary.textContent = "Unable to load records";
    setStatus("The static archive request failed. Please try again.");
  }
}

function syncStateFilter(nextState) {
  elements.stateSelect.value = nextState || "";
  renderPublicationOptions();
  renderStateList();
}

function resetFilters() {
  elements.queryInput.value = "";
  elements.dateFromInput.value = "";
  elements.dateToInput.value = "";
  elements.publicationSelect.value = "";
  syncStateFilter("");
}

function attachEvents() {
  elements.stateList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-state]");
    if (!button) {
      return;
    }
    syncStateFilter(button.dataset.state);
    executeSearch();
  });

  elements.stateSelect.addEventListener("change", () => {
    syncStateFilter(elements.stateSelect.value);
  });

  elements.searchButton.addEventListener("click", () => executeSearch());
  elements.resetButton.addEventListener("click", () => {
    resetFilters();
    executeSearch();
  });
  elements.latestButton.addEventListener("click", () => {
    resetFilters();
    executeSearch();
  });
  elements.clearStateButton.addEventListener("click", () => {
    syncStateFilter("");
    executeSearch();
  });

  elements.prevPage.addEventListener("click", () => {
    if (state.currentPage <= 1) {
      return;
    }
    state.currentPage -= 1;
    renderResults(state.currentResults, state.currentResults.length, state.currentMode === "latest" ? "Latest published gazettes" : "Matching results");
  });

  elements.nextPage.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(state.currentResults.length / PAGE_SIZE));
    if (state.currentPage >= totalPages) {
      return;
    }
    state.currentPage += 1;
    renderResults(state.currentResults, state.currentResults.length, state.currentMode === "latest" ? "Latest published gazettes" : "Matching results");
  });

  elements.queryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      executeSearch();
    }
  });
}

async function init() {
  const [summary, latest] = await Promise.all([fetchJson(summaryUrl), fetchJson(latestUrl)]);
  state.summary = summary;
  state.latestRecords = latest;

  setSummary(summary);
  elements.stateSelect.innerHTML = [
    '<option value="">All states</option>',
    ...(summary.states || []).map((stateName) => `<option value="${escapeHtml(stateName)}">${escapeHtml(stateName)}</option>`),
  ].join("");
  renderPublicationOptions();
  renderStateList();
  attachEvents();
  await executeSearch();
}

init().catch((error) => {
  elements.resultSummary.textContent = "Failed to load archive summary";
  setStatus(error.message);
  elements.results.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
