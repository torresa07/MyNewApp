// Final submission checklist items. Each item carries quality criteria the
// student ticks off; the review tab turns unticked criteria into advice.

export const CHECKLIST_ITEMS = [
  {
    key: "site-plan",
    label: "Site plan",
    criteria: [
      { key: "north", text: "North arrow and graphic scale bar", tip: "Add a north arrow and a graphic scale bar — reviewers look for these first on a site plan." },
      { key: "context", text: "Surrounding context (streets, neighbours, topography)", tip: "Show the building in its context: adjacent buildings, streets, contours. A site plan without context reads as an object, not a place." },
      { key: "landscape", text: "Landscape, access and entry points shown", tip: "Draw landscape, paths and entries so the jury understands how people arrive and move across the site." },
      { key: "roof", text: "Roof plan / building footprint reads clearly", tip: "Give the building footprint the strongest line weight or a tone so it reads first." },
    ],
  },
  {
    key: "floor-plans",
    label: "Floor plans",
    criteria: [
      { key: "all-levels", text: "Every level drawn, including ground with context", tip: "Make sure every level is drawn, and the ground floor shows the immediate outdoor space." },
      { key: "labels", text: "Rooms labelled or keyed", tip: "Label spaces (or use a numbered key) so the program is readable without you explaining it." },
      { key: "lineweights", text: "Cut lines heavier than lines beyond", tip: "Use clear line-weight hierarchy: poché or heavy lines for cut walls, light lines for things beyond." },
      { key: "cut-markers", text: "Section cut markers referenced", tip: "Mark where your sections cut on the plans so drawings cross-reference each other." },
      { key: "dimensions", text: "Key dimensions or scale bar", tip: "Add key dimensions or a scale bar so sizes can be judged." },
    ],
  },
  {
    key: "sections",
    label: "Sections",
    criteria: [
      { key: "two", text: "At least two sections (long + short)", tip: "Include at least a long and a short section — one section rarely explains a building." },
      { key: "key-spaces", text: "Cuts through the most important spaces", tip: "Move your section cut so it passes through the most important spatial moment (double heights, stairs, courtyard)." },
      { key: "poche", text: "Cut elements poché'd, ground line strong", tip: "Poché the cut elements and give the ground a strong line so the section reads instantly." },
      { key: "scale-figures", text: "Human figures for scale", tip: "Add people to sections — they communicate scale and how spaces are used." },
      { key: "light", text: "Light, levels or environmental ideas shown", tip: "Use the section to tell a story: daylight, ventilation, or level changes." },
    ],
  },
  {
    key: "elevations",
    label: "Elevations",
    criteria: [
      { key: "all-facades", text: "All key façades drawn", tip: "Draw every façade that matters, especially the street and entry elevations." },
      { key: "materials", text: "Materials indicated (hatch, tone or labels)", tip: "Indicate materials on elevations through hatch, tone or callouts." },
      { key: "shadows", text: "Shadows / depth cast", tip: "Cast shadows to show depth of openings and projections — flat elevations undersell the design." },
      { key: "context-edges", text: "Ground line and neighbouring context", tip: "Show the ground line and a hint of neighbouring buildings to anchor the elevation." },
    ],
  },
  {
    key: "details",
    label: "Details",
    criteria: [
      { key: "scale", text: "Drawn at 1:5–1:20", tip: "Details should be large scale (1:5 to 1:20); anything smaller reads as a section." },
      { key: "layers", text: "Build-up layers labelled", tip: "Label each layer of the build-up (structure, insulation, membrane, finish)." },
      { key: "connection", text: "Shows a key junction (roof/wall, window, floor)", tip: "Pick a junction that matters to your concept — e.g. where the roof meets the wall or a signature window." },
      { key: "concept-link", text: "Linked back to the concept", tip: "Explain how the detail supports your concept (light, tectonics, material honesty)." },
    ],
  },
  {
    key: "renderings",
    label: "Renderings",
    criteria: [
      { key: "eye-level", text: "At least one eye-level view", tip: "Include an eye-level perspective — it's how people will actually experience the building." },
      { key: "interior", text: "Interior view of a key space", tip: "Add an interior view of your most important space." },
      { key: "atmosphere", text: "Consistent atmosphere / style across images", tip: "Keep lighting, colour grading and entourage consistent so renders feel like one project." },
      { key: "concept", text: "Views chosen to express the concept", tip: "Choose views that prove your concept, not just pretty angles." },
    ],
  },
  {
    key: "diagrams",
    label: "Diagrams",
    criteria: [
      { key: "concept", text: "Concept / parti diagram", tip: "A simple parti diagram is the fastest way for a jury to get your idea." },
      { key: "site", text: "Site analysis (sun, wind, access, views)", tip: "Show site forces: sun path, wind, access, views, noise." },
      { key: "program", text: "Program / circulation diagram", tip: "Diagram program and circulation so the plan logic is clear." },
      { key: "consistent", text: "Consistent graphic language", tip: "Use one graphic language (line weight, colours, axonometric angle) across all diagrams." },
    ],
  },
  {
    key: "model",
    label: "Physical model",
    criteria: [
      { key: "scale", text: "Scale chosen and noted", tip: "Choose a scale that shows the idea (1:500 site, 1:200 building, 1:50 fragment) and label it." },
      { key: "materials", text: "Material palette is intentional", tip: "Limit materials to 2–3 that express the concept (e.g. basswood + chipboard)." },
      { key: "context", text: "Site / context included", tip: "Include at least a context base so the model shows the relationship to the site." },
      { key: "craft", text: "Clean craft — joints, glue, edges", tip: "Check craft: clean edges, no glue marks, square joints. Craft is read as care." },
      { key: "photos", text: "Photographed for the boards", tip: "Photograph the model against a plain background with directional light for your boards." },
    ],
  },
  {
    key: "board",
    label: "Final presentation board",
    criteria: [
      { key: "hierarchy", text: "Clear hierarchy — one hero image", tip: "Pick one hero image and size it largest; everything else supports it." },
      { key: "narrative", text: "Reads in a logical order (story)", tip: "Arrange the board so it reads as a story: context → concept → plans/sections → experience." },
      { key: "title", text: "Title, name, studio and short statement", tip: "Add a project title, your name, studio and a 2–3 sentence statement." },
      { key: "grid", text: "Aligned to a grid with consistent margins", tip: "Lay the board on a grid with consistent margins and gutters." },
      { key: "legible", text: "Text legible from 1.5 m away", tip: "Print a test at 100% — body text should be legible from about 1.5 m." },
    ],
  },
];

export const STATUS = {
  todo: { label: "Not started" },
  progress: { label: "In progress" },
  done: { label: "Done" },
};
