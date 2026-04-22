import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type FrameEntry = Array<number | string>;

type DynamicNodeInfo = {
  id: number;
  x: number;
  y: number;
  fill: string;
  char: string;
};

type StaticGlyph = {
  x: number;
  y: number;
  fill: string;
  char: string;
};

const DEFAULT_SOURCE = "components/fabric-logo-ascii-animated.tsx";
const DEFAULT_OUT_DIR = "tmp/fabric-frames";
const EXPECTED_NODE_COUNT = 1536;

function isForegroundChar(char: string) {
  return "@$%*x+=o~".includes(char);
}

function toFrameIndex(frameNumber: number) {
  return String(frameNumber).padStart(3, "0");
}

function splitRows(frameText: string) {
  return frameText.split("\n");
}

function extractFrameData(source: string): FrameEntry[] {
  const frameDataMatch = source.match(
    /const frameData\s*=\s*(\[[\s\S]*?\]);\s*(?:const|function|export)\s+/,
  );

  if (!frameDataMatch) {
    throw new Error("Could not locate `frameData` in source file.");
  }

  const parsed = Function(`"use strict"; return (${frameDataMatch[1]});`)();

  if (!Array.isArray(parsed)) {
    throw new Error("Parsed `frameData` is not an array.");
  }

  return parsed as FrameEntry[];
}

function extractDynamicNodeInfos(source: string): DynamicNodeInfo[] {
  const regex =
    /<text id="c(\d+)" x="([0-9.]+)" y="([0-9.]+)" fill="([^"]+)">\s*([\s\S]*?)\s*<\/text>/g;

  const nodes: DynamicNodeInfo[] = [];

  for (const match of source.matchAll(regex)) {
    const id = Number(match[1]);
    const x = Number(match[2]);
    const y = Number(match[3]);
    const fill = match[4];
    const char = match[5].replaceAll("\n", "").trim() || " ";

    nodes.push({ id, x, y, fill, char });
  }

  if (nodes.length === 0) {
    throw new Error("Could not find any `<text id=\"c...\">` nodes.");
  }

  return nodes.sort((a, b) => a.id - b.id);
}

function extractStaticGlyphs(source: string): StaticGlyph[] {
  const regex = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  const glyphs: StaticGlyph[] = [];

  for (const match of source.matchAll(regex)) {
    const attrs = match[1];
    const rawContent = match[2];

    if (/id="c\d+"/.test(attrs)) {
      continue;
    }

    const xMatch = attrs.match(/\bx="([^"]+)"/);
    const yMatch = attrs.match(/\by="([^"]+)"/);
    const fillMatch = attrs.match(/\bfill="([^"]+)"/);

    if (!xMatch || !yMatch || !fillMatch) {
      continue;
    }

    const xs = xMatch[1]
      .trim()
      .split(/\s+/)
      .map((n) => Number(n));
    const ys = yMatch[1]
      .trim()
      .split(/\s+/)
      .map((n) => Number(n));
    const chars = Array.from(rawContent.replaceAll("\n", "").trim());

    const count = Math.min(xs.length, ys.length, chars.length);

    for (let i = 0; i < count; i++) {
      const char = chars[i];

      glyphs.push({
        x: xs[i],
        y: ys[i],
        fill: fillMatch[1],
        char: char === "." ? "·" : char,
      });
    }
  }

  return glyphs;
}

function renderLayer(params: {
  width: number;
  height: number;
  idByCell: Array<Array<number | undefined>>;
  staticByCell: Array<Array<{ char: string; foreground: boolean } | undefined>>;
  chars: string[];
  foregroundMask: boolean[];
  mode: "all" | "foreground" | "background";
}) {
  const { width, height, idByCell, staticByCell, chars, foregroundMask, mode } = params;
  const rows: string[] = [];

  for (let r = 0; r < height; r++) {
    let row = "";

    for (let c = 0; c < width; c++) {
      const id = idByCell[r][c];

      let char = " ";
      let isFg = false;

      if (id !== undefined) {
        char = chars[id] ?? " ";
        isFg = foregroundMask[id] ?? false;
      } else {
        const staticGlyph = staticByCell[r][c];
        if (staticGlyph) {
          char = staticGlyph.char;
          isFg = staticGlyph.foreground;
        }
      }

      if (mode === "all") {
        row += char;
      } else if (mode === "foreground") {
        row += isFg ? char : " ";
      } else {
        row += !isFg && char !== " " ? char : " ";
      }
    }

    rows.push(row.padEnd(width, " "));
  }

  return rows.join("\n");
}

