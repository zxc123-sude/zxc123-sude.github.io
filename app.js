/* Browser-only AWB illustration. No upload, analytics, dependencies, or network calls. */
"use strict";

(() => {
  const beforeCanvas = document.querySelector("#before-canvas");
  const afterCanvas = document.querySelector("#after-canvas");
  const beforeContext = beforeCanvas.getContext("2d", { willReadFrequently: true });
  const afterContext = afterCanvas.getContext("2d");
  const range = document.querySelector("#comparison-range");
  const afterLayer = document.querySelector("#after-layer");
  const divider = document.querySelector("#comparison-divider");
  const gainOutput = document.querySelector("#gain-output");
  const status = document.querySelector("#demo-status");
  const sceneSelect = document.querySelector("#scene-select");
  const fileInput = document.querySelector("#image-upload");
  const resetButton = document.querySelector("#reset-demo");
  const note = document.querySelector("#canvas-note");
  const correctedLabel = document.querySelector(".corrected-label");
  const MAX_EDGE = 1280;
  const MAX_BYTES = 25 * 1024 * 1024;
  let sourcePixels;
  let linearPixels;
  let uploadGeneration = 0;
  let imageSource = "synthetic";
  let uploadDimensions = "";

  const decode = (value) => value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  const encode = (value) => {
    const clipped = Math.max(0, Math.min(1, value));
    return 255 * (clipped <= 0.0031308 ? clipped * 12.92 : 1.055 * Math.pow(clipped, 1 / 2.4) - 0.055);
  };
  const decodeLut = Float32Array.from({ length: 256 }, (_, index) => decode(index / 255));
  const sceneSettings = {
    warm: { cast: [1.42, 1.0, 0.65], label: "暖光色偏" },
    cool: { cast: [0.73, 1.0, 1.35], label: "冷光色偏" },
    green: { cast: [0.83, 1.21, 0.89], label: "偏绿色光" },
  };

  function roundedRect(context, x, y, width, height, radius, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  function shadow(context, x, y, radiusX, radiusY, opacity = 0.14) {
    context.save();
    context.translate(x, y);
    context.scale(1, radiusY / radiusX);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, `rgba(45, 53, 41, ${opacity})`);
    gradient.addColorStop(1, "rgba(45, 53, 41, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radiusX, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function sphere(context, x, y, radius, lightColor, middleColor, darkColor) {
    const gradient = context.createRadialGradient(x - radius * 0.4, y - radius * 0.5, radius * 0.08, x, y, radius * 1.08);
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.55, middleColor);
    gradient.addColorStop(1, darkColor);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function polygon(context, points, fill) {
    context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
    context.fillStyle = fill;
    context.fill();
  }

  function drawSyntheticScene() {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 720;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    // This neutral studio still life is entirely generated; it is not a test dataset.
    const backdrop = context.createLinearGradient(0, 0, 960, 720);
    backdrop.addColorStop(0, "#e3e6df");
    backdrop.addColorStop(0.65, "#d1d9ce");
    backdrop.addColorStop(1, "#c0cbbc");
    context.fillStyle = backdrop;
    context.fillRect(0, 0, 960, 720);
    context.strokeStyle = "rgba(255,255,255,.14)";
    context.lineWidth = 1;
    for (let x = 25; x < 960; x += 48) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 720); context.stroke(); }
    for (let y = 20; y < 720; y += 48) { context.beginPath(); context.moveTo(0, y); context.lineTo(960, y); context.stroke(); }

    context.fillStyle = "#738574";
    context.font = "13px monospace";
    context.fillText("STUDY 001 / LIGHT & COLOR", 52, 80);
    context.font = "10px monospace";
    context.fillText("PROCEDURAL STILL LIFE", 52, 103);
    context.strokeStyle = "#9dad9d";
    context.beginPath(); context.moveTo(52, 121); context.lineTo(265, 121); context.stroke();

    shadow(context, 525, 566, 350, 57, 0.19);
    polygon(context, [[123, 452], [630, 386], [859, 487], [333, 597]], "#d8dacf");
    polygon(context, [[123, 452], [333, 545], [859, 440], [859, 487], [333, 597], [123, 499]], "#bac4b7");
    polygon(context, [[123, 452], [630, 351], [859, 440], [333, 545]], "#eef0e6");
    polygon(context, [[333, 545], [859, 440], [859, 487], [333, 597]], "#c7cfc1");

    // A blue cube provides a saturated object; flat colored scenes break gray-world assumptions.
    shadow(context, 653, 444, 126, 28, 0.17);
    polygon(context, [[575, 288], [700, 262], [783, 300], [656, 330]], "#8bacc7");
    polygon(context, [[575, 288], [656, 330], [656, 462], [575, 416]], "#5d8eae");
    polygon(context, [[656, 330], [783, 300], [783, 430], [656, 462]], "#3c6e91");

    // A ceramic cylinder, a matte sphere, a warm small sphere, and neutral swatches.
    shadow(context, 401, 406, 110, 28, 0.15);
    const cylinder = context.createLinearGradient(313, 0, 480, 0);
    cylinder.addColorStop(0, "#c5ccbf"); cylinder.addColorStop(0.35, "#f4f3e8"); cylinder.addColorStop(1, "#b7c2b2");
    context.fillStyle = cylinder;
    context.beginPath(); context.moveTo(313, 255); context.lineTo(313, 390); context.bezierCurveTo(313, 427, 480, 427, 480, 390); context.lineTo(480, 255); context.fill();
    context.fillStyle = "#e5e9dc";
    context.beginPath(); context.ellipse(396.5, 255, 83.5, 24, 0, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#d8dece"; context.lineWidth = 1; context.stroke();
    context.fillStyle = "#f2f3e9";
    context.beginPath(); context.ellipse(396.5, 251, 66, 15, 0, 0, Math.PI * 2); context.fill();

    shadow(context, 522, 480, 113, 30, 0.21);
    sphere(context, 510, 383, 92, "#f4f5ec", "#d4ddce", "#8ea18e");
    shadow(context, 283, 478, 99, 27, 0.17);
    sphere(context, 263, 421, 66, "#e5ac8e", "#c87762", "#874f45");

    const tileX = 391;
    const tileY = 550;
    context.save(); context.translate(tileX, tileY); context.rotate(-0.095);
    shadow(context, 112, 39, 156, 27, 0.14);
    roundedRect(context, -8, -8, 294, 98, 3, "#e9e9dd");
    const swatches = ["#babdaa", "#c99e56", "#9caa7d", "#779ca1", "#a57e80", "#d6d7c9"];
    swatches.forEach((color, index) => roundedRect(context, index * 46, 0, 39, 51, 1, color));
    context.fillStyle = "#8c9683"; context.font = "8px monospace";
    context.fillText("COLOR STUDY / SYNTHETIC REFERENCE", 0, 73);
    context.restore();

    // Neutral grayscale chips illustrate the role of neutral content in a scene.
    ["#efefe8", "#bcbeb5", "#777c73", "#3c443e"].forEach((color, index) => {
      roundedRect(context, 52 + index * 37, 615, 29, 29, 1, color);
    });
    context.fillStyle = "#72836e"; context.font = "10px monospace";
    context.fillText("SYNTHETIC SCENE / NOT A BENCHMARK", 52, 669);
    context.textAlign = "right"; context.fillText("AWB—LAB", 907, 669);

    const pixels = context.getImageData(0, 0, 960, 720);
    const cast = sceneSettings[sceneSelect.value].cast;
    for (let index = 0; index < pixels.data.length; index += 4) {
      for (let channel = 0; channel < 3; channel += 1) {
        pixels.data[index + channel] = encode(decodeLut[pixels.data[index + channel]] * cast[channel]);
      }
    }
    return pixels;
  }

  function setSource(pixels) {
    sourcePixels = pixels;
    beforeCanvas.width = afterCanvas.width = pixels.width;
    beforeCanvas.height = afterCanvas.height = pixels.height;
    beforeContext.putImageData(pixels, 0, 0);
    linearPixels = new Float32Array(pixels.width * pixels.height * 3);
    for (let sourceIndex = 0, targetIndex = 0; sourceIndex < pixels.data.length; sourceIndex += 4) {
      linearPixels[targetIndex++] = decodeLut[pixels.data[sourceIndex]];
      linearPixels[targetIndex++] = decodeLut[pixels.data[sourceIndex + 1]];
      linearPixels[targetIndex++] = decodeLut[pixels.data[sourceIndex + 2]];
    }
    applyWhiteBalance();
  }

  function estimateGains(algorithm) {
    const statistics = [0, 0, 0];
    const power = algorithm === "shades-of-gray" ? 6 : 1;
    let validCount = 0;
    for (let index = 0, sourceIndex = 0; index < linearPixels.length; index += 3, sourceIndex += 4) {
      const red = sourcePixels.data[sourceIndex];
      const green = sourcePixels.data[sourceIndex + 1];
      const blue = sourcePixels.data[sourceIndex + 2];
      // Exclude clipped pixels and near-black values from illuminant estimation.
      if (red === 255 || green === 255 || blue === 255 || Math.max(red, green, blue) < 5) continue;
      validCount += 1;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = linearPixels[index + channel];
        if (algorithm === "max-rgb") statistics[channel] = Math.max(statistics[channel], value);
        else statistics[channel] += power === 1 ? value : Math.pow(value, power);
      }
    }
    if (validCount === 0) return { gains: null, validCount };
    if (algorithm !== "max-rgb") {
      for (let channel = 0; channel < 3; channel += 1) statistics[channel] = Math.pow(statistics[channel] / validCount, 1 / power);
    }
    // A missing color channel has no recoverable signal; do not claim a valid correction.
    if (statistics.some((value) => !Number.isFinite(value) || value <= 1e-6)) return { gains: null, validCount };
    const gains = statistics.map((value, channel) => channel === 1 ? 1 : statistics[1] / value);
    return { gains, validCount };
  }

  function applyWhiteBalance() {
    const algorithm = document.querySelector('input[name="algorithm"]:checked').value;
    const { gains, validCount } = estimateGains(algorithm);
    if (!gains) {
      afterContext.putImageData(sourcePixels, 0, 0);
      gainOutput.textContent = "R —   G —   B —";
      correctedLabel.textContent = "原图 · 未校正";
      afterCanvas.setAttribute("aria-label", "有效颜色信息不足，显示未经校正的原图");
      status.classList.add("error");
      status.textContent = `有效颜色信息不足，无法估计；保留原图。有效像素 ${validCount.toLocaleString()}。`;
      return;
    }
    const result = afterContext.createImageData(sourcePixels.width, sourcePixels.height);
    for (let outputIndex = 0, linearIndex = 0; outputIndex < result.data.length; outputIndex += 4) {
      result.data[outputIndex] = encode(linearPixels[linearIndex++] * gains[0]);
      result.data[outputIndex + 1] = encode(linearPixels[linearIndex++] * gains[1]);
      result.data[outputIndex + 2] = encode(linearPixels[linearIndex++] * gains[2]);
      result.data[outputIndex + 3] = 255;
    }
    afterContext.putImageData(result, 0, 0);
    correctedLabel.textContent = "校正后";
    afterCanvas.setAttribute("aria-label", "自动白平衡校正后的图像");
    const channelLabels = ["R", "G", "B"];
    const dotClasses = ["red-dot", "green-dot", "blue-dot-small"];
    gainOutput.replaceChildren(...gains.map((gain, index) => {
      const span = document.createElement("span");
      const dot = document.createElement("i");
      dot.className = dotClasses[index];
      const number = document.createElement("b");
      number.textContent = gain.toFixed(3);
      span.append(dot, ` ${channelLabels[index]} `, number);
      return span;
    }));
    status.classList.remove("error");
    status.textContent = imageSource === "synthetic"
      ? `合成演示，非数据集评测。有效像素 ${validCount.toLocaleString()}（排除饱和与近黑）。`
      : `本地图片 · ${uploadDimensions}。有效像素 ${validCount.toLocaleString()}（非 RAW 评测）。`;
  }

  function updateComparison() {
    const percentage = Number(range.value);
    afterLayer.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    divider.style.left = `${percentage}%`;
    range.setAttribute("aria-valuetext", `左侧 ${percentage}% 为校正前，右侧 ${100 - percentage}% 为校正后`);
  }

  function useSyntheticScene() {
    uploadGeneration += 1;
    imageSource = "synthetic";
    resetButton.hidden = true;
    fileInput.value = "";
    note.textContent = `合成演示 · ${sceneSettings[sceneSelect.value].label}`;
    beforeCanvas.setAttribute("aria-label", "带有色偏的合成场景");
    setSource(drawSyntheticScene());
  }

  function showError(message) {
    status.textContent = message;
    status.classList.add("error");
    fileInput.value = "";
  }

  async function loadLocalFile() {
    const file = fileInput.files[0];
    if (!file) return;
    const generation = ++uploadGeneration;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showError("请选择 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > MAX_BYTES) {
      showError("图片超过 25 MB，请选择体积更小的图片。");
      return;
    }
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("decode"));
        image.src = objectUrl;
      });
      if (generation !== uploadGeneration) return;
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("dimensions");
      const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      imageSource = "upload";
      uploadDimensions = `${width} × ${height}${scale < 1 ? "（已缩小）" : ""}`;
      resetButton.hidden = false;
      note.textContent = "本地图片 · 未上传";
      beforeCanvas.setAttribute("aria-label", "你选择的本地图片，校正前");
      setSource(context.getImageData(0, 0, width, height));
    } catch {
      if (generation === uploadGeneration) showError("图片无法读取，请换一张 JPG、PNG 或 WebP 图片。");
    } finally {
      URL.revokeObjectURL(objectUrl);
      fileInput.value = "";
    }
  }

  range.addEventListener("input", updateComparison);
  document.querySelectorAll('input[name="algorithm"]').forEach((input) => input.addEventListener("change", applyWhiteBalance));
  sceneSelect.addEventListener("change", useSyntheticScene);
  resetButton.addEventListener("click", useSyntheticScene);
  fileInput.addEventListener("change", loadLocalFile);
  updateComparison();
  useSyntheticScene();
})();
