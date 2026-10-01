export type NavItem = { label: string; handle: string };

export const HEAT_LEVELS: NavItem[] = [
  { label: "As Seen On Hot Ones", handle: "hot-ones" },
  { label: "Hot Ones Season 31", handle: "hot-ones-season-31" },
  { label: "Newest Items", handle: "recently-added" },
  { label: "Mild", handle: "mild-sauces" },
  { label: "Medium", handle: "medium-sauces" },
  { label: "Hot", handle: "hot-sauces" },
  { label: "Extra Hot", handle: "extra-hot-sauces" },
  { label: "Hottest", handle: "hottest-sauces" },
  { label: "Extracts", handle: "extract-sauces-1" },
  { label: "BBQ Sauces", handle: "bbq-sauce-and-marinades" },
  { label: "Wing Sauces", handle: "wing-sauces" },
  { label: "Clearance", handle: "clearance-items" },
];

export const PEPPER_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Mild & Medium",
    items: [
      { label: "Ancho", handle: "ancho-peppers" },
      { label: "Bell", handle: "sauces-with-bell-peppers" },
      { label: "Hatch", handle: "hatch" },
      { label: "Jalapeno", handle: "jalapeno-pepper" },
      { label: "Poblano", handle: "poblano-pepper" },
    ],
  },
  {
    title: "Hot",
    items: [
      { label: "Amarillo", handle: "aji-amarillo" },
      { label: "Cayenne", handle: "cayenne-pepper-sauces" },
      { label: "Chile De Arbol", handle: "chile-de-arbol" },
      { label: "Chipotle", handle: "chipotle-peppers" },
      { label: "Serrano", handle: "serrano-pepper" },
      { label: "Thai", handle: "thai-chile" },
    ],
  },
  {
    title: "Extra Hot",
    items: [
      { label: "Bhut Jolokia / Ghost", handle: "ghost-pepper-sauces" },
      { label: "Datil", handle: "datil-peppers" },
      { label: "Habanero", handle: "habanero-pepper" },
      { label: "Peri Peri", handle: "peri-peri" },
      { label: "Scotch Bonnet", handle: "scotch-bonnet" },
    ],
  },
  {
    title: "Hottest",
    items: [
      { label: "7 Pot", handle: "sauces-with-7-pot" },
      { label: "Apollo", handle: "apollo-pepper" },
      { label: "Carolina Reaper", handle: "carolina-reaper" },
      { label: "Dragon's Breath", handle: "dragons-breath-pepper" },
      { label: "Pepper X", handle: "pepper-x" },
      { label: "Rocoto", handle: "aji-rocoto-pepper" },
      { label: "Scorpion", handle: "scorpion-pepper" },
    ],
  },
];

export const FRUIT: NavItem[] = [
  { label: "Blackberries", handle: "sauces-with-blackberries" },
  { label: "Raspberries", handle: "raspberries" },
  { label: "Blueberries", handle: "blueberries" },
  { label: "Cherries", handle: "cherries" },
  { label: "Strawberries", handle: "strawberry" },
  { label: "Apple", handle: "apples" },
  { label: "Pear", handle: "sauces-with-pears" },
  { label: "Carrots", handle: "carrots" },
  { label: "Tomato", handle: "sauces-with-tomato" },
  { label: "Mango", handle: "mango" },
  { label: "Pineapple", handle: "pineapple" },
  { label: "Papaya", handle: "sauces-with-papaya" },
];

export const STYLES: NavItem[] = [
  { label: "Wing Sauces", handle: "wing-sauces" },
  { label: "Taco / Mexican", handle: "taco-mexican-sauces" },
  { label: "Bacon", handle: "bacon-sauces" },
  { label: "Honey", handle: "hot-sauce-with-honey" },
  { label: "Garlic", handle: "sauces-with-garlic" },
  { label: "Onion", handle: "sauces-with-onions" },
  { label: "BBQ Sauces / Marinades", handle: "bbq-sauce-and-marinades" },
  { label: "Chili Oils / Crisps", handle: "chili-oil-and-chili-crisp" },
];

export const DIETARY: NavItem[] = [
  { label: "Gluten Free", handle: "gluten-free-sauces" },
  { label: "Keto", handle: "keto-sauces" },
  { label: "Paleo", handle: "paleo" },
  { label: "Vegan", handle: "vegan-sauces" },
  { label: "Vegetarian", handle: "vegatarian-sauces" },
  { label: "Organic", handle: "organic-sauces" },
  { label: "Non-GMO", handle: "non-gmo-items" },
];

export const HOME_CHIPS: NavItem[] = [
  { label: "Hot Ones", handle: "hot-ones" },
  { label: "Wing Sauces", handle: "wing-sauces" },
  { label: "BBQ", handle: "bbq-sauce-and-marinades" },
  { label: "Chili Oils", handle: "chili-oil-and-chili-crisp" },
  { label: "Fruit Sauces", handle: "fruit-hot-sauces" },
  { label: "Package Deals", handle: "package-deals-category" },
  { label: "Clearance", handle: "clearance-items" },
];

export const PEPPER_TILES: NavItem[] = [
  { label: "Carolina Reaper", handle: "carolina-reaper" },
  { label: "Ghost", handle: "ghost-pepper-sauces" },
  { label: "Habanero", handle: "habanero-pepper" },
  { label: "Jalapeno", handle: "jalapeno-pepper" },
  { label: "Scorpion", handle: "scorpion-pepper" },
  { label: "Pepper X", handle: "pepper-x" },
  { label: "Scotch Bonnet", handle: "scotch-bonnet" },
  { label: "Chipotle", handle: "chipotle-peppers" },
];

export const HEAT_CARDS = [
  { label: "Mild", handle: "mild-sauces", score: 1 },
  { label: "Medium", handle: "medium-sauces", score: 2 },
  { label: "Hot", handle: "hot-sauces", score: 3 },
  { label: "Extra Hot", handle: "extra-hot-sauces", score: 4 },
  { label: "Hottest", handle: "hottest-sauces", score: 5 },
] as const;

const ALL_ITEMS = [
  ...HEAT_LEVELS,
  ...PEPPER_GROUPS.flatMap((g) => g.items),
  ...FRUIT,
  ...STYLES,
  ...DIETARY,
  ...HOME_CHIPS,
];

const LABEL_BY_HANDLE = new Map(ALL_ITEMS.map((item) => [item.handle, item.label]));

export function labelForHandle(handle: string) {
  if (handle === "on-sale") return "On Sale";
  return LABEL_BY_HANDLE.get(handle) ?? null;
}