function main() {
  const inputArg = process.argv[2];
  const outDirArg = process.argv[3];

  const sourcePath = path.resolve(process.cwd(), inputArg ?? DEFAULT_SOURCE);
  const outDir = path.resolve(process.cwd(), outDirArg ?? DEFAULT_OUT_DIR);
  const source = readFileSync(sourcePath, "utf8");

  const frameData = extractFrameData(source);
  const nodes = extractDynamicNodeInfos(source);
  const staticGlyphs = extractStaticGlyphs(source);

  const maxId = Math.max(...nodes.map((n) => n.id));

  if (maxId + 1 < EXPECTED_NODE_COUNT) {
    console.warn(
      `Warning: detected ${maxId + 1} indexed nodes, expected around ${EXPECTED_NODE_COUNT}.`,
    );
  }

  const uniqueX = Array.from(
    new Set([...nodes.map((n) => n.x), ...staticGlyphs.map((g) => g.x)]),
  ).sort((a, b) => a - b);
  const uniqueY = Array.from(
    new Set([...nodes.map((n) => n.y), ...staticGlyphs.map((g) => g.y)]),
  ).sort((a, b) => a - b);

  const xToCol = new Map(uniqueX.map((x, idx) => [x, idx]));
  const yToRow = new Map(uniqueY.map((y, idx) => [y, idx]));

  const width = uniqueX.length;
  const height = uniqueY.length;
  const idByCell: Array<Array<number | undefined>> = Array.from({ length: height }, () =>
    Array<number | undefined>(width).fill(undefined),
  );
  const staticByCell: Array<Array<{ char: string; foreground: boolean } | undefined>> =
    Array.from({ length: height }, () =>
      Array<{ char: string; foreground: boolean } | undefined>(width).fill(undefined),
    );

  for (const node of nodes) {
    const row = yToRow.get(node.y);
    const col = xToCol.get(node.x);

    if (row === undefined || col === undefined) {
      continue;
    }

    idByCell[row][col] = node.id;
  }

  for (const glyph of staticGlyphs) {
    const row = yToRow.get(glyph.y);
    const col = xToCol.get(glyph.x);

    if (row === undefined || col === undefined) {
      continue;
    }

    staticByCell[row][col] = {
      char: glyph.char,
      foreground: glyph.fill === "#000",
    };
  }

  const nodeCount = maxId + 1;
  const chars = Array<string>(nodeCount).fill(" ");
  const foregroundMask = Array<boolean>(nodeCount).fill(false);

  for (const node of nodes) {
    chars[node.id] = node.char;
    foregroundMask[node.id] = node.fill === "#000";
  }

  const allFrames: string[] = [];
  const fgFrames: string[] = [];
  const bgFrames: string[] = [];
  const allFramesRows: string[][] = [];
  const fgFramesRows: string[][] = [];
  const bgFramesRows: string[][] = [];

  for (let frameNumber = 0; frameNumber < frameData.length; frameNumber++) {
    const frame = frameData[frameNumber];

    for (let i = 0; i < frame.length; i += 2) {
      const id = Number(frame[i]);
      const token = String(frame[i + 1]);

      if (token === " ") {
        chars[id] = " ";
      } else if (token === ".") {
        chars[id] = "·";
        foregroundMask[id] = false;
      } else {
        chars[id] = token;
        foregroundMask[id] = isForegroundChar(token);
      }
    }

    const label = toFrameIndex(frameNumber);
    const allLayer = renderLayer({
      width,
      height,
      idByCell,
      staticByCell,
      chars,
      foregroundMask,
      mode: "all",
    });
    const fgLayer = renderLayer({
      width,
      height,
      idByCell,
      staticByCell,
      chars,
      foregroundMask,
      mode: "foreground",
    });
    const bgLayer = renderLayer({
      width,
      height,
      idByCell,
      staticByCell,
      chars,
      foregroundMask,
      mode: "background",
    });

    allFrames.push(`=== FRAME ${label} ===\n${allLayer}`);
    fgFrames.push(`=== FRAME ${label} ===\n${fgLayer}`);
    bgFrames.push(`=== FRAME ${label} ===\n${bgLayer}`);

    allFramesRows.push(splitRows(allLayer));
    fgFramesRows.push(splitRows(fgLayer));
    bgFramesRows.push(splitRows(bgLayer));
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "frames-all.txt"), allFrames.join("\n\n"), "utf8");
  writeFileSync(path.join(outDir, "frames-foreground.txt"), fgFrames.join("\n\n"), "utf8");
  writeFileSync(path.join(outDir, "frames-background.txt"), bgFrames.join("\n\n"), "utf8");
  writeFileSync(
    path.join(outDir, "frames-all.json"),
    JSON.stringify(allFramesRows, null, 2),
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "frames-foreground.json"),
    JSON.stringify(fgFramesRows, null, 2),
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "frames-background.json"),
    JSON.stringify(bgFramesRows, null, 2),
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "frames-layers.json"),
    JSON.stringify(
      {
        width,
        height,
        frameCount: frameData.length,
        layers: {
          all: allFramesRows,
          foreground: fgFramesRows,
          background: bgFramesRows,
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "metadata.json"),
    JSON.stringify(
      {
        sourcePath,
        frameCount: frameData.length,
        nodeCount,
        staticGlyphCount: staticGlyphs.length,
        width,
        height,
        outputFiles: [
          "frames-all.txt",
          "frames-foreground.txt",
          "frames-background.txt",
          "frames-all.json",
          "frames-foreground.json",
          "frames-background.json",
          "frames-layers.json",
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Wrote ${frameData.length} frames to: ${outDir}`);
  console.log(`Grid size: ${width} x ${height}`);
}

main();
