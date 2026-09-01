import type { Recipe, Ingredient } from "./api";

const ing = (amount: number | null, unit: string, name: string): Ingredient => ({
  raw: `${amount !== null ? amount : ""}${amount !== null ? " " : ""}${unit ? unit + " " : ""}${name}`.trim(),
  name,
  amount: amount ?? undefined,
  unit: unit || undefined,
});

/**
 * Demo-retseptid, mida näidatakse kui recipeapi.io API võtit pole
 * seadistatud või API pole kättesaadav. Struktuur on identne
 * normaliseeritud API-vastustega, seega UI käitub samamoodi.
 */
export const DEMO_RECIPES: Recipe[] = [
  {
    id: "demo-pelmeenid",
    name: "Kodused pelmeenid hapukoorega",
    description:
      "Õhukese tainaga, mahlase sea-sigu hakklihaga pelmeenid nagu vanaema juures — serveeri rohke hapukoore ja värske tilliga.",
    image:
      "https://images.pexels.com/photos/6680788/pexels-photo-6680788.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 55,
    prepMinutes: 40,
    servings: 4,
    difficulty: "Keskmine",
    cuisine: "Ida-Euroopa",
    tags: ["õhtusöök", "liha", "klassika", "pelmeenid"],
    calories: 560,
    protein: 26,
    carbs: 58,
    fat: 22,
    ingredients: [
      ing(300, "g", "nisujahu"),
      ing(1, "", "muna"),
      ing(120, "ml", "vett"),
      ing(0.5, "tl", "soola"),
      ing(400, "g", "hakkliha (sea-siga)"),
      ing(2, "", "sibulat"),
      ing(2, "küüsnt", "küüslauku"),
      ing(0.5, "tl", "musta pipart"),
      ing(150, "g", "hapukoort"),
      ing(30, "g", "võid"),
      ing(null, "", "värske till serveerimiseks"),
    ],
    instructions: [
      "Sega jahu soolaga, lisa muna ja vesi ning sõtku siledaks tainaks. Lase tainal kaane all 20 minutit tõmmata.",
      "Segu hakkliha peeneks hakitud sibula, pressitud küüslaugu, soola ja pipraga — täidis peab jääma mahlane, mitte kuiv.",
      "Rulli tainas pähklipaksusena lahti ja lõika klaasiga ümmargused põhjad. Tõsta igale põhjale teelusikatäis täidist.",
      "Voldi põhi poolkuuks, pigista servad tihedalt kinni ja ühenda nurgad — pelmeen peab olema õhukindel.",
      "Keeda pelmeeneid soolases keevas vees 5–7 minutit, kuni nad tõusevad pinnale ja tainas on läbiküps.",
      "Tõsta välja, sega juurde või ja serveeri hapukoore, värske tilli ja musta pipraga.",
    ],
    source: "demo",
  },
  {
    id: "demo-pasta",
    name: "Kreemine parmesanipasta",
    description:
      "15-minutine tiktokis sensatsiooniks saanud pasta: siidine koore-parmesanikaste, küüslauku ja veidi muskaatpähklit.",
    image:
      "https://images.pexels.com/photos/14930758/pexels-photo-14930758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 20,
    prepMinutes: 5,
    servings: 3,
    difficulty: "Lihtne",
    cuisine: "Itaalia",
    tags: ["õhtusöök", "pasta", "kiire", "vegetaar"],
    calories: 690,
    protein: 24,
    carbs: 82,
    fat: 28,
    ingredients: [
      ing(300, "g", "spagette või fettuccine"),
      ing(200, "ml", "röösnelt koort"),
      ing(60, "g", "rivitud parmesani"),
      ing(3, "küüsnt", "küüslauku"),
      ing(30, "g", "võid"),
      ing(0.25, "tl", "muskaatpähklit"),
      ing(null, "", "musta pipart ja soola"),
      ing(null, "", "värskeid basiilikulehti"),
    ],
    instructions: [
      "Keeda pasta pakendi juhise järgi rohke soolaga — hoia tassitäis pastavett alles.",
      "Sulata või pannil, lisa viilutatud küüslauk ja prae 30 sekundit õrnalt, põlemata.",
      "Vala juurde koor, maitsesta muskaatpähkliga ja hauduta 2–3 minutit kergeks paksenemiseni.",
      "Sega sisse parmesan ja lusikatäis pastavett, kuni kaste muutub läikivaks ja siidiseks.",
      "Tõsta pasta kastmesse, sega korralikult läbi ja serveeri kohe basiiliku ning lisaparmesaniga.",
    ],
    source: "demo",
  },
  {
    id: "demo-pannkoogid",
    name: "Puhuvad pannkoogid marjadega",
    description:
      "Ameerika stiilis pakud pannkoogid, mis püsivad kõrged tänu küpsetuspulbrile ja tainapuhkusele — vahtrasiirup ja marjad peale.",
    image:
      "https://images.pexels.com/photos/718739/pexels-photo-718739.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 25,
    prepMinutes: 10,
    servings: 4,
    difficulty: "Lihtne",
    cuisine: "Ameerika",
    tags: ["hommikusöök", "magus", "pannkoogid", "lapsed"],
    calories: 430,
    protein: 11,
    carbs: 68,
    fat: 12,
    ingredients: [
      ing(250, "g", "nisujahu"),
      ing(300, "ml", "piima"),
      ing(2, "", "muna"),
      ing(2, "spl", "suhkrut"),
      ing(2, "tl", "küpsetuspulbrit"),
      ing(0.5, "tl", "soola"),
      ing(30, "g", "sulatatud võid"),
      ing(200, "g", "värskeid marju"),
      ing(null, "", "vahtrasiirupit serveerimiseks"),
    ],
    instructions: [
      "Sega kuivained kausis: jahu, küpsetuspulber, suhkur ja sool.",
      "Vispelda teises kausis munad piimaga, vala kuivainetele ja sega KERGISSE tainaks — tõmblused on lubatud!",
      "Lase tainal 10 minutit puhata, siis seka sisse sulatatud või.",
      "Kuumuta pann keskmisel kuumusel ja vala iga pannkoogi jaoks väike kuhjake tainast.",
      "Prae umbes 2 minutit kummaltki küljelt, kuni pinnale tekivad mullid ja ääred on kuldpruunid.",
      "Serveeri virna, mille peal on värsked marjad ja paks vahtrasiirupi kiht.",
    ],
    source: "demo",
  },
  {
    id: "demo-shakshuka",
    name: "Shakshuka ühe panni peal",
    description:
      "Tomati-paprikakastmes haudunud munad fetajuustuga — ideaalne nädalavahetuse brantš, mida süüakse otse pannilt.",
    image:
      "https://images.pexels.com/photos/6275112/pexels-photo-6275112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 30,
    prepMinutes: 10,
    servings: 2,
    difficulty: "Lihtne",
    cuisine: "Lähis-Ida",
    tags: ["hommikusöök", "brantš", "vegetaar", "üks pann"],
    calories: 320,
    protein: 17,
    carbs: 24,
    fat: 18,
    ingredients: [
      ing(4, "", "muna"),
      ing(400, "g", "kuubikuteks hakitud tomateid (purk)"),
      ing(1, "", "punast paprikat"),
      ing(1, "", "sibulat"),
      ing(2, "küüsnt", "küüslauku"),
      ing(1, "tl", "köömneid"),
      ing(0.5, "tl", "suitsust paprikat"),
      ing(80, "g", "fetajuustu"),
      ing(null, "", "värske koriander"),
      ing(null, "", "pita või hapusai serveerimiseks"),
    ],
    instructions: [
      "Kuumuta oliiviõli pannil ja prae sibul ning paprika 6–8 minutit pehmeks.",
      "Lisa küüslauk, köömneid ja suitsupaprika — prae 30 sekundit, kuni maitseained avanevad.",
      "Vala tomatid pannile, maitsesta ja hauduta 10 minutit paksuks kastmeks.",
      "Tee kastmesse lusikaga süvendid ja klopi igasse muna. Kata pann kaanega.",
      "Hauduta 5–6 minutit, kuni munavalge on tõmbunud, aga kollane veel pooleldi vedel.",
      "Puista peale murendatud feta ja koriander ning serveeri pita või saiaga.",
    ],
    source: "demo",
  },
  {
    id: "demo-poke",
    name: "Lõhe-poke kauss",
    description:
      "Hawaii stiilis värske kauss: sushi-riis, marineeritud lõhe, avokaado ja krõbe kurk — tervislik, kiire ja instagramitav.",
    image:
      "https://images.pexels.com/photos/15913453/pexels-photo-15913453.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 30,
    prepMinutes: 15,
    servings: 2,
    difficulty: "Keskmine",
    cuisine: "Hawaii",
    tags: ["lõunasöök", "kala", "tervislik", "poke"],
    calories: 520,
    protein: 34,
    carbs: 55,
    fat: 19,
    ingredients: [
      ing(250, "g", "sushi-riisi"),
      ing(300, "g", "värsket lõhefileed (sushi-kvaliteet)"),
      ing(3, "spl", "sojakastet"),
      ing(1, "spl", "seesamiõli"),
      ing(1, "", "avokaadot"),
      ing(0.5, "", "kurki"),
      ing(100, "g", "edamame ube"),
      ing(1, "spl", "seesamiseemneid"),
      ing(null, "", "nori-lehti ja sriracha-mayot"),
    ],
    instructions: [
      "Keeta sushi-riis ja maitsesta lahjendatud riisiäädika ning näpuotsa suhkru-soolaga.",
      "Lõika lõhe 2 cm kuubikuteks ja sega sojakastme, seesamiõli ning magusaia-mirusanaga marineerida üheks tunniks.",
      "Lõika avokaado ja kurk, sulata edamameoad kuumas vees.",
      "Komplekteeri kausid: riis põhja, peale lõhe ja köögiviljad korrektselt sektsioonidena.",
      "Viimistle seesamiseemete, nori-ribade ja sriracha-mayojoontega.",
    ],
    source: "demo",
  },
  {
    id: "demo-lavakook",
    name: "Šokolaadi-lavakook",
    description:
      "Väljast kinnine, seest voolava šokolaadisüdamega koogike — magustoit, mis päästab iga õhtusöögikülaskäigu.",
    image:
      "https://images.pexels.com/photos/3740193/pexels-photo-3740193.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 25,
    prepMinutes: 12,
    servings: 4,
    difficulty: "Keskmine",
    cuisine: "Prantsuse",
    tags: ["magus", "šokolaad", "kiire", "külalised"],
    calories: 610,
    protein: 9,
    carbs: 58,
    fat: 38,
    ingredients: [
      ing(180, "g", "tumeda šokolaadiga (70%)"),
      ing(110, "g", "võid"),
      ing(2, "", "muna"),
      ing(2, "", "munakollist"),
      ing(80, "g", "suhkrut"),
      ing(60, "g", "nisujahu"),
      ing(1, "tl", "vaniljesuhkrut"),
      ing(null, "", "näpuots soola ja jäätist serveerimiseks"),
    ],
    instructions: [
      "Kuumuta ahi 210°C ja määri neli vormi võiga, puista üle kakaoga.",
      "Sulata šokolaad koos võiga vesivannil ja lase veidi jahtuda.",
      "Vispelda munad, kollased ja suhkur heledaks vahuks — umbes 3 minutit.",
      "Sega šokolaadimass muna segu sisse, seejärel silu sisse jahu ja vanilje.",
      "Jaga vormidesse ja küpseta täpselt 11–12 minutit — servad peavad olema küpsed, keskmine veel värisema.",
      "Kummuta ettevaatlikult taldrikule ja serveeri KOHE vaniljejäätisega.",
    ],
    source: "demo",
  },
  {
    id: "demo-ramen",
    name: "Kiire kodune kanaramen",
    description:
      "Soodiupuljongi asemel 25-minutine versioon: maitserikas kanapuljong, pehmelt keedetud munad ja krõbedad köögiviljad.",
    image:
      "https://images.pexels.com/photos/31393431/pexels-photo-31393431.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 30,
    prepMinutes: 10,
    servings: 2,
    difficulty: "Lihtne",
    cuisine: "Jaapani",
    tags: ["õhtusöök", "nuudlid", "kiire", "süüa"],
    calories: 480,
    protein: 30,
    carbs: 52,
    fat: 16,
    ingredients: [
      ing(180, "g", "ramen-nuudleid"),
      ing(1, "l", "kanapuljongit"),
      ing(2, "", "muna"),
      ing(200, "g", "keedetud kanarindaa"),
      ing(2, "spl", "sojakastet"),
      ing(1, "tl", "rivitud ingverit"),
      ing(2, "", "kevadsibulat"),
      ing(100, "g", "värsket spinatit"),
      ing(1, "tl", "seesamiõli"),
    ],
    instructions: [
      "Keeda munad 6,5 minutit, jahuta jääkülmas vees ja puhasta — kollane jääb siidiselt vedel.",
      "Kuumuta puljong koos ingveri, küüslaugu ja sojakastmega, hauduta 10 minutit.",
      "Keeta nuudlid eraldi pakendi järgi, kurna ja jaga kaussidesse.",
      "Lisa puljongisse spinat ja kana ning kuumuta läbi.",
      "Kalla puljong nuudlitele, komplekteeri munapoolike ja kevadsibul, tilguta seesamiõli.",
    ],
    source: "demo",
  },
  {
    id: "demo-takod",
    name: "Kalatako laimi-kapsasalatiga",
    description:
      "Baja stiilis krõbedad kalatako'd pikanti kreemi ja hapuka kapsasalatiga — tänavatoit parimal kujul.",
    image:
      "https://images.pexels.com/photos/8448325/pexels-photo-8448325.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    totalMinutes: 35,
    prepMinutes: 20,
    servings: 4,
    difficulty: "Keskmine",
    cuisine: "Mehhiko",
    tags: ["õhtusöök", "kala", "tänavatoit", "tako"],
    calories: 410,
    protein: 28,
    carbs: 38,
    fat: 15,
    ingredients: [
      ing(400, "g", "valge kala fileed (tursk või pangasius)"),
      ing(8, "", "väikest maisitortillat"),
      ing(200, "g", "peeneks viilutatud kapsast"),
      ing(2, "", "laimi"),
      ing(100, "g", "majoneesi või röösnet koort"),
      ing(1, "tl", "suitsust paprikat"),
      ing(1, "tl", "köömneid"),
      ing(null, "", "koriandrit ja jalapeñot serveerimiseks"),
      ing(4, "spl", "jahu ja õli praadimiseks"),
    ],
    instructions: [
      "Sega kapsas laimimahla, soola ja purustatud köömnetega — lase 10 min tõmmata.",
      "Klopi kokku kaste: majonees, laimimahl, küüslauk ja suitsupaprika.",
      "Maitsesta kalatükid soola, paprika ja köömnetega, pööra kergelt jahus.",
      "Prae kala kuumas õlis 2–3 minutit kummaltki küljelt kuldseks.",
      "Kuumuta tortillad kuival pannil, kata kapsasalat, kala ja kaste.",
      "Serveeri laimisektorite, koriandri ja jalapeño-viiludega.",
    ],
    source: "demo",
  },
];

/* Otsing demo-andmetest — skooritakse nime, siltide ja koostisosade alusel. */
export function demoSearch(query: string): Recipe[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_RECIPES;

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = DEMO_RECIPES.map((r) => {
    let score = 0;
    const haystack = [
      r.name,
      r.description,
      r.cuisine ?? "",
      ...r.tags,
      ...r.ingredients.map((i) => i.name ?? i.raw),
    ]
      .join(" ")
      .toLowerCase();

    for (const t of tokens) {
      if (r.name.toLowerCase().includes(t)) score += 4;
      if (r.tags.some((tag) => tag.toLowerCase().includes(t))) score += 3;
      if (haystack.includes(t)) score += 1;
    }
    return { r, score };
  });

  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  // Kui midagi ei leitud, tagasta vähemalt populaarseimad, et vool ei katkeks
  return hits.length > 0 ? hits.map((h) => h.r) : DEMO_RECIPES.slice(0, 4);
}
