

Upgrade this existing Three.js Uyo keke driving game to a high-quality, visually appealing, endless, real-life Uyo experience. Keep the current good parts (Pidgin language, Naira, Ikot Ekpene Road, etc.) and massively improve everything else.

### 1. Visual & Polish Goals

- Make the game look premium and modern (clean UI, good lighting, better colors, smooth animations).
- Improve vehicle models: make the player vehicle a proper low-poly Uyo keke (3 wheels, canopy, realistic proportions and colors). Other vehicles should also look better.
- Better environment: richer Uyo-style buildings, trees, roadside details, better road textures, warm Nigerian daylight lighting.
- Smooth camera, screen effects, and overall juice.

### 2. Cool Loading / Start Screen

- Create an attractive full-screen loading and start experience.
- Show “Loading Uyo Ayaya…” or “Uyo Ayaya” with a stylish animation.
- Use high-quality, atmospheric images or generated views of Uyo (streets, Ibom Plaza area, kekes, etc.).
- After loading, show a beautiful title screen with the game name, “Uyo, Akwa Ibom”, and a big “Start Ride” button.
- Make it feel premium and local.

### 3. Core Gameplay Fixes & Features

**Collision & Hit Effects**

- Fix vehicles passing through each other.
- Implement proper collision detection.
- On crash: strong screen shake, flash, particle/debris effect, crash sound, vehicle reaction (slow down or slight spin), then game over or damage state.
- Make the hit feel satisfying and weighty.

**Streets System**

- Stop being stuck only on Ikot Ekpene Road.
- Add multiple real Uyo streets: Ikot Ekpene Road, Aka Road, Abak Road, Oron Road, Wellington Bassey Way, Nwaniba Road, Ibom Plaza area, etc.
- Let the player select which street to start on.
- Street name should change as the player progresses.
- Show roadside street name signs.
- Different streets can have slightly different traffic or atmosphere.

**Fuel System (Real Life)**

- Add visible fuel gauge.
- Fuel decreases while driving (faster when boosting).
- Spawn filling stations along the road.
- Player must reach a station and refuel (button or automatic when close).
- Running out of fuel causes the vehicle to slow and stop.

**Horn**

- Add a horn button (on-screen + keyboard).
- Play a realistic keke/bus horn sound when pressed.

**Passengers**

- Improve passenger system: clear pickup zones, passenger counter, drop-off points for bonus points and coins.

**Endless + Missions**

- Keep daily missions.
- After daily missions are complete, generate endless random missions (carry X passengers, survive on a specific street, collect coins without crashing, etc.).
- Make the game feel truly endless and rewarding.

**Continue / Revive System**

- When the player crashes, offer the option to continue from the exact point of failure using coins/Naira.
- Short invincibility period after revive.

### 4. Username, Stats & Leaderboard

- After a run (or first time), allow the player to enter a username.
- Save stats locally (high score, best distance, total coins, total runs, etc.) using localStorage.
- Create a clean leaderboard screen showing top local scores with usernames.

### 5. Share & Download After Run

- After every run (game over or completed), generate a nice shareable result card/image that shows:
  - Username
  - Distance
  - Score
  - Coins / ₦ earned
  - Street
  - Game branding (“kekenapepe – Uyo”)
- Buttons:
  - Download the image
  - Share to Twitter/X
  - Share to other socials (or copy link)
- Make the result card visually attractive and Uyo-branded.

### 6. Extra Real-Life Uyo Feel

- Add small details that make it feel like real Uyo: roadside activity, speed bumps, occasional checkpoints, changing time-of-day lighting if possible, authentic signage, Naira economy, Pidgin messages.

### 7. Technical Requirements

- Keep it mobile-friendly with clear on-screen controls (Brake, Faster, Left/Right, Horn, Refuel).
- Maintain good performance.
- Clean, modular, well-commented code.
- Use localStorage for all saves.
- Make UI modern, readable, and visually consistent.

Prioritize in this order if needed:

