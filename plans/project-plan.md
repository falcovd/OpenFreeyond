# OpenFreeyond: projectplan

*Status: versie 1.0. Alle technische beslissingen voor fase 1 zijn vastgelegd. Klaar voor review.*

## 1. Doel

OpenFreeyond is een gestileerde, gezellige en huiselijke wereld in de browser waarin je vrij kunt rondlopen en verkennen. In die wereld woont een fictief menselijk personage met wie je later via stem kunt praten. Het is een hobbyproject met een verhaal- of game-achtige beleving, geïnspireerd door de serie *Upload*.

## 2. Uitgangspunten

| Onderwerp | Keuze |
|---|---|
| Hoofddoel | Verhaal- of game-achtige ervaring |
| Stijl en sfeer | Gestileerd, gezellig en huiselijk |
| Spelerinteractie | Vrij rondlopen en verkennen |
| Avatar | Fictief menselijk personage |
| Avatar-communicatie | Praten via stem (fase 2) |
| Platform | Desktop browser; WebXR-ready bouwen, VR testen later |
| Tijdsinvestering | Minder dan 2 uur per week |
| Budget | Gratis als uitgangspunt; klein budget toegestaan voor stem of taalmodel als gratis niet goed genoeg is |
| Werkwijze | Gestructureerd, met AI-hulp, de code moet begrijpelijk blijven |
| Fase 1 (ca. 2 maanden) | Wereld plus een avatar die er staat |
| Avatar-intake | 7 velden, zoals in punt 4 |
| Verhaal | Volgt uit het ingevulde achtergrondverhaal, geen vaste verhaallijn |
| Maandbudget fase 2 | Later bepalen |
| Omgeving fase 1 | Gezellig straatje of dorpsplein, met één huis plus tuin als verkenbaar gebied |

## 3. Scope

**Binnen scope**
- Een loopbare 3D-wereld in de browser (A-Frame / three.js)
- Een gezellig straatje of dorpsplein met één huis plus tuin als verkenbaar gebied, met warm licht en sfeer
- Een gestileerde menselijke avatar met een vaste plek in de wereld (idle-animatie)
- Een inlogscherm met een try-out modus en een avatar-intake (zie punt 4)
- Besturing met toetsenbord en muis
- Daarna: stemgesprek met de avatar
- Bouwen volgens WebXR-conventies, zodat VR later zonder herbouw kan

**Buiten scope (voorlopig)**
- Fotorealistische gezichten
- Echte accounts met opslag op een server in fase 1 (eerst alleen try-out)
- Multiplayer
- Mobiele ondersteuning
- VR-testen (geen bril beschikbaar)
- Onbeperkte uitgaven aan stem of taalmodel

## 4. Account en avatar-intake

**Flow:** de gebruiker komt op een inlogscherm. Bij het openen van een nieuw account vult hij gegevens in die de avatar vormgeven. Daarna wordt de wereld geladen met die avatar erin. Naast inloggen is er een **try-out** die zonder account werkt en een voorbeeldpersonage laadt.

**Gegevens voor de avatar (voorlopige velden)**

| Veld | Doel |
|---|---|
| Naam en leeftijd | Aanspreekvorm en basis voor het gesprek |
| Uiterlijk (kleuren van haar en kleding) | Aanpassen van één kant-en-klaar gestileerd model |
| Karakter (bijvoorbeeld rustig, grappig) | Toon van de avatar in fase 2 |
| Hobby's en favoriete dingen | Gespreksstof en objecten in de wereld |
| Achtergrondverhaal | Context voor het taalmodel in fase 2 |
| Stem (keuze uit een paar opties) | Stem van de avatar in fase 2 |
| Woonomgeving (bijvoorbeeld huisje met tuin) | Welke wereld geladen wordt |

**Try-out met random voorbeeldgegevens**

