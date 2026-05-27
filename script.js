const revealItems = document.querySelectorAll(".reveal");
const logo = document.querySelector(".logo");
const textTargets = document.querySelectorAll(
  ".hero-copy, .section-copy, .statement-shell, .feature-card, .frame, .depth-card, .editor-intro, .editor-card, .history-item, .work-item"
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
      { title: "窗口 1：艺术品", desc: "作品链接入口。", link: "./objects-store.html" },
      { title: "窗口 2：周边", desc: "周边链接入口。", link: "./objects-store.html" },
      { title: "窗口 3：展览", desc: "展览链接入口。", link: "./programs.html" },
      { title: "窗口 4：书籍", desc: "书籍链接入口。", link: "./programs.html" },
      { title: "窗口 5：活动", desc: "活动链接入口。", link: "./programs.html" },
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
            <a class="card-link" target="_blank" rel="noreferrer" href="${item.link}">${config.linkLabel}</a>
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
  }
}

setupPageLayouts();
queueDepthUpdate();