1. Collision + hit effects
2. Loading/Start screen
3. Streets system
4. Fuel + Horn
5. Shareable result card
6. Username + Leaderboard
7. Revive system + more missions
8. Visual polish


UI/UX Specification for Uyo Keke Game
(Inspired by Lagos Run – adapted for Uyo)
1. Loading Screen
•  Full black or dark background
•  Big bold yellow title in the center: UYO RUN or KEKE NAPEPE
•  Thin progress bar underneath
•  Text below the bar that changes, for example:
	•  “LOADING IBOM PLAZA…”
	•  “LOADING ORON ROAD…”
	•  “LOADING NWANIBA…”
	•  “LOADING UYO AYAYA…”
•  Make it feel premium and local (smooth animation, maybe subtle city silhouette or low-poly Uyo view in the background)
2. Main Home / Start Screen
Layout should closely follow Lagos Run:
•  Top: Game title UYO RUN (or your final name) in big yellow letters
•  Small text under it: “TODAY: [Dynamic day/weather]” e.g. “TODAY: SUNNY THURSDAY”
•  Missions panel (collapsible or expandable) showing daily missions + progress (e.g. LVL 1 · 0/3 DONE)
•  Giant yellow primary button in the center: OYA, DRIVE! or START RIDE
•  Two secondary buttons below it:
	•  GARAGE (for vehicle upgrades / paint / horns)
	•  LEADERS (leaderboard)
•  Short instruction tips (like Lagos Run):
	1.  Hold BRAKE to stop at bus stops and pick passengers
	2.  Drop them at their stop to get paid
	3.  Honk to clear the road / alert
•  Bottom: “Install the app” button + privacy/cookie notice
3. Road Selection Screen (New – Important)
Before starting a run, show a clean road selection screen:
Title: Choose Your Road
List of selectable Uyo roads (with icons or small previews):
•  Ikot Ekpene Road
•  Aka Road
•  Abak Road
•  Oron Road
•  Nwaniba Road
•  Wellington Bassey Way
•  Ibom Plaza Loop
•  UniUyo Road
When the user selects a road:
•  The game loads that specific road
•  Buildings, shops, roadside elements, and people should match the chosen road as much as possible
•  The current street name is clearly displayed during the run
4. Bus Stops & Passenger System
•  Real Uyo-style bus stops / yellow pickup zones on the selected road
•  Stop names should use real Uyo locations, for example:
	•  Ibom Plaza
	•  Itam Junction
	•  Nwaniba Roundabout
	•  UniUyo Main Gate
	•  Abak Road by Ukana
	•  Oron Road by Udo Udoma
	•  etc.
How passengers work:
•  Passengers can be waiting at the stop or flag the keke from the roadside
•  Player must hold BRAKE to fully stop and pick them up
•  Show passenger count on the UI
•  Later there are drop-off points where the player must stop again to drop them and earn money/coins
•  Clear visual feedback when passengers board or alight
5. Leaderboard Screen
Copy the structure from Lagos Run:
•  Title: LEADERBOARD
•  Tabs: TODAY | THIS WEEK | ALL TIME
•  Live indicator
•  Ranked list with username + score
•  “SET NAME” button if the user has no username yet
•  Big DONE button at the bottom
6. After-Run / Game Over Screen
•  Strong Pidgin message (keep the style you already have)
•  Stats: Distance, Score, Coins, ₦ earned, Road played
•  Big buttons:
	•  RIDE AGAIN
	•  SHARE (generates a nice image card that can be downloaded or shared to X / WhatsApp / etc.)
	•  LEADERBOARD
•  Option to continue/revive using coins if you implemented that feature
7. General UI Rules
•  Color palette: Strong yellow (like Lagos Run) + dark backgrounds + clean white text
•  Big, finger-friendly buttons for mobile
•  Clear hierarchy: Primary action is always the big yellow button
•  Consistent fonts and spacing
•  All text should feel Nigerian/Uyo (Pidgin where it fits)


Make the final result feel like a real, fun, shareable Uyo game that people will want to play and post about.

-----

