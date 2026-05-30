'use client';

import { useEffect, useRef } from 'react';

/** Full-viewport pixel matrix — same effect as public/index.html */
export function SitePixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reduceMotion) return;

    const canvas = el;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const palette = ['#c8ff00', '#e4ff1a', '#00f0ff', '#ff0044', '#cc00ff', '#ff9900', '#f5ffe8', '#c8ff00'];
    let strips: Strip[] = [];
    const cell = 6;
    let frame = 0;
    let raf = 0;

    type Cell = {
      on: boolean;
      bright: number;
      phase: 'idle' | 'rising' | 'falling';
      riseSpeed: number;
      fallSpeed: number;
    };

    type Strip = {
      y: number;
      h: number;
      color: string;
      drift: number;
      speed: number;
      scramble: number;
      matrix: Cell[][];
    };

    function makeCell(): Cell {
      return {
        on: Math.random() > 0.5,
        bright: 0,
        phase: 'idle',
        riseSpeed: 0.012 + Math.random() * 0.035,
        fallSpeed: 0.008 + Math.random() * 0.022,
      };
    }

    function seedMatrix(strip: Strip) {
      const cols = Math.ceil(canvas.width / cell);
      const rows = Math.ceil(strip.h / cell);
      strip.matrix = [];
      for (let r = 0; r < rows; r++) {
        const row: Cell[] = [];
        for (let c = 0; c < cols; c++) row.push(makeCell());
        strip.matrix.push(row);
      }
    }

    function buildStrips() {
      strips = [];
      const h = canvas.height;
      const count = Math.max(14, Math.floor(h / 28));
      const sh = Math.ceil(h / count);
      for (let i = 0; i < count; i++) {
        const strip: Strip = {
          y: i * sh,
          h: sh,
          color: palette[i % palette.length]!,
          drift: 0,
          speed: 0.3 + Math.random() * 1.2,
          scramble: Math.random() > 0.5 ? 1 : -1,
          matrix: [],
        };
        seedMatrix(strip);
        strips.push(strip);
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, finePointer ? 1.25 : 1);
      const scale = finePointer ? 0.5 : 0.42;
      canvas.width = Math.floor(window.innerWidth * dpr * scale);
      canvas.height = Math.floor(window.innerHeight * dpr * scale);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      buildStrips();
    }

    function tickCellBrightness(cell: Cell) {
      if (!cell.on) return;
      if (cell.phase === 'idle') {
        if (Math.random() > 0.9935) {
          cell.phase = 'rising';
          cell.bright = 0.08;
        }
        return;
      }
      if (cell.phase === 'rising') {
        cell.bright += cell.riseSpeed;
        if (cell.bright >= 1) {
          cell.bright = 1;
          cell.phase = 'falling';
        }
        return;
      }
      if (cell.phase === 'falling') {
        cell.bright -= cell.fallSpeed;
        if (cell.bright <= 0) {
          cell.bright = 0;
          cell.phase = 'idle';
        }
      }
    }

    function lum(r: number, g: number, b: number) {
      return r * 0.299 + g * 0.587 + b * 0.114;
    }

    function hexToRgb(hex: string) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
    }

    function sortStripRow(data: Uint8ClampedArray, w: number, y: number, dir: number) {
      const row: { r: number; g: number; b: number; a: number; x: number }[] = [];
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        row.push({ r: data[idx]!, g: data[idx + 1]!, b: data[idx + 2]!, a: data[idx + 3]!, x });
      }
      row.sort((a, b) => (dir > 0 ? lum(a.r, a.g, a.b) - lum(b.r, b.g, b.b) : lum(b.r, b.g, b.b) - lum(a.r, a.g, a.b)));
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        data[idx] = row[x]!.r;
        data[idx + 1] = row[x]!.g;
        data[idx + 2] = row[x]!.b;
        data[idx + 3] = row[x]!.a;
      }
    }

    function render() {
      const w = canvas.width;
      const h = canvas.height;
      frame++;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      for (let si = 0; si < strips.length; si++) {
        const s = strips[si]!;
        const rgb = hexToRgb(s.color);
        const rows = s.matrix.length;
        const cols = rows ? s.matrix[0]!.length : 0;
        s.drift += s.speed * s.scramble;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellData = s.matrix[r]![c]!;
            if (!cellData.on) continue;

            tickCellBrightness(cellData);
            const br = cellData.bright;

            let px = Math.floor(c * cell + s.drift) % (w + cell);
            if (px < 0) px += w;
            const py = s.y + r * cell;

            const alpha = 0.14 + br * 0.92;
            const sharpen = br * br * br;
            const rr = Math.min(255, rgb[0] + sharpen * 200);
            const gg = Math.min(255, rgb[1] + sharpen * 200);
            const bb = Math.min(255, rgb[2] + sharpen * 185);
            const size = br > 0.45 ? cell : Math.max(2, cell - 1);

            ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
            ctx.fillRect(px, py, size, size);

            if (br > 0.58) {
              ctx.fillStyle = `rgba(255,255,255,${0.12 + br * 0.42})`;
              ctx.fillRect(px, py, Math.max(2, size - 1), Math.max(2, size - 1));
            }
            if (br > 0.88) {
              ctx.fillStyle = `rgba(200,255,0,${br * 0.35})`;
              ctx.fillRect(px, py, size, size);
            }
          }
        }

        if (frame % 8 === si % 8) {
          const band = ctx.getImageData(0, s.y, w, Math.min(s.h, h - s.y));
          const data = band.data;
          for (let yy = 0; yy < Math.min(s.h, h - s.y); yy += cell * 2) {
            if (Math.random() > 0.4) sortStripRow(data, w, yy, s.scramble);
          }
          ctx.putImageData(band, Math.floor(s.drift * 0.3) % 12, s.y);
        }

        if (Math.random() > 0.992) seedMatrix(s);
      }

      raf = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="site-page__canvas" aria-hidden />;
}
