const STAGE_CONTENT = {
  tarea1: {
    title: "Tarea 1 - Mapa de Empatia",
    text: "Bibliotecario y estudiantes se describen por lo que ven, escuchan y sienten; luego se ordena el ciclo de vida.",
    points: [
      "Bibliotecario: orden, cuaderno tachado, miedo a perder libros.",
      "Estudiantes: disponibilidad lenta, esperas, multas y frustracion.",
      "Ciclo de vida: elicitar, analizar, especificar y validar."
    ],
    cards: [
      { label: "Usuario", value: "Bibliotecario + estudiantes" },
      { label: "Dolor central", value: "Trazabilidad del libro" },
      { label: "Meta", value: "Lectura simple y clara" }
    ]
  },
  tarea2: {
    title: "Tarea 2 - Funciones Vitales",
    text: "Se priorizan 4 funciones que resuelven el dolor central y se eliminan 6 ideas que no atienden dolores directos.",
    points: [
      "F1 Registro de préstamo, F2 Alerta de vencimiento, F3 Consulta de disponibilidad, F4 Historial por usuario.",
      "FN1 a FN6 se eliminan por complejidad, falta de hardware o porque no resuelven pérdidas y trazabilidad.",
      "Regla: si no resuelve un dolor real, se elimina."
    ],
    cards: [
      { label: "Seleccion", value: "4 funciones vitales" },
      { label: "Descartes", value: "6 ideas eliminadas" },
      { label: "Criterio", value: "Valor > novedad" }
    ]
  },
  tarea3: {
    title: "Tarea 3 - Pilares de Restriccion",
    text: "La solucion se adapta a tecnologia disponible, presupuesto minimo, tiempo corto y alfabetizacion digital real.",
    points: [
      "Tecnologia: un computador antiguo, sin touchscreen, sin impresora de etiquetas, sin tablet y con WiFi inestable.",
      "Presupuesto: biblioteca sin ánimo de lucro, depende de donaciones y no puede pagar suscripciones.",
      "Tiempo y uso: máximo 2 semanas, sin cerrar la biblioteca y con interfaz de pasos mínimos."
    ],
    cards: [
      { label: "Tecnologia", value: "Hardware limitado" },
      { label: "Presupuesto", value: "Donaciones / bajo costo" },
      { label: "Tiempo", value: "Maximo 2 semanas" }
    ]
  },
  final: {
    title: "Solucion en debate",
    text: "La solucion final se define en clase, asi que esta fase queda como espacio abierto de validacion.",
    points: [
      "Pendiente de definicion final con el grupo y el profesor.",
      "Se ajustara segun el feedback de la clase.",
      "La presentacion AR debe seguir siendo clara y legible."
    ],
    cards: [
      { label: "Estado", value: "Pendiente" },
      { label: "Uso", value: "Discusion en clase" },
      { label: "Nota", value: "No se define aun" }
    ]
  }
};

const ENGINE_READY = Boolean(window.AFRAME && window.AFRAME.registerComponent && window.THREE);
let previewEnabled = false;
let noMarkerTimeoutId = null;

let markerEl = null;
let sceneRootEl = null;
let previewRootEl = null;
let summaryPanelManuallyToggled = false;
let summaryPanelCollapsed = false;

function createFallbackEntity(kind) {
  const entity = document.createElement("a-entity");

  if (kind === "student" || kind === "librarian") {
    const body = document.createElement("a-cylinder");
    body.setAttribute("radius", "0.08");
    body.setAttribute("height", "0.22");
    body.setAttribute("color", kind === "student" ? "#4f87d7" : "#2f8e65");
    body.setAttribute("position", "0 0.12 0");

    const head = document.createElement("a-sphere");
    head.setAttribute("radius", "0.055");
    head.setAttribute("color", "#f3c9a8");
    head.setAttribute("position", "0 0.28 0");

    entity.appendChild(body);
    entity.appendChild(head);
    return entity;
  }

  if (kind === "book") {
    const book = document.createElement("a-box");
    book.setAttribute("width", "0.16");
    book.setAttribute("height", "0.03");
    book.setAttribute("depth", "0.22");
    book.setAttribute("color", "#7c3f1b");
    entity.appendChild(book);
    return entity;
  }

  if (kind === "desk") {
    const desk = document.createElement("a-box");
    desk.setAttribute("width", "0.55");
    desk.setAttribute("height", "0.16");
    desk.setAttribute("depth", "0.3");
    desk.setAttribute("color", "#8f6a4b");
    desk.setAttribute("position", "0 0.08 0");
    entity.appendChild(desk);
    return entity;
  }

  if (kind === "shelf") {
    const shelf = document.createElement("a-box");
    shelf.setAttribute("width", "0.28");
    shelf.setAttribute("height", "0.34");
    shelf.setAttribute("depth", "0.1");
    shelf.setAttribute("color", "#b08969");
    shelf.setAttribute("position", "0 0.17 0");
    entity.appendChild(shelf);
    return entity;
  }

  if (kind === "return-box") {
    const returnBox = document.createElement("a-box");
    returnBox.setAttribute("width", "0.18");
    returnBox.setAttribute("height", "0.22");
    returnBox.setAttribute("depth", "0.16");
    returnBox.setAttribute("color", "#6e7480");
    returnBox.setAttribute("position", "0 0.11 0");
    entity.appendChild(returnBox);
    return entity;
  }

  if (kind === "arrow") {
    const arrow = document.createElement("a-cone");
    arrow.setAttribute("radius-bottom", "0.07");
    arrow.setAttribute("radius-top", "0.01");
    arrow.setAttribute("height", "0.17");
    arrow.setAttribute("color", "#f0a312");
    arrow.setAttribute("rotation", "90 0 0");
    entity.appendChild(arrow);
    return entity;
  }

  const base = document.createElement("a-box");
  base.setAttribute("width", "0.9");
  base.setAttribute("height", "0.06");
  base.setAttribute("depth", "0.9");
  base.setAttribute("color", "#ced9c9");
  base.setAttribute("opacity", "0.85");
  base.setAttribute("position", "0 0.03 0");
  entity.appendChild(base);
  return entity;
}

if (ENGINE_READY && !AFRAME.components["model-fallback"]) {
  AFRAME.registerComponent("model-fallback", {
    schema: { type: "string", default: "base" },
    init: function () {
      const fallback = createFallbackEntity(this.data);
      fallback.setAttribute("visible", true);
      fallback.classList.add("fallback-shape");
      this.el.appendChild(fallback);
      this.fallback = fallback;

      const validateLoadedMesh = () => {
        const mesh = this.el.getObject3D("mesh");
        if (!mesh || !window.THREE) {
          if (this.fallback) {
            this.fallback.setAttribute("visible", true);
          }
          return;
        }

        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const largestSide = Math.max(size.x || 0, size.y || 0, size.z || 0);
        const hasValidGeometry = !box.isEmpty() && Number.isFinite(largestSide) && largestSide > 0.001;

        if (this.fallback) {
          this.fallback.setAttribute("visible", !hasValidGeometry);
        }
      };

      this.el.addEventListener("model-loaded", () => {
        // Delay one frame to ensure mesh bounds are available.
        window.setTimeout(validateLoadedMesh, 0);
      });

      this.el.addEventListener("model-error", () => {
        if (this.fallback) {
          this.fallback.setAttribute("visible", true);
        }
      });
    }
  });
}

