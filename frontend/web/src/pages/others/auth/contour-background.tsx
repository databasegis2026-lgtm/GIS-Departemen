export default function ContourBackground() {
  const contours = [
    // Upper terrain — wide spacing (gentle slope)
    {
      d: "M-40,60 C60,30 180,80 280,45 C380,10 460,55 540,30",
      opacity: 0.07,
      w: 1,
      dur: 35,
      dash: "300 250",
    },
    {
      d: "M-40,120 C80,85 160,130 270,95 C380,60 440,110 540,80",
      opacity: 0.12,
      w: 1.2,
      dur: 28,
      dash: "250 200",
      rev: true,
    },
    {
      d: "M-40,190 C70,160 190,200 300,165 C410,130 460,175 540,150",
      opacity: 0.16,
      w: 1,
      dur: 32,
      dash: "350 200",
    },

    // Mid terrain — tight spacing (ridge crest)
    {
      d: "M-30,270 C90,240 200,280 310,250 C400,225 450,255 540,235",
      opacity: 0.22,
      w: 1.5,
      dur: 24,
      dash: "280 180",
      rev: true,
    },
    {
      d: "M-30,310 C80,285 180,320 300,290 C400,265 460,295 540,275",
      opacity: 0.22,
      w: 1.5,
      dur: 26,
      dash: "320 200",
    },
    {
      d: "M-20,355 C90,330 190,365 310,340 C410,315 455,345 540,325",
      opacity: 0.18,
      w: 1.2,
      dur: 30,
      dash: "260 220",
      rev: true,
    },

    // Lower terrain — wide spacing again
    {
      d: "M-40,440 C80,410 200,450 320,420 C420,395 470,430 540,410",
      opacity: 0.12,
      w: 1,
      dur: 34,
      dash: "340 210",
    },
    {
      d: "M-40,540 C70,510 190,550 310,520 C420,490 460,525 540,505",
      opacity: 0.08,
      w: 1,
      dur: 38,
      dash: "290 230",
      rev: true,
    },
    {
      d: "M-30,630 C80,605 200,640 320,615 C430,590 470,620 540,600",
      opacity: 0.06,
      w: 1,
      dur: 40,
      dash: "310 240",
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 -z-1 overflow-hidden">
      <svg
        className="h-full w-full"
        viewBox="0 0 500 700"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {contours.map((c, i) => (
          <path
            key={i}
            d={c.d}
            stroke="currentColor"
            strokeOpacity={c.opacity}
            strokeWidth={c.w}
            strokeLinecap="round"
            strokeDasharray={c.dash}
            className="text-white"
            style={{
              animation: `contour-flow ${c.dur}s linear infinite${c.rev ? " reverse" : ""}`,
            }}
          />
        ))}

        {/* Elevation marker dot */}
        <circle cx="310" cy="290" r="2" fill="white" fillOpacity="0.25" />
        <text
          x="320"
          y="286"
          fill="white"
          fillOpacity="0.2"
          fontSize="9"
          fontFamily="monospace"
        >
          ▲ 125
        </text>
      </svg>

      {/* Coordinate labels */}
      <div className="absolute bottom-6 left-6 select-none font-mono text-[10px] tracking-wider text-white/15">
        2°31&apos;14&quot;S&ensp;104°15&apos;42&quot;E
      </div>
      <div className="absolute right-6 top-6 select-none font-mono text-[10px] tracking-wider text-white/15">
        TOPO • 1:25.000
      </div>
    </div>
  );
}
