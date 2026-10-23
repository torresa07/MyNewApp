// Curated precedents and inspiration sources for the Precedents tab.

export const SOURCES = [
  { name: "ArchDaily", url: "https://www.archdaily.com/", text: "The largest library of built projects, with drawings and photos for most." },
  { name: "Dezeen", url: "https://www.dezeen.com/architecture/", text: "Daily architecture and design news, great for current work." },
  { name: "Divisare", url: "https://divisare.com/", text: "Beautifully curated photography of contemporary projects." },
  { name: "Archello", url: "https://archello.com/", text: "Projects searchable by material and product — useful for material research." },
  { name: "designboom", url: "https://www.designboom.com/architecture/", text: "Architecture, art and design stories from around the world." },
  { name: "Architizer", url: "https://architizer.com/", text: "Projects filterable by typology, plus the A+ Awards." },
  { name: "Atlas of Places", url: "https://www.atlasofplaces.com/", text: "Plans, sections and essays — excellent for drawing references." },
  { name: "Landezine", url: "https://landezine.com/", text: "Landscape architecture projects — site plans and landscape ideas." },
  { name: "The Architectural Review", url: "https://www.architectural-review.com/", text: "Critical writing and in-depth building studies." },
  { name: "Archinect", url: "https://archinect.com/", text: "News, features and student work from schools worldwide." },
  { name: "Socks Studio", url: "https://socks-studio.com/", text: "Drawings, history and unusual references — great for concepts." },
  { name: "Pinterest — Architecture", url: "https://www.pinterest.com/search/pins/?q=architecture%20drawing", text: "Quick visual inspiration for boards, diagrams and model photos." },
];

export const TYPOLOGIES = ["All", "Library", "Museum", "Housing", "House", "Education", "Pavilion", "Civic", "Sacred", "Landscape", "Adaptive reuse"];