if (ENGINE_READY && !AFRAME.components["fit-model"]) {
  AFRAME.registerComponent("fit-model", {
    schema: {
      height: { type: "number", default: 0.2 },
      width: { type: "number", default: 0 },
      depth: { type: "number", default: 0 },
      centerX: { type: "boolean", default: true },
      centerZ: { type: "boolean", default: true },
      ground: { type: "boolean", default: true }
    },

    init: function () {
      this.onModelLoaded = this.fit.bind(this);
      this.baseScale = null;
      this.el.addEventListener("model-loaded", this.onModelLoaded);
      this.fit();
    },

    remove: function () {
      this.el.removeEventListener("model-loaded", this.onModelLoaded);
    },

    fit: function () {
      const mesh = this.el.getObject3D("mesh");
      if (!mesh || !window.THREE) {
        return;
      }

      if (!this.baseScale) {
        this.baseScale = mesh.scale.clone();
      }

      mesh.scale.copy(this.baseScale);
      mesh.position.set(0, 0, 0);

      const rawBox = new THREE.Box3().setFromObject(mesh);
      if (rawBox.isEmpty()) {
        return;
      }

      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);

      const ratios = [];
      if (this.data.height > 0 && rawSize.y > 0) {
        ratios.push(this.data.height / rawSize.y);
      }
      if (this.data.width > 0 && rawSize.x > 0) {
        ratios.push(this.data.width / rawSize.x);
      }
      if (this.data.depth > 0 && rawSize.z > 0) {
        ratios.push(this.data.depth / rawSize.z);
      }

      const validRatios = ratios.filter((value) => Number.isFinite(value) && value > 0);
      if (validRatios.length > 0) {
        mesh.scale.multiplyScalar(Math.min(...validRatios));
      }

      const fittedBox = new THREE.Box3().setFromObject(mesh);
      if (fittedBox.isEmpty()) {
        return;
      }

      const center = new THREE.Vector3();
      fittedBox.getCenter(center);

      const offset = new THREE.Vector3(
        this.data.centerX ? -center.x : 0,
        this.data.ground ? -fittedBox.min.y : 0,
        this.data.centerZ ? -center.z : 0
      );

      mesh.position.add(offset);
    }
  });
}

const STAGE_THEME = {
  green: "#215f3f",
  cream: "#f4ead3",
  blue: "#e9f4ff",
  dark: "#2a2411",
  deep: "#173021",
  danger: "#d32f2f",
  light: "#fdfaf2",
};

function createAFrameNode(tagName, attributes = {}, children = []) {
  const node = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      node.setAttribute(key, value);
    }
  });
  children.forEach((child) => node.appendChild(child));
  return node;
}

function createPanelShell(position, width, height, backgroundColor, opacity = 0.26) {
  return createAFrameNode(
    "a-entity",
    {
      position,
      "look-at": "[camera]",
    },
    [
      createAFrameNode("a-plane", {
        width,
        height,
        color: backgroundColor,
        opacity,
      }),
    ]
  );
}

function offsetPosition(positionString, xOffset = 0, yOffset = 0, zOffset = 0) {
  const parts = String(positionString || "0 0 0").trim().split(/\s+/);
  if (parts.length < 3) {
    return positionString;
  }

  const x = Number(parts[0]);
  const y = Number(parts[1]);
  const z = Number(parts[2]);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return positionString;
  }

  return `${x + xOffset} ${y + yOffset} ${z + zOffset}`;
}

function sanitizeARText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/·/g, "-");
}

function createInfoCard({
  position,
  width,
  height,
  backgroundColor,
  backgroundOpacity = 0.82,
  backgroundVisible = true,
  title,
  titleBackgroundColor = STAGE_THEME.green,
  titleColor = "#ffffff",
  textColor = STAGE_THEME.dark,
  lines = [],
  align = "center",
  titleOnly = false,
  lookAt = false,
  clickableClass = "",
  lineWidthFactor = 0.78,
  lineWrapCount = 26,
  lineStartY,
  lineStep = 0.07,
}) {
  const card = createAFrameNode("a-entity", {
    position,
    ...(lookAt ? { "look-at": "[camera]" } : {}),
  });
  const planes = [];
  if (backgroundVisible) {
    const backgroundPlane = createAFrameNode("a-plane", {
      width,
      height,
      color: backgroundColor,
      opacity: backgroundOpacity,
    });
    planes.push(backgroundPlane);
    card.appendChild(backgroundPlane);
  }

  if (title) {
    if (titleOnly) {
      card.appendChild(
        createAFrameNode("a-text", {
          value: sanitizeARText(title),
          align: "center",
          color: titleColor,
          width: width * 0.82,
          position: "0 0 0.02",
        })
      );
    } else {
      const titleY = height / 2 - 0.055;
      const titlePlane = createAFrameNode("a-plane", {
          width: width * 0.96,
          height: 0.11,
          color: titleBackgroundColor,
          opacity: 0.82,
          position: `0 ${titleY} 0.01`,
        });
      planes.push(titlePlane);
      card.appendChild(titlePlane);
      card.appendChild(
        createAFrameNode("a-text", {
          value: sanitizeARText(title),
          align: "center",
          color: titleColor,
          width: width * 0.74,
          position: `0 ${titleY} 0.02`,
        })
      );
    }
  }

  const effectiveLineStartY = lineStartY !== undefined ? lineStartY : height / 2 - (titleOnly ? 0.04 : 0.17);

  lines.forEach((line, index) => {
    card.appendChild(
      createAFrameNode("a-text", {
        value: sanitizeARText(line),
        align,
        color: textColor,
        width: width * lineWidthFactor,
        "wrap-count": lineWrapCount,
        position: `0 ${effectiveLineStartY - index * lineStep} 0.02`,
      })
    );
  });

  if (clickableClass) {
    card.classList.add(clickableClass);
    planes.forEach((plane) => plane.classList.add(clickableClass));
  }

  return card;
}

function bindReliableToggle(target, toggleFn) {
  if (!target) {
    return;
  }

  let lockUntil = 0;
  const cooldownMs = 180;

  const safeTrigger = (event) => {
    const now = Date.now();
    if (now < lockUntil) {
      return;
    }

    lockUntil = now + cooldownMs;

    toggleFn();
  };

  // A-Frame cursor/raycaster commonly emits click; pointer events are not guaranteed.
  target.addEventListener("click", safeTrigger);
}

