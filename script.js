const revealItems = document.querySelectorAll(".reveal");
const logo = document.querySelector(".logo");
const textTargets = document.querySelectorAll(
  ".hero-copy, .section-copy, .statement-shell, .feature-card, .frame, .depth-card, .editor-intro, .editor-card, .history-item, .work-item, .essay-hub, .essay-category-button, .essay-panel"
);

if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const depthLayers = document.querySelectorAll(".depth-layer");
const artToneSections = document.querySelectorAll("[data-art-tone]");
let isTicking = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getOverlapRatio(firstRect, secondRect) {
  const overlapX = Math.max(
    0,
    Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left)
  );
  const overlapY = Math.max(
    0,
    Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top)
  );

  if (!overlapX || !overlapY) {
    return 0;
  }

  const overlapArea = overlapX * overlapY;
  const firstArea = firstRect.width * firstRect.height;

  if (!firstArea) {
    return 0;
  }

  return clamp(overlapArea / firstArea, 0, 1);
}

function updateLogoVisibility() {
  if (!logo || window.innerWidth <= 760) {
    if (logo) {
      logo.style.setProperty("--logo-opacity", "1");
      logo.style.setProperty("--logo-blur", "0px");
    }
    return;
  }

  const logoRect = logo.getBoundingClientRect();
  let strongestOverlap = 0;

  textTargets.forEach((target) => {
    const targetStyle = window.getComputedStyle(target);

    if (targetStyle.display === "none" || targetStyle.visibility === "hidden") {
      return;
    }

    const ratio = getOverlapRatio(logoRect, target.getBoundingClientRect());
    strongestOverlap = Math.max(strongestOverlap, ratio);
  });

  const isObscured = strongestOverlap > 0.004;
  const opacity = isObscured ? 0 : 1;
  const blur = isObscured ? 10 : 0;

  logo.style.setProperty("--logo-opacity", String(opacity));
  logo.style.setProperty("--logo-blur", `${blur}px`);
}

function updateDepth() {
  const viewportMid = window.innerHeight / 2;

  depthLayers.forEach((layer) => {
    const rect = layer.getBoundingClientRect();
    const layerMid = rect.top + rect.height / 2;
    const distance = layerMid - viewportMid;
    const speed = Number(layer.dataset.speed || 0);
    const offset = distance * speed * -0.32;

    layer.style.setProperty("--float-offset", `${offset.toFixed(1)}px`);
  });

  updateLogoVisibility();
  updateArtTone();
  isTicking = false;
}

function queueDepthUpdate() {
  if (!isTicking) {
    window.requestAnimationFrame(updateDepth);
    isTicking = true;
  }
}

window.addEventListener("scroll", queueDepthUpdate, { passive: true });
window.addEventListener("resize", queueDepthUpdate);
window.addEventListener("load", queueDepthUpdate);

queueDepthUpdate();

function updateArtTone() {
  if (!artToneSections.length) {
    return;
  }

  const viewportMid = window.innerHeight / 2;
  let activeTone = "";
  let activeStrength = 0;

  artToneSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionMid = rect.top + rect.height / 2;
    const visible = rect.top < window.innerHeight && rect.bottom > 0;

    if (!visible) {
      return;
    }

    const distance = Math.abs(sectionMid - viewportMid);
    const range = window.innerHeight * 1.08;
    const strength = clamp(1 - distance / range, 0, 0.82);

    if (strength > activeStrength) {
      activeStrength = strength;
      activeTone = section.getAttribute("data-art-tone") || "";
    }
  });

  if (activeTone && activeStrength > 0.04) {
    document.body.setAttribute("data-art-tone", activeTone);
    document.body.style.setProperty("--art-tone-opacity", activeStrength.toFixed(3));
  } else {
    document.body.removeAttribute("data-art-tone");
    document.body.style.setProperty("--art-tone-opacity", "0");
  }
}

const contactModal = document.querySelector("[data-contact-modal]");