| Veld | Voorbeeld |
|---|---|
| Naam en leeftijd | Noor de Wit, 34 |
| Uiterlijk | Donkerblond haar, warme trui in mosgroen |
| Karakter | Spontaan, nieuwsgierig, droge humor |
| Hobby's | Bouldering, festivals, gamen met vrienden, vintage shoppen, stedentrips |
| Achtergrondverhaal | Werkt als bakker, woont sinds twee jaar in een huisje met tuin aan het water en gaat zo vaak mogelijk met vrienden op stedentrip |
| Stem | Zacht en vriendelijk |
| Woonomgeving | Huis met tuin aan een gezellig straatje |

**Technische aanpak**
- **Fase 1:** alleen try-out en een inlogscherm als ontwerp. Gegevens blijven in de browser (localStorage), er is nog geen server nodig. Dit past binnen de tijd en het gratis budget.
- **Fase 2:** echte accounts en opslag via een gratis backend-tier (bijvoorbeeld Supabase of Firebase). Houd het aantal opgeslagen gegevens zo klein mogelijk, want het gaat om persoonlijke informatie.

## 5. Realistische planning

Bij minder dan 2 uur per week is er in twee maanden ongeveer 12 tot 16 uur beschikbaar. Fase 1 is daarom bewust klein. Elke stap moet in één of twee sessies af te ronden zijn.

### Fase 0: Voorbereiding (week 1)
- [ ] Ontwikkelomgeving kiezen (code-editor, lokale webserver)
- [ ] GitHub-repository en lokale Git-configuratie opzetten
- [ ] VS Code inrichten (extensies voor JavaScript, Docker, ESLint en Prettier)
- [ ] ESLint, Prettier en Vitest configureren, plus een GitHub Action die lint en tests draait
- [ ] Vite-project opzetten met A-Frame als dependency
- [ ] Dockerfile opzetten: dev-container met de Vite dev server en een productie-build die door nginx wordt geserveerd
- [ ] Een "hello world" A-Frame-scène draaiend krijgen in de dev-container
- **Klaar als:** een simpele scène opent in de browser vanuit de dev-container, wijzigingen verschijnen direct, en de productie-build draait los in nginx

### Fase 1: Wereld en avatar (week 2 t/m 8)
- [ ] **Stap 1, basiswereld:** grond, lucht, licht en een eerste object
- [ ] **Stap 2, besturing:** rondlopen met WASD en muis
- [ ] **Stap 3, sfeer:** straatje of plein, huis met tuin, warm kleurpalet, meubels en objecten uit gratis modellen, zacht licht en schaduwen
- [ ] **Stap 4, avatar:** gestileerd menselijk personage importeren en neerzetten met een idle-animatie, met aanpasbare kleuren voor haar en kleding
- [ ] **Stap 5, startscherm:** inlogscherm met een try-out-knop die het voorbeeldpersonage laadt
- [ ] **Stap 6, afronding:** prestaties controleren en de wereld online zetten (bijvoorbeeld GitHub Pages)
- **Klaar als:** je via de try-out in de wereld belandt, kunt rondlopen en de avatar zichtbaar op zijn plek staat

### Fase 2: Accounts en stemgesprek (later)
- [ ] Echte accounts en opslag van de avatar-gegevens via een gratis backend-tier
- [ ] De ingevulde avatar-gegevens vertalen naar de instructies voor het taalmodel
- [ ] Eerst gratis opties testen: spraakfuncties in de browser en een gratis taalmodel-tier
- [ ] Alleen als de kwaliteit tekortschiet: betaalde stem of taalmodel binnen het maandbudget
- [ ] Spraak naar tekst en tekst naar spraak koppelen aan het taalmodel
- [ ] Eenvoudige mondanimatie of lipsync

### Fase 3: VR (later, optioneel)
- [ ] Gedurende fase 1 en 2 WebXR-ready bouwen: schaal in meters, ruimte voor een controller-besturing
- [ ] Testen zodra er een bril beschikbaar is

## 6. Techniek (voorlopige keuzes)

