const antennaModels = [
  "Dipole 40m",
  "Dipole 80m",
  "Dipole 20m",
  "Dipole 10m",
  "End-Fed Half Wave (EFHW)",
  "End-Fed Random Wire",
  "Vertical Ground Plane",
  "Vertical 1/4 wave",
  "Vertical 5/8 wave",
  "Yagi 3-element",
  "Yagi 5-element",
  "Quad Loop",
  "Delta Loop",
  "Magnetic Loop",
  "Inverted-V",
  "Inverted-L",
  "Windom",
  "Zepp",
  "G5RV",
  "OCF Dipole",
  "Beverage",
  "Long Wire"
];

const tunerDB = {
  "Zetagi TM535": {
    controls: [
      {
        id: "transmitter", label: "TRANSMITTER",
        type: "knob",
        min: 1, max: 10, step: 0.5,
        size: "large",
        arcFrom: -90, arcTo: 90
      },
      {
        id: "antenna", label: "ANTENNA",
        type: "knob",
        min: 1, max: 10, step: 0.5,
        size: "large",
        arcFrom: -90, arcTo: 90
      },
      {
        id: "inductor", label: "INDUCTOR SELECTOR",
        type: "knob-labeled",
        options: ["A","B","C","D","E","F","G","H","I","J","K","L"],
        size: "small",
        boxed: true,
        startAt: -90
      }
    ],
    factorySuggestions: [
      { freq: 1.5,  transmitter: 3,   antenna: 4.5, inductor: "A" },
      { freq: 3.5,  transmitter: 5,   antenna: 5.5, inductor: "C" },
      { freq: 7,    transmitter: 7,   antenna: 7,   inductor: "F" },
      { freq: 10,   transmitter: 6,   antenna: 6,   inductor: "H" },
      { freq: 14,   transmitter: 4.5, antenna: 5,   inductor: "J" },
      { freq: 18,   transmitter: 7,   antenna: 7,   inductor: "J" },
      { freq: 21,   transmitter: 8,   antenna: 8.5, inductor: "J" },
      { freq: 24,   transmitter: 6,   antenna: 6,   inductor: "K" },
      { freq: 28,   transmitter: 7.5, antenna: 8,   inductor: "K" }
    ]
  }
};