function setupContactModal() {
  if (!contactModal) {
    return;
  }

  const openers = document.querySelectorAll("[data-open-contact]");
  const closers = document.querySelectorAll("[data-close-contact]");

  function open() {
    contactModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    contactModal.hidden = true;
    document.body.style.overflow = "";
  }

  openers.forEach((button) => button.addEventListener("click", open));
  closers.forEach((button) => button.addEventListener("click", close));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !contactModal.hidden) {
      close();
    }
  });
}

setupContactModal();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupEssayLibrary() {
  const library = document.querySelector("[data-essay-library]");
  const categoriesNode = document.querySelector("[data-essay-categories]");
  const sideWindowNode = document.querySelector("[data-essay-side-window]");
  const sideTitleNode = document.querySelector("[data-essay-side-title]");
  const sideListNode = document.querySelector("[data-essay-side-list]");
  const modal = document.querySelector("[data-essay-modal]");

  if (
    !library ||
    !categoriesNode ||
    !sideWindowNode ||
    !sideTitleNode ||
    !sideListNode ||
    !modal ||
    !window.GENTLESOME_ESSAYS
  ) {
    return;
  }

  const titleNode = modal.querySelector("[data-essay-title]");
  const sectionNode = modal.querySelector("[data-essay-section]");
  const bodyNode = modal.querySelector("[data-essay-body]");
  const closers = modal.querySelectorAll("[data-close-essay]");
  const sections = Array.isArray(window.GENTLESOME_ESSAYS) ? window.GENTLESOME_ESSAYS : [];
  const essayMap = new Map();

  function getTone(name) {
    if (name === "动植物园") {
      return "green";
    }
    if (name === "情绪万岁") {
      return "yellow";
    }
    if (name === "海洋居民") {
      return "blue";
    }
    if (name === "较长的回响") {
      return "purple";
    }
    return "green";
  }

  function normalizeDuplicateLabels(essays = []) {
    const titleCounter = new Map();
    essays.forEach((essay) => {
      const title = String(essay.title || "未命名");
      titleCounter.set(title, (titleCounter.get(title) || 0) + 1);
    });

    const seenCounter = new Map();
    return essays.map((essay, essayIndex) => {
      const title = String(essay.title || "未命名");
      const duplicateCount = titleCounter.get(title) || 0;
      const seen = (seenCounter.get(title) || 0) + 1;
      seenCounter.set(title, seen);
      const label = duplicateCount > 1 ? `${title} ${seen}` : title;

      return {
        ...essay,
        label,
        index: essayIndex + 1,
      };
    });
  }

  categoriesNode.innerHTML = sections
    .map((section, sectionIndex) => {
      const essays = normalizeDuplicateLabels(section.essays || []);
      const sectionName = String(section.name || "");
      const sectionId = `section-${sectionIndex}`;
      const tone = getTone(sectionName);

      essays.forEach((essay) => {
        essayMap.set(essay.id, { ...essay, section: sectionName });
      });

      return `
        <button
          class="essay-category-button"
          type="button"
          data-essay-section="${escapeHtml(sectionId)}"
          data-essay-section-toggle
          data-essay-section-name="${escapeHtml(sectionName)}"
          data-essay-tone="${escapeHtml(tone)}"
          aria-expanded="false"
        >
          <strong>${escapeHtml(sectionName)}</strong>
        </button>
      `;
    })
    .join("");

  const sectionTitles = new Map();
  sections.forEach((section, sectionIndex) => {
    const sectionId = `section-${sectionIndex}`;
    const sectionName = String(section.name || "");
    const essays = normalizeDuplicateLabels(section.essays || []);
    sectionTitles.set(sectionId, { sectionName, essays });
  });

  function renderSideList(sectionId) {
    const data = sectionTitles.get(sectionId);
    if (!data) {
      sideTitleNode.textContent = "请选择分类";
      sideListNode.innerHTML = "";
      sideWindowNode.hidden = true;
      library.classList.remove("is-side-open");
      return;
    }

    sideWindowNode.hidden = false;
    library.classList.add("is-side-open");
    sideTitleNode.textContent = data.sectionName;
    sideListNode.innerHTML = data.essays
      .map(
        (essay) => `
          <button class="essay-title-button" type="button" data-essay-id="${escapeHtml(essay.id)}">
            ${escapeHtml(essay.label)}
          </button>
        `
      )
      .join("");
  }

  function closeEssay() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function openEssay(essay) {
    if (!titleNode || !sectionNode || !bodyNode) {
      return;
    }

    sectionNode.textContent = essay.section;
    titleNode.textContent = `《${essay.title}》`;
    bodyNode.innerHTML = (essay.paragraphs || [])
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  categoriesNode.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("[data-essay-section-toggle]");
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const sectionId = button.getAttribute("data-essay-section") || "";
    const isCurrentOpen = button.classList.contains("is-active");

    if (isCurrentOpen) {
      const categoryButtons = categoriesNode.querySelectorAll("[data-essay-section-toggle]");
      categoryButtons.forEach((item) => {
        if (!(item instanceof HTMLElement)) {
          return;
        }
        item.classList.remove("is-active");
        item.setAttribute("aria-expanded", "false");
      });
      renderSideList("");
      return;
    }

    const categoryButtons = categoriesNode.querySelectorAll("[data-essay-section-toggle]");
    categoryButtons.forEach((item) => {
      if (!(item instanceof HTMLElement)) {
        return;
      }

      item.classList.remove("is-active");
      item.setAttribute("aria-expanded", "false");
    });

    button.classList.add("is-active");
    button.setAttribute("aria-expanded", "true");
    renderSideList(sectionId);
  });

  sideListNode.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const titleButton = target.closest("[data-essay-id]");
    if (!(titleButton instanceof HTMLElement)) {
      return;
    }

    const essayId = titleButton.getAttribute("data-essay-id") || "";
    const essay = essayMap.get(essayId);
    if (essay) {
      openEssay(essay);
    }
  });

  closers.forEach((closer) => closer.addEventListener("click", closeEssay));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeEssay();
    }
  });
}