- **Framework:** A-Frame (bouwt voort op three.js, ondersteunt WebXR)
- **Editor:** VS Code
- **Taal:** JavaScript. Voorlopige keuze bij geen voorkeur: A-Frame is JavaScript-first en dit houdt de code begrijpelijk. Overstappen op TypeScript kan later.
- **Build-tooling:** Vite (dev server met hot reload en een geoptimaliseerde productie-build)
- **Versiebeheer:** Git met GitHub
- **Assets:** alleen kant-en-klare gratis modellen en texturen met een vrije licentie (bijvoorbeeld Kenney, Quaternius, Poly Pizza). Controleer per asset de licentie. Zelf modelleren of aanpassen in Blender valt buiten scope.
- **Avatar:** kant-en-klaar gestileerd menselijk personage als glTF/GLB-bestand. Kies een model dat een idle-animatie meebrengt en aparte materialen heeft voor haar en kleding, zodat die kleuren via de intake aanpasbaar zijn.
- **Ontwikkelflow:** alles in Docker, ook tijdens ontwikkelen. De Vite dev server draait in een container met de projectmap als volume.
- **Runtime:** Docker. Voor productie bouwt een multi-stage Dockerfile de site met Node en serveert het resultaat met `nginx:alpine`. Fase 2 voegt een backend toe via Docker Compose.
- **HTTPS:** microfoon (fase 2) en WebXR (fase 3) werken alleen via HTTPS of op `localhost`. Voor gebruik op andere apparaten is een certificaat of reverse proxy nodig.
- **Kwaliteitsborging:** ESLint en Prettier voor codekwaliteit, Vitest voor geautomatiseerde tests van de logica (bijvoorbeeld validatie van de intake en het kleuren van het model), en handmatig testen in de browser voor wat je moet zien en voelen. De 3D-scène zelf wordt niet geautomatiseerd getest, dat is te duur voor deze PoC.
- **Hosting:** voorlopig lokaal in Docker. Waar het uiteindelijk komt, wordt later bepaald; GitHub Pages is de eenvoudigste kandidaat.
- **Stem (fase 2):** eerst de gratis browserfuncties proberen, daarna pas betaalde opties overwegen

## 7. Werkwijze

- Elke stap heeft een duidelijk eindresultaat dat je kunt testen voordat je doorgaat.
- AI-hulp wordt gebruikt om code te schrijven én uit te leggen. Elke stap eindigt met de vraag: begrijp ik wat hier gebeurt?
- Per sessie wordt kort vastgelegd wat af is, wat blokkeert en wat de volgende stap is.
- Niet vooruit werken: fase 2 begint pas als fase 1 af is.

## 8. Risico's en aandachtspunten

| Risico | Mogelijke aanpak |
|---|---|
| Te weinig tijd, motivatie zakt weg | Kleine stappen, snel zichtbaar resultaat |
| Wereld wordt traag door te veel details | Lage polycount, weinig lichten, vroeg prestaties testen |
| Gratis stem en taalmodel blijken te beperkt | Klein maandbudget vaststellen en kosten per gesprek bijhouden |
| Licentieproblemen met assets | Alleen assets met duidelijke vrije licentie gebruiken |
| Kant-en-klaar avatarmodel is beperkt aanpasbaar, terwijl de intake een uiterlijk vraagt | Uiterlijk-keuzes beperken tot wat het model toelaat (bijvoorbeeld kleuren of een paar varianten) |
| Menselijke avatar voelt onnatuurlijk (uncanny valley) | Bewust gestileerd houden, niet fotorealistisch |
| Accounts vragen een backend en bewaren persoonlijke gegevens | Fase 1 alleen try-out, later gratis tier en zo min mogelijk opslaan |
| VR werkt niet omdat het nooit getest is | WebXR-conventies volgen en testen zodra er een bril is |

## 9. Open vragen

Er zijn geen blokkerende open vragen meer voor fase 1. Bewust uitgesteld:
- Het maandbudget voor stem en taalmodel (fase 2)
- De uiteindelijke hostinglocatie
- Het testen van VR (zodra er een bril is)

## 10. Eerstvolgende stappen

1. Dit plan doorlezen en aanpassen waar nodig.
2. Fase 0 uitvoeren: een A-Frame-scène lokaal draaiend krijgen.
3. Per fase 1-stap een korte werkafspraak maken met bijbehorend testcriterium.
