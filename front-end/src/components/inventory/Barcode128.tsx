"use client";

import React from "react";

interface Barcode128Props {
  value: string;
  width?: number; // module width (thin bar width) in pixels, e.g., 2
  height?: number; // height of the barcode bars in pixels, e.g., 50
  showValue?: boolean;
  className?: string;
}

// Width patterns for Code 128 (0 to 106)
// Each digit represents the width of a bar/space in modules (1 to 4)
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (103: Start A, 104: Start B, 105: Start C, 106: Stop)
];

export default function Barcode128({
  value = "",
  width = 2,
  height = 50,
  showValue = true,
  className = "",
}: Barcode128Props) {
  // We will encode using Code 128 - Code Set B
  // Start character B is symbol 104
  const startCode = 104;
  const stopCode = 106;

  // Filter input to printables
  const cleanValue = value.replace(/[^\x20-\x7E]/g, "");
  if (!cleanValue) {
    return <div className="text-xs text-red-500 font-mono">Invalid barcode input</div>;
  }

  // Calculate Checksum: Start code index (104) + sum of (character_index * character_position)
  let checksum = startCode;
  const symbolIndices: number[] = [startCode];

  for (let i = 0; i < cleanValue.length; i++) {
    const charCode = cleanValue.charCodeAt(i);
    const charIndex = charCode - 32; // Map standard ASCII printable (32 to 126) to 0 to 94
    symbolIndices.push(charIndex);
    checksum += charIndex * (i + 1);
  }

  const checksumIndex = checksum % 103;
  symbolIndices.push(checksumIndex);
  symbolIndices.push(stopCode);

  // Generate bar sequences (list of objects representing bars)
  let totalModules = 0;
  const bars: Array<{ x: number; w: number; isBar: boolean }> = [];

  symbolIndices.forEach((symIdx) => {
    const pattern = PATTERNS[symIdx];
    for (let p = 0; p < pattern.length; p++) {
      const moduleWidth = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0; // Alternates bar, space, bar, space...
      bars.push({
        x: totalModules,
        w: moduleWidth,
        isBar,
      });
      totalModules += moduleWidth;
    }
  });

  const svgWidth = totalModules * width;
  const svgHeight = height + (showValue ? 20 : 0);

  return (
    <div className={`flex flex-col items-center justify-center select-none w-full h-full ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMidMeet"
        className="w-full h-full"
      >
        {/* Draw Bars */}
        <g fill="black">
          {bars.map((bar, idx) => {
            if (!bar.isBar) return null;
            return (
              <rect
                key={idx}
                x={bar.x * width}
                y={0}
                width={bar.w * width}
                height={height}
              />
            );
          })}
        </g>
        {/* Draw Value Label */}
        {showValue && (
          <text
            x={svgWidth / 2}
            y={height + 15}
            textAnchor="middle"
            fill="black"
            className="font-mono text-[11px] font-semibold tracking-[0.15em]"
          >
            {cleanValue}
          </text>
        )}
      </svg>
    </div>
  );
}