setupEssayLibrary();

const STORAGE_PREFIX = "gentlesome-live::";
const editorConfigs = {
  objects: {
    key: `${STORAGE_PREFIX}objects`,
    linkLabel: "购买或查看",
    defaults: [
      {
        title: "艺术微喷作品",
        desc: "限量版本，适用于收藏与空间展示。",
        link: "https://example.com/product-1",
      },
      {
        title: "Gentlesome 周边卡片",
        desc: "将画面的温柔情绪带入日常。",
        link: "https://example.com/product-2",
      },
    ],
  },
  programs: {
    key: `${STORAGE_PREFIX}programs`,
    linkLabel: "查看详情",
    defaults: [
      {
        title: "展览计划",
        desc: "季度展览排期与预约入口。",
        link: "https://example.com/exhibition",
      },
      {
        title: "书籍计划",
        desc: "图文出版与阅读分享活动。",
        link: "https://example.com/books",
      },
      {
        title: "活动计划",
        desc: "线下相遇与主题工作坊。",
        link: "https://example.com/events",
      },
    ],
  },
  carry: {
    key: `${STORAGE_PREFIX}carry`,
    linkLabel: "打开关联内容",
    defaults: [
      {
        title: "艺术品：画面的原点",
        desc: "承接作品、限量画面与可被收藏的视觉核心。",
        link: "./objects-store.html",
      },
      {
        title: "周边：日常的携带",
        desc: "把艺术元素放进可以触碰、佩戴、陪伴的现实物件。",
        link: "./objects-store.html",
      },
      {
        title: "展览：空间的现场",
        desc: "以动线、观看和停留，让精神世界被真实看见。",
        link: "./programs.html",
      },
      {
        title: "书籍：纸上的档案",
        desc: "让文字、图像与感知秩序成为可以反复进入的阅读空间。",
        link: "./programs.html",
      },
      {
        title: "活动：人与愿望相遇",
        desc: "通过分享、合作与线下相遇，让温柔进入真实关系。",
        link: "./programs.html",
      },
    ],
  },
  spirit: {
    key: `${STORAGE_PREFIX}spirit`,
    linkLabel: "来源",
    defaults: [
      {
        title: "梦幻而又狂乱的内在力量",
        desc: "梦幻而又狂乱的内在力量，必然要用梦幻般的狂乱形式才能表达。心灵不可捉摸的流荡既然那样重要，那也就得以不可捉摸的流荡的语言和艺术形式去把它展现出来。",
        link: "《世界戏剧学》余秋雨",
      },
    ],
  },
};