function bindHoverToggle(target, showFn, hideFn) {
  if (!target) {
    return;
  }

  let hideTimer = null;

  const clearHideTimer = () => {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const show = () => {
    clearHideTimer();
    showFn();
  };

  const hide = () => {
    clearHideTimer();
    hideTimer = window.setTimeout(() => {
      hideFn();
    }, 80);
  };

  target.addEventListener("mouseenter", show);
  target.addEventListener("mouseleave", hide);

  // Extra events improve reliability with A-Frame raycasters.
  target.addEventListener("raycaster-intersected", show);
  target.addEventListener("raycaster-intersected-cleared", hide);
}

function createTogglePanel({
  position,
  width,
  height,
  header,
  headerWidth,
  headerHeight = 0.14,
  headerPosition,
  detailsPosition,
  detailCards = [],
  backgroundColor = STAGE_THEME.cream,
  opacity = 0.82,
  shellVisible = true,
  interactionMode = "click",
}) {
  const panel = createPanelShell(position, width, height, backgroundColor, opacity);
  const shellPlane = panel.querySelector("a-plane");
  if (shellPlane && !shellVisible) {
    shellPlane.setAttribute("visible", false);
  }

  const resolvedHeaderWidth = headerWidth || width * 0.88;
  const resolvedHeaderPosition = headerPosition || `0 ${height / 2 - headerHeight / 2 - 0.03} 0.01`;
  const interactionPadX = Math.max(0.56, resolvedHeaderWidth * 0.38);
  const interactionPadY = interactionMode === "hover" ? 0.66 : 0.56;

  const headerCard = createInfoCard({
    position: resolvedHeaderPosition,
    width: resolvedHeaderWidth,
    height: headerHeight,
    backgroundColor: STAGE_THEME.green,
    title: header,
    titleOnly: true,
    titleColor: "#ffffff",
  });
  panel.appendChild(headerCard);

  // Only the label/header is clickable, per UX requirement.
  const headerHitPlane = createAFrameNode("a-plane", {
    width: resolvedHeaderWidth + interactionPadX,
    height: headerHeight + interactionPadY,
    color: "#ffffff",
    opacity: 0.001,
    side: "double",
    position: offsetPosition(resolvedHeaderPosition, 0, -0.06, 0.03),
  });
  headerHitPlane.classList.add("toggle-hit");
  panel.appendChild(headerHitPlane);

  // Secondary halo extends touch area around the header for mobile usability.
  const headerHaloHitPlane = createAFrameNode("a-plane", {
    width: resolvedHeaderWidth + interactionPadX + 0.42,
    height: headerHeight + interactionPadY + 0.52,
    color: "#ffffff",
    opacity: 0.001,
    side: "double",
    position: offsetPosition(resolvedHeaderPosition, 0, -0.24, 0.02),
  });
  headerHaloHitPlane.classList.add("toggle-hit");
  panel.appendChild(headerHaloHitPlane);

  const detailsGroup = createAFrameNode("a-entity", {
    position: detailsPosition || "0 0 0.01",
    visible: false,
  });
  detailCards.forEach((card) => detailsGroup.appendChild(card));
  panel.appendChild(detailsGroup);

  const toggleDetails = () => {
    const isVisible = detailsGroup.getAttribute("visible");
    detailsGroup.setAttribute("visible", !isVisible);
  };

  const showDetails = () => {
    detailsGroup.setAttribute("visible", true);
  };

  const hideDetails = () => {
    detailsGroup.setAttribute("visible", false);
  };

  if (interactionMode === "hover") {
    bindHoverToggle(headerHitPlane, showDetails, hideDetails);
    bindHoverToggle(headerHaloHitPlane, showDetails, hideDetails);
    bindHoverToggle(detailsGroup, showDetails, hideDetails);
    // Keep click fallback for touch devices or browsers without reliable hover.
    bindReliableToggle(headerHitPlane, toggleDetails);
    bindReliableToggle(headerHaloHitPlane, toggleDetails);
  } else {
    bindReliableToggle(headerHitPlane, toggleDetails);
    bindReliableToggle(headerHaloHitPlane, toggleDetails);
  }

  return panel;
}

function createTitleBanner(position, width, text) {
  const banner = createAFrameNode("a-entity", {
    position,
    "look-at": "[camera]",
  });

  banner.appendChild(
    createAFrameNode("a-plane", {
      width,
      height: 0.18,
      color: STAGE_THEME.green,
      opacity: 0.9,
    })
  );

  banner.appendChild(
    createAFrameNode("a-text", {
      value: sanitizeARText(text),
      align: "center",
      color: "#ffffff",
      width: width * 0.86,
      position: "0 0 0.01",
    })
  );

  return banner;
}

function setupManualToggleRaycast(scene) {
  if (!scene || !window.THREE) {
    return;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const collectToggleMeshes = () => {
    const meshToEntity = new Map();
    const meshes = [];

    document.querySelectorAll(".toggle-hit").forEach((entity) => {
      const root = entity && entity.object3D;
      if (!root || root.visible === false) {
        return;
      }

      root.traverse((child) => {
        if (child && child.isMesh) {
          meshes.push(child);
          meshToEntity.set(child, entity);
        }
      });
    });

    return { meshes, meshToEntity };
  };

  const castAndEmitClick = (clientX, clientY) => {
    const canvas = scene.canvas;
    const camera = scene.camera;

    if (!canvas || !camera) {
      return false;
    }

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return false;
    }

    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const { meshes, meshToEntity } = collectToggleMeshes();
    if (!meshes.length) {
      return false;
    }

    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(meshes, true);
    if (!intersections.length) {
      return false;
    }

    let mesh = intersections[0].object;
    while (mesh && !meshToEntity.has(mesh)) {
      mesh = mesh.parent;
    }

    const target = mesh ? meshToEntity.get(mesh) : null;
    if (!target) {
      return false;
    }

    target.emit("click", { source: "manual-raycast" });
    return true;
  };

  const attach = () => {
    const canvas = scene.canvas;
    if (!canvas || canvas.dataset.toggleBridgeAttached === "1") {
      return;
    }

    canvas.dataset.toggleBridgeAttached = "1";

    canvas.addEventListener("click", (event) => {
      castAndEmitClick(event.clientX, event.clientY);
    });

    canvas.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches && event.changedTouches[0];
        if (touch) {
          castAndEmitClick(touch.clientX, touch.clientY);
        }
      },
      { passive: true }
    );
  };

  if (scene.hasLoaded) {
    attach();
  } else {
    scene.addEventListener("loaded", attach, { once: true });
  }
}

