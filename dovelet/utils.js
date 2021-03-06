function roundUsing(num, func, prec) {
  let temp = num * Math.pow(10, prec);
  temp = func(temp);
  return temp / Math.pow(10, prec);
}

function hexToRGB(hex, alpha) {
  if (!hex) return;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (isNumeric(alpha)) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function getPosition(e, ratio = 1) {
  const { left, top } = e.target.getBoundingClientRect();

  if (e.type === "touchmove" || e.type === "touchstart") {
    return {
      x: (e.touches[0].pageX - left) * ratio,
      y: (e.touches[0].pageY - window.pageYOffset) * ratio,
    };
  } else if (e.type === "touchend") {
    return {
      x: e.changedTouches[e.changedTouches.length - 1].pageX * ratio,
      y: e.changedTouches[e.changedTouches.length - 1].pageY * ratio,
    };
  } else {
    return { x: (e.clientX - left) * ratio, y: (e.clientY - top) * ratio };
  }
}

function rateLimit(n, min, max) {
  if (n < min) {
    return min;
  } else if (n > max) {
    return max;
  } else {
    return n;
  }
}

function normalizeData(data) {
  const { columns, colors, types, names } = data;

  const normalizedData = [];

  for (let i = 0; i < columns.length; i++) {
    const name = columns[i][0];
    const values = columns[i].slice(1);

    if (name !== "x") {
      const color = colors[name];
      const chart = names[name];

      normalizedData.push({
        type: types[name],
        values,
        name,
        color,
        chart,
      });
    } else {
      const labels = values.map(v => {
        const datetime = new Date(v);
        const date = datetime.getDate();
        const month = datetime.toLocaleString("en-us", {
          month: "short",
        });
        return `${date} ${month}`;
      });

      normalizedData.push({ type: types[name], values, name, labels });
    }
  }

  return normalizedData;
}

function getMaxValueFromTo({ data, from, to } = {}) {
  let max = 0;

  for (let i = 0; i < data.length; i++) {
    const type = data[i].type;
    const values = data[i].values;

    if (type === "line") {
      for (let i = Math.floor(from); i < values.length; i++) {
        max = Math.max(max, values[i]);
        if (Math.ceil(to) === i) {
          break;
        }
      }
    }
  }
  const maxLength = Math.ceil(Math.log10(max + 1));

  return Math.ceil(roundUsing(max, Math.ceil, -maxLength + 2));
}

function getDataMaxLength(data) {
  let max = 0;

  for (let i = 0; i < data.length; i++) {
    max = Math.max(max, data[i].values.length);
  }

  return max;
}

function getLineLength(data, containerWidth, withRemainder = true) {
  const length = getDataMaxLength(data) - 1;

  if (withRemainder) {
    const remainder = containerWidth % length;

    return Math.floor(containerWidth / length) + remainder / length;
  } else {
    return containerWidth / length;
  }
}

function isDotInsideRect(position, rect) {
  const [x, y] = position;

  const [xMin, yMin, xMax, yMax] = rect;

  return xMin <= x && xMax >= x && yMin <= y && yMax >= y;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getAxialShift(lineLength, from) {
  return lineLength * (from - Math.floor(from));
}

function roundRect({ canvas, x, y, w, h, r }) {
  const ctx = canvas.getContext("2d");
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

function easeInQuad(t) {
  return t * t;
}

function linear(t) {
  return t;
}

function numberWithSpaces(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function geometricProgression(n) {
  return 1 * Math.pow(2, Math.ceil(Math.log2(n)));
}

function getScrollbarWidth() {
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = "scroll";

  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  outer.parentNode.removeChild(outer);

  return widthNoScroll - widthWithScroll;
}

function getLabelDivider(width, lineLength) {
  const diff = Math.ceil(width / lineLength);
  return geometricProgression(rateLimit(diff, 1));
}

function isCanvasBlank(canvas) {
  const context = canvas.getContext("2d");

  const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);

  return !pixelBuffer.some(color => color !== 0);
}