export const PRECEDENTS = [
  { name: "Phillips Exeter Academy Library", architect: "Louis Kahn", year: 1972, place: "Exeter, USA", type: "Library", color: "#c9a690", idea: "A brick outer ring of reading carrels wraps a concrete core of books around a monumental central atrium.", study: "Section through the atrium; the three-ring plan diagram." },
  { name: "Seattle Central Library", architect: "OMA / LMN", year: 2004, place: "Seattle, USA", type: "Library", color: "#bccad0", idea: "Program stacked into shifted platforms wrapped in a diamond-grid skin; the Books Spiral is a continuous ramp of shelves.", study: "Program-stacking diagram; exploded axonometric." },
  { name: "Stuttgart City Library", architect: "Yi Architects", year: 2011, place: "Stuttgart, Germany", type: "Library", color: "#e7e3dc", idea: "A pure cube with a white, top-lit inverted-pyramid reading hall.", study: "Section showing the stepped atrium." },
  { name: "Kimbell Art Museum", architect: "Louis Kahn", year: 1972, place: "Fort Worth, USA", type: "Museum", color: "#d8c9b3", idea: "Cycloid vaults split at the top let reflected daylight wash the galleries.", study: "Vault section and light reflector detail." },
  { name: "Kolumba Museum", architect: "Peter Zumthor", year: 2007, place: "Cologne, Germany", type: "Museum", color: "#b9b1a6", idea: "A new museum built over Roman and medieval ruins with a perforated brick wall filtering light.", study: "How the new walls sit on the ruins; the brick 'filter' wall detail." },
  { name: "Louisiana Museum of Modern Art", architect: "Bo & Wohlert", year: 1958, place: "Humlebæk, Denmark", type: "Museum", color: "#a8b59a", idea: "Low pavilions linked by glazed corridors, choreographing art with views of the sea and garden.", study: "Site plan and sequence of spaces." },
  { name: "21st Century Museum, Kanazawa", architect: "SANAA", year: 2004, place: "Kanazawa, Japan", type: "Museum", color: "#e3e7e8", idea: "Gallery boxes of different heights scattered inside a round glass perimeter — no front or back.", study: "Plan as a field of boxes; circulation between them." },
  { name: "Neues Museum", architect: "David Chipperfield", year: 2009, place: "Berlin, Germany", type: "Adaptive reuse", color: "#cbbfae", idea: "A war-damaged museum repaired so that old fragments and new insertions read side by side.", study: "Material junctions between old and new." },
  { name: "Tate Modern", architect: "Herzog & de Meuron", year: 2000, place: "London, UK", type: "Adaptive reuse", color: "#a8624a", idea: "A power station reused as a gallery; the Turbine Hall becomes an indoor public street.", study: "Long section through the Turbine Hall." },
  { name: "The High Line", architect: "James Corner Field Operations, Diller Scofidio + Renfro", year: 2009, place: "New York, USA", type: "Landscape", color: "#93a37f", idea: "A disused elevated rail line turned into a linear park with planting that recalls self-seeded growth.", study: "Paving-to-planting transitions; sectional moments." },
  { name: "Unité d'Habitation", architect: "Le Corbusier", year: 1952, place: "Marseille, France", type: "Housing", color: "#c2b6a3", idea: "A 'vertical city' of interlocking duplex flats with an internal shopping street and rooftop terrace.", study: "Interlocking duplex section." },
  { name: "Quinta Monroy", architect: "Elemental", year: 2004, place: "Iquique, Chile", type: "Housing", color: "#d9c79a", idea: "'Half a good house': the frame and core are built, families complete the rest over time.", study: "Before/after occupancy elevations." },
  { name: "Habitat 67", architect: "Moshe Safdie", year: 1967, place: "Montreal, Canada", type: "Housing", color: "#cfcac2", idea: "Prefabricated concrete boxes stacked so every home gets a garden on its neighbour's roof.", study: "Module stacking axonometric." },
  { name: "Villa Savoye", architect: "Le Corbusier", year: 1931, place: "Poissy, France", type: "House", color: "#ece6da", idea: "Demonstrates the Five Points: pilotis, free plan, free façade, ribbon windows, roof garden.", study: "The ramp as a promenade architecturale." },
  { name: "Fallingwater", architect: "Frank Lloyd Wright", year: 1937, place: "Pennsylvania, USA", type: "House", color: "#c49a74", idea: "Cantilevered terraces anchored on the rock, built over a waterfall.", study: "Section showing house, rock and stream." },
  { name: "Farnsworth House", architect: "Mies van der Rohe", year: 1951, place: "Illinois, USA", type: "House", color: "#e7ecee", idea: "A glass pavilion floating above a floodplain; the landscape is the walls.", study: "Plan with the service core; steel-to-slab detail." },
  { name: "Casa Barragán", architect: "Luis Barragán", year: 1948, place: "Mexico City, Mexico", type: "House", color: "#d4a5a5", idea: "Inward-looking rooms of coloured walls, controlled light and a walled garden.", study: "Colour and light studies; the rooftop terrace." },
  { name: "Maison à Bordeaux", architect: "OMA", year: 1998, place: "Bordeaux, France", type: "House", color: "#9fb3a8", idea: "A moving platform room lets a wheelchair user travel through all three levels.", study: "Section with the lift platform." },
  { name: "Barcelona Pavilion", architect: "Mies van der Rohe", year: 1929, place: "Barcelona, Spain", type: "Pavilion", color: "#bccad0", idea: "Free-standing planes of marble, onyx and glass under a floating roof create a flowing space.", study: "Plan of free-standing walls; material palette." },
  { name: "Serpentine Pavilion 2002", architect: "Toyo Ito with Cecil Balmond", year: 2002, place: "London, UK", type: "Pavilion", color: "#e3e7e8", idea: "An algorithm of rotating squares generates a structure where walls and roof are one pattern.", study: "Roof-pattern geometry diagram." },
  { name: "Teshima Art Museum", architect: "Ryue Nishizawa", year: 2010, place: "Teshima, Japan", type: "Pavilion", color: "#f1ece3", idea: "A single thin concrete shell with two openings, framing sky, wind and water droplets.", study: "Shell section; the openings in plan." },
  { name: "Salk Institute", architect: "Louis Kahn", year: 1965, place: "La Jolla, USA", type: "Education", color: "#d9d2c5", idea: "Two labs flank a travertine plaza with a water channel pointing to the Pacific.", study: "Site section to the ocean; interstitial service floors." },
  { name: "Rolex Learning Center", architect: "SANAA", year: 2010, place: "Lausanne, Switzerland", type: "Education", color: "#e7ecee", idea: "One continuous undulating floor with patios — study spaces defined by topography, not walls.", study: "Long sections showing the landscape floor." },
  { name: "Gando Primary School", architect: "Diébédo Francis Kéré", year: 2001, place: "Gando, Burkina Faso", type: "Education", color: "#c47f5e", idea: "Local clay bricks and a raised, ventilated roof keep classrooms cool, built with the community.", study: "Climate section with airflow." },
  { name: "Sendai Mediatheque", architect: "Toyo Ito", year: 2001, place: "Sendai, Japan", type: "Civic", color: "#cfe0dd", idea: "Thin floor plates held by 13 tubular lattice columns that also carry light and services.", study: "Tube structure diagram; floor plates." },
  { name: "Säynätsalo Town Hall", architect: "Alvar Aalto", year: 1952, place: "Säynätsalo, Finland", type: "Civic", color: "#a8624a", idea: "Red brick buildings around a raised grass courtyard, entered by grass steps.", study: "Courtyard section and the grass stair." },
  { name: "Church of the Light", architect: "Tadao Ando", year: 1989, place: "Osaka, Japan", type: "Sacred", color: "#b9b1a6", idea: "A concrete box where a cross is cut into the wall, made only of light.", study: "Plan with the slicing wall; light study." },
  { name: "Therme Vals", architect: "Peter Zumthor", year: 1996, place: "Vals, Switzerland", type: "Sacred", color: "#5d6266", idea: "Stone baths carved like a quarry into the hillside; bathing as a sensory, almost sacred ritual.", study: "Layered stone wall detail; plan of 'blocks'." },
  { name: "Woodland Cemetery", architect: "Asplund & Lewerentz", year: 1940, place: "Stockholm, Sweden", type: "Landscape", color: "#8f9f92", idea: "A landscape of meadow, hill and pine forest that guides mourners through a journey.", study: "Site plan and approach sequence." },
  { name: "Superkilen", architect: "BIG, Topotek 1, Superflex", year: 2012, place: "Copenhagen, Denmark", type: "Landscape", color: "#d4a5a5", idea: "An urban park of three colour-coded zones filled with objects from the 60 nationalities living nearby.", study: "Zoning plan and object catalogue." },
];

export function searchLinks(p) {
  const q = encodeURIComponent(`${p.name} ${p.architect}`);
  return {
    archdaily: `https://www.google.com/search?q=site%3Aarchdaily.com+${q}`,
    wikipedia: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(p.name)}`,
    images: `https://www.google.com/search?tbm=isch&q=${q}+plan+section`,
  };
}