function buildStageTarea2Interactive(stageEl) {
  stageEl.replaceChildren();

  stageEl.appendChild(createTitleBanner("0 1.2 0", 1.8, "Tarea 2 — Funciones Vitales"));

  // Tarea 2: el estudiante pide el libro.
  stageEl.appendChild(
    createAFrameNode("a-entity", { position: "0 0.24 0.20" }, [
      createAFrameNode("a-entity", { position: "-0.84 0.18 -0.06" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-estante",
          "model-fallback": "shelf",
          "fit-model": "height: 0.42; width: 0.36; depth: 0.18",
          scale: "0.98 0.98 0.98",
        }),
      ]),
      createAFrameNode("a-entity", { position: "0.00 -0.02 0.05" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-mesa",
          "model-fallback": "desk",
          "fit-model": "height: 0.30; width: 0.58; depth: 0.36",
          scale: "1.08 1.08 1.08",
        }),
      ]),
      createAFrameNode("a-entity", { position: "0.38 0.08 0.16" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-estudiante",
          rotation: "0 -26 0",
          "model-fallback": "student",
          "fit-model": "height: 0.42; width: 0.24; depth: 0.22",
          scale: "1.14 1.14 1.14",
        }),
      ]),
      createAFrameNode("a-entity", { position: "0.04 0.26 0.11" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-libro",
          "model-fallback": "book",
          "fit-model": "height: 0.15; width: 0.18; depth: 0.14",
          scale: "1.60 1.60 1.60",
          animation__move: "property: position; dir: alternate; dur: 3400; easing: easeInOutSine; loop: true; from: 0.00 0.26 0.10; to: 0.30 0.31 0.16",
          animation__tilt: "property: rotation; dir: alternate; dur: 3400; easing: easeInOutSine; loop: true; from: -8 0 -10; to: 10 0 12",
        }),
      ]),
    ])
  );

  const leftPanel = createTogglePanel({
    position: "-1.5 0.6 0",
    width: 1.25,
    height: 1.72,
    header: "LAS 4 FUNCIONES VITALES",
    headerWidth: 1.08,
    headerPosition: "0 0.62 0.01",
    detailsPosition: "0 0.08 0.01",
    detailCards: [
      createInfoCard({
        position: "0 0.36 0.01",
        width: 1.05,
        height: 0.28,
        backgroundColor: STAGE_THEME.cream,
        title: "F1 · Registro de préstamo",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Anotar quien lleva cada libro", "y en que fecha", "Resuelve el dolor del cuaderno"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
      createInfoCard({
        position: "0 0.03 0.01",
        width: 1.05,
        height: 0.28,
        backgroundColor: STAGE_THEME.cream,
        title: "F2 · Alerta de vencimiento",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Notificacion automatica", "WhatsApp o SMS", "2 dias antes del vencimiento"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
    ],
  });
  stageEl.appendChild(leftPanel);

  const rightPanel = createTogglePanel({
    position: "1.5 0.6 0",
    width: 1.25,
    height: 1.72,
    header: "LAS 4 FUNCIONES VITALES",
    headerWidth: 1.08,
    headerPosition: "0 0.62 0.01",
    detailsPosition: "0 0.08 0.01",
    detailCards: [
      createInfoCard({
        position: "0 0.36 0.01",
        width: 1.05,
        height: 0.30,
        backgroundColor: STAGE_THEME.cream,
        title: "F3 · Consulta de disponibilidad",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Ver si un libro esta disponible", "o prestado", "sin preguntarle al bibliotecario"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
      createInfoCard({
        position: "0 0.00 0.01",
        width: 1.05,
        height: 0.30,
        backgroundColor: STAGE_THEME.cream,
        title: "F4 · Historial por usuario",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Saber cuantos libros llevo", "cada persona", "y si tiene pendientes"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
    ],
  });
  stageEl.appendChild(rightPanel);

  const bottomPanel = createTogglePanel({
    position: "0 0.10 0.42",
    width: 3.2,
    height: 1.04,
    header: "LAS 6 ELIMINADAS",
    headerWidth: 1.22,
    headerPosition: "0 0.31 0.01",
    detailsPosition: "0 0.00 0.01",
    backgroundColor: STAGE_THEME.blue,
    opacity: 0.88,
    shellVisible: false,
    interactionMode: "hover",
    detailCards: [
      createInfoCard({
        position: "-1.06 0.04 0.01",
        width: 0.92,
        height: 0.30,
        backgroundColor: STAGE_THEME.light,
        title: "FN1 + FN2",
        titleBackgroundColor: STAGE_THEME.cream,
        titleColor: STAGE_THEME.danger,
        textColor: STAGE_THEME.danger,
        lines: ["FN1 Catalogo inmersivo", "Sin hardware disponible", "FN2 Resenas no controla"],
        lineStartY: 0.025,
        lineStep: 0.065,
        lineWidthFactor: 0.66,
        lineWrapCount: 40,
      }),
      createInfoCard({
        position: "0 0.04 0.01",
        width: 0.92,
        height: 0.30,
        backgroundColor: STAGE_THEME.light,
        title: "FN3 + FN4",
        titleBackgroundColor: STAGE_THEME.cream,
        titleColor: STAGE_THEME.danger,
        textColor: STAGE_THEME.danger,
        lines: ["FN3 IA recomendadora", "Sobrecarga tecnica", "FN4 Nube innecesaria"],
        lineStartY: 0.025,
        lineStep: 0.065,
        lineWidthFactor: 0.66,
        lineWrapCount: 40,
      }),
      createInfoCard({
        position: "1.06 0.04 0.01",
        width: 0.92,
        height: 0.30,
        backgroundColor: STAGE_THEME.light,
        title: "FN5 + FN6",
        titleBackgroundColor: STAGE_THEME.cream,
        titleColor: STAGE_THEME.danger,
        textColor: STAGE_THEME.danger,
        lines: ["FN5 Gamificacion distractor", "FN6 Escaner ISBN limitado", "No resuelven dolor central"],
        lineStartY: 0.025,
        lineStep: 0.065,
        lineWidthFactor: 0.66,
        lineWrapCount: 40,
      }),
    ],
  });
  stageEl.appendChild(bottomPanel);
}

function buildStageTarea3Interactive(stageEl) {
  stageEl.replaceChildren();

  stageEl.appendChild(createTitleBanner("0 1.2 0", 2.0, "Tarea 3 — Los 3 Pilares de Restricción"));

  // Tarea 3: el estudiante devuelve el libro.
  stageEl.appendChild(
    createAFrameNode("a-entity", { position: "0 0.24 0.20" }, [
      createAFrameNode("a-entity", { position: "-0.84 0.18 -0.06" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-estante",
          "model-fallback": "shelf",
          "fit-model": "height: 0.42; width: 0.36; depth: 0.18",
          scale: "0.95 0.95 0.95",
        }),
      ]),
      createAFrameNode("a-entity", { position: "0.00 -0.02 0.05" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-mesa",
          "model-fallback": "desk",
          "fit-model": "height: 0.30; width: 0.58; depth: 0.36",
          scale: "1.08 1.08 1.08",
        }),
      ]),
      createAFrameNode("a-entity", { position: "-0.36 0.08 0.16" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-estudiante",
          rotation: "0 16 0",
          "model-fallback": "student",
          "fit-model": "height: 0.42; width: 0.24; depth: 0.22",
          scale: "1.14 1.14 1.14",
        }),
      ]),
      createAFrameNode("a-entity", { position: "0.06 0.26 0.11" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-libro",
          "model-fallback": "book",
          "fit-model": "height: 0.15; width: 0.18; depth: 0.14",
          scale: "1.60 1.60 1.60",
          animation__move: "property: position; dir: alternate; dur: 3400; easing: easeInOutSine; loop: true; from: 0.00 0.26 0.10; to: 0.40 0.30 0.16",
          animation__tilt: "property: rotation; dir: alternate; dur: 3400; easing: easeInOutSine; loop: true; from: -8 0 10; to: 10 0 -10",
        }),
      ]),
      createAFrameNode("a-entity", { position: "0.50 0.06 0.16" }, [
        createAFrameNode("a-entity", {
          "gltf-model": "#model-buzon",
          "model-fallback": "return-box",
          "fit-model": "height: 0.34; width: 0.26; depth: 0.22",
          scale: "1.05 1.05 1.05",
        }),
      ]),
    ])
  );

  const leftPanel = createTogglePanel({
    position: "-1.5 0.6 0",
    width: 1.25,
    height: 1.9,
    header: "TECNOLOGIA",
    headerWidth: 1.08,
    headerPosition: "0 0.68 0.01",
    detailsPosition: "0 0.04 0.01",
    detailCards: [
      createInfoCard({
        position: "0 0.40 0.01",
        width: 1.05,
        height: 0.28,
        backgroundColor: STAGE_THEME.cream,
        title: "Computador antiguo",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Sin touchscreen", "Un solo equipo de escritorio", "Poco potente"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
      createInfoCard({
        position: "0 0.06 0.01",
        width: 1.05,
        height: 0.28,
        backgroundColor: STAGE_THEME.cream,
        title: "Sin impresora ni tablet",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Sin impresora de etiquetas", "No hay tablet disponible", "Debe operar con lo existente"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
      createInfoCard({
        position: "0 -0.28 0.01",
        width: 1.05,
        height: 0.28,
        backgroundColor: STAGE_THEME.cream,
        title: "WiFi inestable",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Conexion intermitente", "No depender de conexion constante", "Flujo ligero y local"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
    ],
  });
  stageEl.appendChild(leftPanel);

  const rightPanel = createTogglePanel({
    position: "1.5 0.6 0",
    width: 1.25,
    height: 1.9,
    header: "PRESUPUESTO",
    headerWidth: 1.08,
    headerPosition: "0 0.68 0.01",
    detailsPosition: "0 0.04 0.01",
    detailCards: [
      createInfoCard({
        position: "0 0.42 0.01",
        width: 1.05,
        height: 0.24,
        backgroundColor: STAGE_THEME.cream,
        title: "Sin animo de lucro",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Biblioteca comunitaria", "Depende de donaciones"],
        lineStartY: 0.02,
        lineStep: 0.08,
      }),
      createInfoCard({
        position: "0 0.08 0.01",
        width: 1.05,
        height: 0.24,
        backgroundColor: STAGE_THEME.cream,
        title: "Sin suscripciones",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["No puede pagar suscripciones", "Evitar costos recurrentes"],
        lineStartY: 0.02,
        lineStep: 0.08,
      }),
      createInfoCard({
        position: "0 -0.26 0.01",
        width: 1.05,
        height: 0.28,
        backgroundColor: STAGE_THEME.cream,
        title: "Costo único bajo",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Solucion gratuita", "o de pago unico muy bajo", "sin licencias caras"],
        lineStartY: 0.03,
        lineStep: 0.07,
      }),
    ],
  });
  stageEl.appendChild(rightPanel);

  const bottomPanel = createTogglePanel({
    position: "0 0.10 0.42",
    width: 3.2,
    height: 1.18,
    header: "TIEMPO + ALFABETIZACION DIGITAL",
    headerWidth: 1.34,
    headerPosition: "0 0.33 0.01",
    detailsPosition: "0 0.00 0.01",
    backgroundColor: STAGE_THEME.blue,
    opacity: 0.88,
    shellVisible: false,
    interactionMode: "hover",
    detailCards: [
      createInfoCard({
        position: "-1.08 0.05 0.01",
        width: 0.94,
        height: 0.34,
        backgroundColor: STAGE_THEME.light,
        title: "TIEMPO",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Resultados en maximo 2 semanas", "No cerrar la biblioteca", "Sin tiempo para cursos largos"],
        lineStartY: 0.025,
        lineStep: 0.07,
        lineWidthFactor: 0.66,
        lineWrapCount: 40,
      }),
      createInfoCard({
        position: "0 0.05 0.01",
        width: 1.0,
        height: 0.46,
        backgroundColor: STAGE_THEME.light,
        backgroundVisible: false,
        title: "BIBLIOTECARIO",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Nivel basico", "Sabe Word y correo", "Nunca uso app web", "Letras grandes y pasos minimos"],
        lineStartY: 0.09,
        lineStep: 0.065,
        lineWidthFactor: 0.66,
        lineWrapCount: 40,
      }),
      createInfoCard({
        position: "1.08 0.05 0.01",
        width: 0.94,
        height: 0.46,
        backgroundColor: STAGE_THEME.light,
        title: "NINOS DE PRIMARIA",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Nivel medio", "Usan celular y YouTube", "No manejan formularios complejos", "Consulta a 1 toque"],
        lineStartY: 0.09,
        lineStep: 0.065,
        lineWidthFactor: 0.66,
        lineWrapCount: 40,
      }),
    ],
  });
  stageEl.appendChild(bottomPanel);
}

function buildStageFinalInteractive(stageEl) {
  stageEl.replaceChildren();

  stageEl.appendChild(createTitleBanner("0 1.2 0", 1.75, "Solución en debate"));

  const leftPanel = createTogglePanel({
    position: "-1.4 0.6 0",
    width: 1.25,
    height: 1.55,
    header: "POR DEFINIR EN CLASE",
    headerWidth: 1.08,
    headerPosition: "0 0.44 0.01",
    detailsPosition: "0 0.04 0.01",
    detailCards: [
      createInfoCard({
        position: "0 0.14 0.01",
        width: 1.05,
        height: 0.26,
        backgroundColor: STAGE_THEME.cream,
        title: "Flujo final",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["La ruta definitiva se debatirá", "con el grupo", "y con el profesor"],
        lineStartY: 0.03,
        lineStep: 0.08,
      }),
      createInfoCard({
        position: "0 -0.22 0.01",
        width: 1.05,
        height: 0.26,
        backgroundColor: STAGE_THEME.cream,
        title: "Alcance final",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Se ajustará según feedback", "No cerrar todavía la solución", "Mantener hipótesis abiertas"],
        lineStartY: 0.03,
        lineStep: 0.08,
      }),
    ],
  });
  stageEl.appendChild(leftPanel);

  const rightPanel = createTogglePanel({
    position: "1.4 0.6 0",
    width: 1.25,
    height: 1.55,
    header: "CRITERIOS DE CIERRE",
    headerWidth: 1.08,
    headerPosition: "0 0.44 0.01",
    detailsPosition: "0 0.04 0.01",
    detailCards: [
      createInfoCard({
        position: "0 0.14 0.01",
        width: 1.05,
        height: 0.26,
        backgroundColor: STAGE_THEME.cream,
        title: "Simple",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Pasos mínimos", "Letras grandes", "Uso sin capacitación extensa"],
        lineStartY: 0.03,
        lineStep: 0.08,
      }),
      createInfoCard({
        position: "0 -0.22 0.01",
        width: 1.05,
        height: 0.26,
        backgroundColor: STAGE_THEME.cream,
        title: "Viable",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Gratuita o muy barata", "Implementable con hardware actual", "Legible en AR"],
        lineStartY: 0.03,
        lineStep: 0.08,
      }),
    ],
  });
  stageEl.appendChild(rightPanel);

  const bottomPanel = createTogglePanel({
    position: "0 0.1 0.4",
    width: 3.1,
    height: 0.88,
    header: "VALIDACIÓN PENDIENTE",
    headerWidth: 1.18,
    headerPosition: "0 0.27 0.01",
    detailsPosition: "0 -0.02 0.01",
    backgroundColor: STAGE_THEME.blue,
    opacity: 0.88,
    detailCards: [
      createInfoCard({
        position: "-0.98 0.00 0.01",
        width: 0.92,
        height: 0.24,
        backgroundColor: STAGE_THEME.light,
        title: "Clase",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["La solución se debatirá", "y se ajustará en clase"],
        lineStartY: 0.03,
        lineStep: 0.08,
        lineWidthFactor: 0.84,
      }),
      createInfoCard({
        position: "0.00 0.00 0.01",
        width: 0.92,
        height: 0.24,
        backgroundColor: STAGE_THEME.light,
        title: "Feedback",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["Se valida con el profesor", "y con el grupo"],
        lineStartY: 0.03,
        lineStep: 0.08,
        lineWidthFactor: 0.84,
      }),
      createInfoCard({
        position: "0.98 0.00 0.01",
        width: 0.92,
        height: 0.24,
        backgroundColor: STAGE_THEME.light,
        title: "Cierre",
        titleBackgroundColor: STAGE_THEME.green,
        titleColor: "#ffffff",
        textColor: STAGE_THEME.dark,
        lines: ["No cerrar prematuramente", "Mantener la solución abierta"],
        lineStartY: 0.03,
        lineStep: 0.08,
        lineWidthFactor: 0.84,
      }),
    ],
  });
  stageEl.appendChild(bottomPanel);
}

function buildStageTarea2(stageEl) {
  stageEl.replaceChildren();

  stageEl.appendChild(
    createInfoCard({
      position: "0 1.2 0",
      width: 1.8,
      height: 0.18,
      backgroundColor: STAGE_THEME.green,
      title: "Tarea 2 — Funciones Vitales",
      titleColor: "#ffffff",
      titleOnly: true,
      lookAt: true,
    })
  );

  const leftPanel = createPanelShell("-1.4 0.6 0", 1.25, 1.72, STAGE_THEME.cream, 0.82);
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.55 0.01",
      width: 1.02,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "LAS 4 FUNCIONES VITALES",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.20 0.01",
      width: 1.02,
      height: 0.28,
      backgroundColor: STAGE_THEME.cream,
      title: "F1 · Registro de préstamo",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Anotar quién llevó qué libro", "y en qué fecha", "Digitalmente"],
      lineStartY: 0.03,
      lineStep: 0.07,
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 -0.20 0.01",
      width: 1.02,
      height: 0.28,
      backgroundColor: STAGE_THEME.cream,
      title: "F2 · Alerta de vencimiento",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Notificación automática", "WhatsApp o SMS", "2 días antes del vencimiento"],
      lineStartY: 0.03,
      lineStep: 0.07,
    })
  );
  stageEl.appendChild(leftPanel);

  const rightPanel = createPanelShell("1.4 0.6 0", 1.25, 1.72, STAGE_THEME.cream, 0.82);
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.55 0.01",
      width: 1.02,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "LAS 4 FUNCIONES VITALES",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.20 0.01",
      width: 1.02,
      height: 0.30,
      backgroundColor: STAGE_THEME.cream,
      title: "F3 · Consulta de disponibilidad",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Ver si un libro está disponible", "o prestado", "sin preguntar al bibliotecario"],
      lineStartY: 0.03,
      lineStep: 0.07,
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 -0.22 0.01",
      width: 1.02,
      height: 0.30,
      backgroundColor: STAGE_THEME.cream,
      title: "F4 · Historial por usuario",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Saber cuántos libros llevó", "cada persona", "y si tiene pendientes"],
      lineStartY: 0.03,
      lineStep: 0.07,
    })
  );
  stageEl.appendChild(rightPanel);

  const bottomPanel = createPanelShell("0 0.1 0.4", 3.2, 1.0, STAGE_THEME.blue, 0.88);
  bottomPanel.appendChild(
    createInfoCard({
      position: "0 0.36 0.01",
      width: 1.22,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "LAS 6 ELIMINADAS",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "-1.04 0.06 0.01",
      width: 0.92,
      height: 0.26,
      backgroundColor: STAGE_THEME.light,
      title: "FN1 + FN2",
      titleBackgroundColor: STAGE_THEME.cream,
      titleColor: STAGE_THEME.danger,
      textColor: STAGE_THEME.danger,
      lines: ["Catálogo en realidad virtual", "App de reseñas", "No controlan préstamos"],
      lineStartY: 0.03,
      lineStep: 0.07,
      lineWidthFactor: 0.84,
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "0 0.06 0.01",
      width: 0.92,
      height: 0.26,
      backgroundColor: STAGE_THEME.light,
      title: "FN3 + FN4",
      titleBackgroundColor: STAGE_THEME.cream,
      titleColor: STAGE_THEME.danger,
      textColor: STAGE_THEME.danger,
      lines: ["IA recomendadora", "Nube multibiblioteca", "Sobrecarga técnica"],
      lineStartY: 0.03,
      lineStep: 0.07,
      lineWidthFactor: 0.84,
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "1.04 0.06 0.01",
      width: 0.92,
      height: 0.26,
      backgroundColor: STAGE_THEME.light,
      title: "FN5 + FN6",
      titleBackgroundColor: STAGE_THEME.cream,
      titleColor: STAGE_THEME.danger,
      textColor: STAGE_THEME.danger,
      lines: ["Gamificación de lectura", "Escáner ISBN con cámara", "No resuelven el dolor directo"],
      lineStartY: 0.03,
      lineStep: 0.07,
      lineWidthFactor: 0.84,
    })
  );
  stageEl.appendChild(bottomPanel);
}