function readList(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback.slice();
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback.slice();
  } catch (error) {
    return fallback.slice();
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    return;
  }
}

function promptItem(seed = { title: "", desc: "", link: "" }) {
  const title = window.prompt("标题", seed.title);
  if (title === null) {
    return null;
  }

  const desc = window.prompt("说明", seed.desc);
  if (desc === null) {
    return null;
  }

  const link = window.prompt("链接", seed.link);
  if (link === null) {
    return null;
  }

  return {
    title: title.trim() || "未命名",
    desc: desc.trim() || "待补充说明",
    link: link.trim() || "#",
  };
}

function setupEditorPage() {
  const editor = document.querySelector("[data-editor]");
  if (!editor) {
    return;
  }

  const type = editor.getAttribute("data-editor");
  const config = editorConfigs[type];
  if (!config) {
    return;
  }

  const listNode = editor.querySelector("[data-item-list]");
  const addBtn = editor.querySelector("[data-add-item]");
  if (!listNode || !addBtn) {
    return;
  }

  let items = readList(config.key, config.defaults);

  function render() {
    if (!items.length) {
      listNode.innerHTML = '<p class="empty-note">暂无条目，点击“添加”创建。</p>';
      return;
    }

    listNode.innerHTML = items
      .map((item, index) => {
        const anchorId = type === "carry" ? `id="item-${index + 1}"` : "";
        const meta = type === "spirit"
          ? `<span class="item-source">${config.linkLabel}：${item.link}</span>`
          : `<a class="card-link" target="_blank" rel="noreferrer" href="${item.link}">${config.linkLabel}</a>`;

        return `
          <article class="item-row" ${anchorId}>
            <div class="item-row-head">
              <h3 class="item-title">${item.title}</h3>
              <div class="item-toolbar">
                <button class="ui-btn" type="button" data-edit="${index}">编辑</button>
                <button class="ui-btn" type="button" data-del="${index}">删除</button>
              </div>
            </div>
            <p class="item-desc">${item.desc}</p>
            ${meta}
          </article>
        `;
      })
      .join("");
  }

  function save() {
    writeList(config.key, items);
    render();
  }

  addBtn.addEventListener("click", () => {
    const next = promptItem();
    if (!next) {
      return;
    }

    items.push(next);
    save();
  });

  listNode.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const editIndex = target.getAttribute("data-edit");
    if (editIndex !== null) {
      const index = Number(editIndex);
      if (Number.isNaN(index)) {
        return;
      }

      const next = promptItem(items[index]);
      if (!next) {
        return;
      }

      items[index] = next;
      save();
      return;
    }

    const delIndex = target.getAttribute("data-del");
    if (delIndex !== null) {
      const index = Number(delIndex);
      if (Number.isNaN(index)) {
        return;
      }

      if (window.confirm("确认删除这个条目吗？")) {
        items.splice(index, 1);
        save();
      }
    }
  });

  render();
}

setupEditorPage();

function setupPageLayouts() {
  const body = document.body;

  if (!body) {
    return;
  }

  const page = window.location.pathname.split("/").pop() || "";

  if (page === "objects-store.html") {
    body.setAttribute("data-layout", "objects");
  } else if (page === "programs.html") {
    body.setAttribute("data-layout", "programs");
  } else if (page === "carry-world.html") {
    body.setAttribute("data-layout", "carry");
  } else if (page === "history.html") {
    body.setAttribute("data-layout", "history");
  } else if (page === "art-consciousness.html") {
    body.setAttribute("data-layout", "art-consciousness");
  }
}

setupPageLayouts();
queueDepthUpdate();