function buildStageTarea3(stageEl) {
  stageEl.replaceChildren();

  stageEl.appendChild(
    createInfoCard({
      position: "0 1.2 0",
      width: 2.0,
      height: 0.18,
      backgroundColor: STAGE_THEME.green,
      title: "Tarea 3 — Los 3 Pilares de Restricción",
      titleColor: "#ffffff",
      titleOnly: true,
      lookAt: true,
    })
  );

  const leftPanel = createPanelShell("-1.4 0.6 0", 1.25, 1.9, STAGE_THEME.cream, 0.82);
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.66 0.01",
      width: 1.02,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "TECNOLOGÍA",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.34 0.01",
      width: 1.02,
      height: 0.24,
      backgroundColor: STAGE_THEME.cream,
      title: "Computador antiguo",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Sin touchscreen", "Poco potente"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.03 0.01",
      width: 1.02,
      height: 0.24,
      backgroundColor: STAGE_THEME.cream,
      title: "Sin impresora ni tablet",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["No imprimir etiquetas", "No hay tablet disponible"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 -0.30 0.01",
      width: 1.02,
      height: 0.24,
      backgroundColor: STAGE_THEME.cream,
      title: "WiFi inestable",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["No depender de conexión", "Flujo ligero y local"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  stageEl.appendChild(leftPanel);

  const rightPanel = createPanelShell("1.4 0.6 0", 1.25, 1.9, STAGE_THEME.cream, 0.82);
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.66 0.01",
      width: 1.02,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "PRESUPUESTO",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.34 0.01",
      width: 1.02,
      height: 0.24,
      backgroundColor: STAGE_THEME.cream,
      title: "Sin ánimo de lucro",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Depende de donaciones"],
      lineStartY: 0.02,
      lineStep: 0.08,
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.03 0.01",
      width: 1.02,
      height: 0.24,
      backgroundColor: STAGE_THEME.cream,
      title: "Sin suscripciones",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["No puede pagar suscripciones"],
      lineStartY: 0.02,
      lineStep: 0.08,
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 -0.30 0.01",
      width: 1.02,
      height: 0.24,
      backgroundColor: STAGE_THEME.cream,
      title: "Costo único bajo",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Solución gratuita", "o de pago único muy bajo"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  stageEl.appendChild(rightPanel);

  const bottomPanel = createPanelShell("0 0.1 0.4", 3.2, 1.15, STAGE_THEME.blue, 0.88);
  bottomPanel.appendChild(
    createInfoCard({
      position: "0 0.41 0.01",
      width: 1.34,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "TIEMPO + ALFABETIZACIÓN DIGITAL",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "-1.03 0.05 0.01",
      width: 0.94,
      height: 0.30,
      backgroundColor: STAGE_THEME.light,
      title: "TIEMPO",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Resultados en máximo 2 semanas", "No cerrar la biblioteca", "Sin cursos largos"],
      lineStartY: 0.03,
      lineStep: 0.08,
      lineWidthFactor: 0.84,
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "0.06 0.05 0.01",
      width: 1.08,
      height: 0.44,
      backgroundColor: STAGE_THEME.light,
      title: "BIBLIOTECARIO",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Nivel básico", "Sabe Word y correo", "Nunca ha usado una app web", "Interfaz extremadamente simple"],
      lineStartY: 0.10,
      lineStep: 0.08,
      lineWidthFactor: 0.86,
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "1.18 0.05 0.01",
      width: 0.94,
      height: 0.44,
      backgroundColor: STAGE_THEME.light,
      title: "NIÑOS DE PRIMARIA",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Nivel medio", "Usan celular para juegos y YouTube", "No manejan formularios complejos", "Consulta a 1 toque"],
      lineStartY: 0.10,
      lineStep: 0.08,
      lineWidthFactor: 0.86,
    })
  );
  stageEl.appendChild(bottomPanel);
}

function buildStageFinal(stageEl) {
  stageEl.replaceChildren();

  stageEl.appendChild(
    createInfoCard({
      position: "0 1.2 0",
      width: 1.75,
      height: 0.18,
      backgroundColor: STAGE_THEME.green,
      title: "Solución en debate",
      titleColor: "#ffffff",
      titleOnly: true,
      lookAt: true,
    })
  );

  const leftPanel = createPanelShell("-1.4 0.6 0", 1.25, 1.55, STAGE_THEME.cream, 0.82);
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.42 0.01",
      width: 1.02,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "POR DEFINIR EN CLASE",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 0.10 0.01",
      width: 1.02,
      height: 0.28,
      backgroundColor: STAGE_THEME.cream,
      title: "Flujo final",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["La ruta definitiva se discutirá", "con el grupo y el profesor"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  leftPanel.appendChild(
    createInfoCard({
      position: "0 -0.26 0.01",
      width: 1.02,
      height: 0.28,
      backgroundColor: STAGE_THEME.cream,
      title: "Alcance final",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Se ajustará según feedback", "No cerrar todavía la solución"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  stageEl.appendChild(leftPanel);

  const rightPanel = createPanelShell("1.4 0.6 0", 1.25, 1.55, STAGE_THEME.cream, 0.82);
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.42 0.01",
      width: 1.02,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "CRITERIOS DE CIERRE",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 0.10 0.01",
      width: 1.02,
      height: 0.28,
      backgroundColor: STAGE_THEME.cream,
      title: "Simple",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Pasos mínimos", "Letras grandes"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  rightPanel.appendChild(
    createInfoCard({
      position: "0 -0.26 0.01",
      width: 1.02,
      height: 0.28,
      backgroundColor: STAGE_THEME.cream,
      title: "Viable",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Gratuita o muy barata", "Legible en AR"],
      lineStartY: 0.03,
      lineStep: 0.08,
    })
  );
  stageEl.appendChild(rightPanel);

  const bottomPanel = createPanelShell("0 0.1 0.4", 3.1, 0.88, STAGE_THEME.blue, 0.88);
  bottomPanel.appendChild(
    createInfoCard({
      position: "0 0.27 0.01",
      width: 1.18,
      height: 0.14,
      backgroundColor: STAGE_THEME.green,
      title: "VALIDACIÓN PENDIENTE",
      titleOnly: true,
      titleColor: "#ffffff",
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "-0.98 -0.02 0.01",
      width: 0.92,
      height: 0.24,
      backgroundColor: STAGE_THEME.light,
      title: "Clase",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["La solución se debatirá", "y se ajustará en clase"],
      lineStartY: 0.03,
      lineStep: 0.08,
      lineWidthFactor: 0.84,
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "0.00 -0.02 0.01",
      width: 0.92,
      height: 0.24,
      backgroundColor: STAGE_THEME.light,
      title: "Feedback",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["Se valida con el profesor", "y con el grupo"],
      lineStartY: 0.03,
      lineStep: 0.08,
      lineWidthFactor: 0.84,
    })
  );
  bottomPanel.appendChild(
    createInfoCard({
      position: "0.98 -0.02 0.01",
      width: 0.92,
      height: 0.24,
      backgroundColor: STAGE_THEME.light,
      title: "Cierre",
      titleBackgroundColor: STAGE_THEME.green,
      titleColor: "#ffffff",
      textColor: STAGE_THEME.dark,
      lines: ["No cerrar prematuramente", "Mantener la solución abierta"],
      lineStartY: 0.03,
      lineStep: 0.08,
      lineWidthFactor: 0.84,
    })
  );
  stageEl.appendChild(bottomPanel);
}

function rebuildARStages() {
  const stage2 = document.getElementById("stage-tarea2");
  const stage3 = document.getElementById("stage-tarea3");
  const stageFinal = document.getElementById("stage-final");

  if (stage2) {
    buildStageTarea2Interactive(stage2);
  }

  if (stage3) {
    buildStageTarea3Interactive(stage3);
  }

  if (stageFinal) {
    buildStageFinalInteractive(stageFinal);
  }
}

function setTrackingStatus(message, type) {
  const status = document.getElementById("tracking-status");
  if (!status) {
    return;
  }

  status.textContent = `Estado AR: ${message}`;
  status.classList.remove("ok", "warn");
  status.classList.add(type === "ok" ? "ok" : "warn");
}

function updatePreviewButton() {
  const button = document.getElementById("preview-toggle");
  if (!button) {
    return;
  }

  button.classList.toggle("active", previewEnabled);
  button.setAttribute("aria-pressed", previewEnabled ? "true" : "false");
  button.textContent = previewEnabled
    ? "Desactivar vista previa PC (usar marcador)"
    : "Activar vista previa PC (sin marcador)";
}

function moveSceneTo(parent) {
  if (!sceneRootEl || !parent || sceneRootEl.parentElement === parent) {
    return;
  }

  parent.appendChild(sceneRootEl);
}

function scheduleNoMarkerHint() {
  window.clearTimeout(noMarkerTimeoutId);
  noMarkerTimeoutId = window.setTimeout(() => {
    if (!previewEnabled) {
      setTrackingStatus("camara activa, pero falta detectar marcador HIRO", "warn");
    }
  }, 8000);
}

function enablePreviewMode() {
  if (!markerEl || !previewRootEl || !sceneRootEl) {
    return;
  }

  previewEnabled = true;
  window.clearTimeout(noMarkerTimeoutId);
  moveSceneTo(previewRootEl);
  previewRootEl.setAttribute("visible", true);
  markerEl.setAttribute("visible", false);
  updatePreviewButton();
  setTrackingStatus("vista previa activa: mostrando escena sin marcador", "ok");
}

function disablePreviewMode() {
  if (!markerEl || !previewRootEl || !sceneRootEl) {
    return;
  }

  previewEnabled = false;
  moveSceneTo(markerEl);
  previewRootEl.setAttribute("visible", false);
  markerEl.setAttribute("visible", true);
  updatePreviewButton();
  setTrackingStatus("buscando marcador HIRO...", "warn");
  scheduleNoMarkerHint();
}

function togglePreviewMode() {
  if (previewEnabled) {
    disablePreviewMode();
    return;
  }

  enablePreviewMode();
}

function setSummaryPanelCollapsed(collapsed) {
  const panel = document.getElementById("summary-panel");
  const content = document.getElementById("panel-content");
  const toggleBtn = document.getElementById("panel-toggle");

  if (!panel || !content || !toggleBtn) {
    return;
  }

  summaryPanelCollapsed = Boolean(collapsed);
  panel.classList.toggle("collapsed", summaryPanelCollapsed);
  content.hidden = summaryPanelCollapsed;
  toggleBtn.setAttribute("aria-expanded", summaryPanelCollapsed ? "false" : "true");
  toggleBtn.textContent = summaryPanelCollapsed ? "Expandir texto" : "Contraer texto";
}

function initSummaryPanelToggle() {
  const toggleBtn = document.getElementById("panel-toggle");
  if (!toggleBtn) {
    return;
  }

  const isSmallViewport = () => window.innerWidth <= 900;

  setSummaryPanelCollapsed(isSmallViewport());

  toggleBtn.addEventListener("click", () => {
    summaryPanelManuallyToggled = true;
    setSummaryPanelCollapsed(!summaryPanelCollapsed);
  });

  window.addEventListener("resize", () => {
    if (!summaryPanelManuallyToggled) {
      setSummaryPanelCollapsed(isSmallViewport());
    }
  });
}

function setStage(stageKey) {
  if (!STAGE_CONTENT[stageKey]) {
    return;
  }

  document.querySelectorAll(".stage-btn").forEach((btn) => {
    const isActive = btn.dataset.stage === stageKey;
    btn.classList.toggle("active", isActive);
  });

  document.querySelectorAll(".stage-group").forEach((group) => {
    group.setAttribute("visible", group.id === `stage-${stageKey}`);
  });

  const content = STAGE_CONTENT[stageKey];
  document.getElementById("panel-title").textContent = content.title;
  document.getElementById("panel-text").textContent = content.text;

  const pointsEl = document.getElementById("panel-points");
  if (pointsEl) {
    pointsEl.innerHTML = "";
    content.points.forEach((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      pointsEl.appendChild(item);
    });
  }

  const cards = content.cards || [];
  const safeCards = [cards[0], cards[1], cards[2]].map((card) => card || { label: "", value: "" });

  document.getElementById("kpi-label-1").textContent = safeCards[0].label;
  document.getElementById("kpi-1").textContent = safeCards[0].value;
  document.getElementById("kpi-label-2").textContent = safeCards[1].label;
  document.getElementById("kpi-2").textContent = safeCards[1].value;
  document.getElementById("kpi-label-3").textContent = safeCards[2].label;
  document.getElementById("kpi-3").textContent = safeCards[2].value;
}

function init() {
  if (!ENGINE_READY) {
    setTrackingStatus("no cargo A-Frame/AR.js. Revisa internet y bloqueador del navegador", "warn");
    return;
  }

  markerEl = document.getElementById("hiro-marker");
  sceneRootEl = document.getElementById("escena-raiz");
  previewRootEl = document.getElementById("preview-root");

  rebuildARStages();
  initSummaryPanelToggle();

  document.querySelectorAll(".stage-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setStage(btn.dataset.stage);
    });
  });

  const previewToggle = document.getElementById("preview-toggle");
  if (previewToggle) {
    previewToggle.addEventListener("click", togglePreviewMode);
  }

  const scene = document.querySelector("a-scene");
  if (scene) {
    setupManualToggleRaycast(scene);

    scene.addEventListener("loaded", () => {
      if (!previewEnabled) {
        setTrackingStatus("escena AR lista, esperando acceso a camara...", "warn");
      }
    });

    scene.addEventListener("camera-init", () => {
      if (!previewEnabled) {
        setTrackingStatus("camara activa, apunta al marcador HIRO", "ok");
        scheduleNoMarkerHint();
      }
    });

    scene.addEventListener("camera-error", () => {
      setTrackingStatus("error de camara. Revisa permisos del navegador", "warn");
    });
  }

  if (markerEl) {
    markerEl.addEventListener("markerFound", () => {
      if (!previewEnabled) {
        window.clearTimeout(noMarkerTimeoutId);
        setTrackingStatus("marcador detectado", "ok");
      }
    });

    markerEl.addEventListener("markerLost", () => {
      if (!previewEnabled) {
        setTrackingStatus("marcador no detectado", "warn");
        scheduleNoMarkerHint();
      }
    });
  }

  setStage("tarea1");

  const query = new URLSearchParams(window.location.search);
  if (query.get("preview") === "1") {
    enablePreviewMode();
  } else {
    updatePreviewButton();
    setTrackingStatus("buscando marcador HIRO...", "warn");
    scheduleNoMarkerHint();
  }
}

window.addEventListener("DOMContentLoaded", init);