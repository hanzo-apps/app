/**
 * Games catalog — the machine-readable manifest for Hanzo's generative
 * game-development platform.
 *
 * Each entry is a real, license-verified open-source Unity or Unreal Engine
 * example game. Forkable games (redistribution permitted by their upstream
 * license) are mirrored into the `hanzoai` GitHub org PRISTINE — license =
 * origin, we add nothing and relicense nothing. Games we may NOT redistribute
 * (Epic/Unreal EULA content, "all rights reserved", or unlicensed repos) are
 * listed with `fork: null` and a `forkReason`, so the gap is documented rather
 * than hidden.
 *
 * `assetSlots` is intentionally empty for every entry in this pass — a later
 * pass defines the swappable slots (characters, levels, audio, UI) that the
 * generative pipeline fills.
 *
 * License discipline (hard gate): every entry records the EXACT license and the
 * file/URL it was read from (`licenseSource`). Unity Companion License (UCL)
 * demos are forkable for Unity-project use with the restriction noted; MIT /
 * Apache / multi-license OSS are freely forkable with attribution.
 */

// =============================================================================
// TYPES
// =============================================================================

export type GameEngine = "unity" | "unreal";

/** Build/run targets a game can realistically ship to. */
export type BuildTarget =
  | "webgl"
  | "windows"
  | "mac"
  | "linux"
  | "android"
  | "ios";

export interface GameEntry {
  /** Stable slug, unique across the catalog. */
  id: string;
  /** Human-facing game name. */
  name: string;
  engine: GameEngine;
  /** Unity editor version (e.g. "2022.3.9f1") or UE version (e.g. "5.7"). */
  engineVersion: string;
  /** Upstream source: GitHub `owner/repo`, or a reference URL for EULA samples. */
  upstream: string;
  /** hanzoai fork `owner/repo`, or null when the license forbids redistribution. */
  fork: string | null;
  /** Present only when `fork === null`: why it cannot be forked to a public org. */
  forkReason?: string;
  /** Exact license name / SPDX id as declared upstream. */
  license: string;
  /** The file or URL the license was read from (audit trail — no unverified rows). */
  licenseSource: string;
  /** Redistribution / reuse obligations a downstream user must honor. */
  licenseRestrictions: string;
  genre: string;
  targets: BuildTarget[];
  /** Contains a buildable project (Unity ProjectVersion.txt / UE *.uproject). */
  buildable: boolean;
  description: string;
  /** Swappable asset slots — defined in a later pass. Empty for now. */
  assetSlots: string[];
  /** Upstream star count at time of cataloging, or null if not a standalone repo. */
  stars: number | null;
  /** ISO date of the last upstream push, or null if unknown. */
  lastUpstreamActivity: string | null;
}

// =============================================================================
// UNITY — forkable (mirrored into hanzoai)
// =============================================================================

const unityForked: GameEntry[] = [
  {
    id: "unity-chop-chop",
    name: "Chop Chop (Open Project #1)",
    engine: "unity",
    engineVersion: "2020.3.17f1",
    upstream: "UnityTechnologies/open-project-1",
    fork: "hanzoai/open-project-1",
    license: "Apache-2.0",
    licenseSource: "LICENSE.md — GitHub SPDX match Apache-2.0",
    licenseRestrictions:
      "Apache-2.0: retain NOTICE/attribution; permissive, freely redistributable.",
    genre: "action-adventure",
    targets: ["webgl", "windows", "mac", "linux"],
    buildable: true,
    description:
      "Unity's community-built Open Project #1 — a polished 3D action-adventure (URP) with combat, cooking, and world traversal.",
    assetSlots: [],
    stars: 6069,
    lastUpstreamActivity: "2023-08-04",
  },
  {
    id: "unity-red-runner",
    name: "Red Runner",
    engine: "unity",
    engineVersion: "6000.2.6f2",
    upstream: "BayatGames/RedRunner",
    fork: "hanzoai/RedRunner",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "2d-platformer",
    targets: ["webgl", "windows", "mac", "linux", "android", "ios"],
    buildable: true,
    description:
      "Fast, polished 2D running/platformer with parkour animation and procedural obstacles.",
    assetSlots: [],
    stars: 904,
    lastUpstreamActivity: "2026-01-29",
  },
  {
    id: "unity-fps-sample",
    name: "FPS Sample (Unity)",
    engine: "unity",
    engineVersion: "2018.3.8f1",
    upstream: "Unity-Technologies/FPSSample",
    fork: "hanzoai/FPSSample",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'Licensed under the Unity Companion License' (unity3d.com/legal/licenses/Unity_Companion_License)",
    licenseRestrictions:
      "UCL: use only within Unity-based projects; fork OK; cannot be used to compete with Unity.",
    genre: "fps",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Networked multiplayer first-person-shooter reference project (DOTS/ECS) built by Unity.",
    assetSlots: [],
    stars: 5113,
    lastUpstreamActivity: "2025-10-23",
  },
  {
    id: "unity-boat-attack",
    name: "Boat Attack",
    engine: "unity",
    engineVersion: "2020.3.23f1",
    upstream: "Unity-Technologies/BoatAttack",
    fork: "hanzoai/BoatAttack",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'Boat Attack copyright (c) 2018 Unity Technologies ApS ... Unity Companion License'",
    licenseRestrictions:
      "UCL: use only within Unity-based projects; fork OK; Unity-dependent.",
    genre: "racing",
    targets: ["webgl", "windows", "mac", "linux", "android", "ios"],
    buildable: true,
    description:
      "URP water/boat racing demo with buoyancy physics — Unity's flagship Universal Render Pipeline showcase.",
    assetSlots: [],
    stars: 2756,
    lastUpstreamActivity: "2025-12-05",
  },
  {
    id: "unity-megacity-2019",
    name: "Megacity",
    engine: "unity",
    engineVersion: "2022.3.9f1",
    upstream: "Unity-Technologies/Megacity-2019",
    fork: "hanzoai/Megacity-2019",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'Megacity Sample copyright (c) 2023 Unity Technologies ApS ... Unity Companion License'",
    licenseRestrictions:
      "UCL: use only within Unity-based projects; fork OK; Unity-dependent.",
    genre: "showcase-flying",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Massive DOTS/ECS sci-fi city showcase with thousands of streamed entities and 3D spatial audio.",
    assetSlots: [],
    stars: 534,
    lastUpstreamActivity: "2024-06-13",
  },
  {
    id: "unity-dots-sample",
    name: "DOTS Sample",
    engine: "unity",
    engineVersion: "2019.3.6f1",
    upstream: "Unity-Technologies/DOTSSample",
    fork: "hanzoai/DOTSSample",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'copyright (c) 2019 Unity Technologies ApS ... Unity Companion License'",
    licenseRestrictions:
      "UCL: Unity-dependent, fork OK. Upstream repo is archived (read-only).",
    genre: "action",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Third-person networked action sample built on the Data-Oriented Tech Stack (archived upstream).",
    assetSlots: [],
    stars: 1017,
    lastUpstreamActivity: "2020-11-23",
  },
  {
    id: "unity-project-tiny-samples",
    name: "Project Tiny Samples",
    engine: "unity",
    engineVersion: "2020.1.17f1",
    upstream: "Unity-Technologies/ProjectTinySamples",
    fork: "hanzoai/ProjectTinySamples",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'Project Tiny Samples copyright (c) 2020 Unity Technologies ApS ... Unity Companion License'",
    licenseRestrictions:
      "UCL: Unity-dependent, fork OK. Web-first instant-play mini-games.",
    genre: "casual-collection",
    targets: ["webgl", "android", "ios"],
    buildable: true,
    description:
      "Collection of lightweight web/mobile mini-games (Tiny Racing, match, arcade) targeting instant-play WebGL.",
    assetSlots: [],
    stars: 912,
    lastUpstreamActivity: "2025-10-24",
  },
  {
    id: "unity-royale",
    name: "Unity Royale (UI Toolkit demo)",
    engine: "unity",
    engineVersion: "2020.3.14f1",
    upstream: "Unity-Technologies/UIToolkitUnityRoyaleRuntimeDemo",
    fork: "hanzoai/UIToolkitUnityRoyaleRuntimeDemo",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "tower-strategy",
    targets: ["webgl", "windows", "mac", "linux", "android", "ios"],
    buildable: true,
    description:
      "Clash-Royale-style lane/tower strategy game demonstrating a runtime UI Toolkit HUD.",
    assetSlots: [],
    stars: 401,
    lastUpstreamActivity: "2025-10-23",
  },
  {
    id: "unity-boss-room",
    name: "Boss Room",
    engine: "unity",
    engineVersion: "6000.0.52f1",
    upstream: "Unity-Technologies/com.unity.multiplayer.samples.coop",
    fork: "hanzoai/com.unity.multiplayer.samples.coop",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'Boss Room: Small Scale Co-op Sample (c) 2021 Unity Technologies ... Unity Companion License'",
    licenseRestrictions:
      "UCL: Unity-dependent, fork OK. Netcode for GameObjects reference.",
    genre: "coop-rpg",
    targets: ["windows", "mac", "linux", "android", "ios"],
    buildable: true,
    description:
      "Small-scale 8-player co-op RPG dungeon crawler — Unity's canonical Netcode for GameObjects sample.",
    assetSlots: [],
    stars: 1944,
    lastUpstreamActivity: "2026-03-25",
  },
  {
    id: "unity-2d-techdemos",
    name: "2D Tech Demos",
    engine: "unity",
    engineVersion: "6000.3.3f1",
    upstream: "Unity-Technologies/2d-techdemos",
    fork: "hanzoai/2d-techdemos",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "2d-samples",
    targets: ["webgl", "windows", "mac", "linux", "android", "ios"],
    buildable: true,
    description:
      "Official 2D feature demos (pixel-perfect, tilemap, sprite-shape, 2D lights) — building blocks for 2D games.",
    assetSlots: [],
    stars: 1008,
    lastUpstreamActivity: "2026-03-13",
  },
  {
    id: "unity-ecs-network-racing",
    name: "ECS Network Racing",
    engine: "unity",
    engineVersion: "6000.2.11f1",
    upstream: "Unity-Technologies/ECS-Network-Racing-Sample",
    fork: "hanzoai/ECS-Network-Racing-Sample",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'ECS Network Racing Sample copyright (c) 2022 Unity Technologies ... Unity Companion License'",
    licenseRestrictions:
      "UCL: Unity-dependent, fork OK. Netcode for Entities reference.",
    genre: "racing-multiplayer",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Multiplayer arcade racing sample built on ECS + Netcode for Entities with client prediction.",
    assetSlots: [],
    stars: 760,
    lastUpstreamActivity: "2026-07-09",
  },
  {
    id: "unity-megacity-metro",
    name: "Megacity Metro",
    engine: "unity",
    engineVersion: "6000.1.0f1",
    upstream: "Unity-Technologies/megacity-metro",
    fork: "hanzoai/megacity-metro",
    license: "Unity Companion License (UCL)",
    licenseSource:
      "LICENSE.md — 'Megacity Metro copyright (c) 2024 Unity Technologies ... Unity Companion License'",
    licenseRestrictions:
      "UCL: Unity-dependent, fork OK. 128+ player DOTS multiplayer.",
    genre: "shooter-multiplayer",
    targets: ["windows", "mac", "linux", "android", "ios"],
    buildable: true,
    description:
      "Large-scale (128+ player) competitive multiplayer shooter set in the Megacity, built on DOTS + Netcode for Entities.",
    assetSlots: [],
    stars: 1150,
    lastUpstreamActivity: "2026-04-10",
  },
];

// =============================================================================
// UNREAL — forkable (mirrored into hanzoai)
// =============================================================================

const unrealForked: GameEntry[] = [
  {
    id: "ue-epic-survival-game",
    name: "Survival Game (Epic Survival Game Series)",
    engine: "unreal",
    engineVersion: "5.2",
    upstream: "tomlooman/EpicSurvivalGame",
    fork: "hanzoai/EpicSurvivalGame",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions:
      "MIT on project code. Verify any bundled Epic starter-content before shipping (that content stays under the Unreal EULA).",
    genre: "survival-action",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Third-person multiplayer survival game (crafting, hunger, day/night) from Tom Looman's Survival Game series.",
    assetSlots: [],
    stars: 3383,
    lastUpstreamActivity: "2026-02-12",
  },
  {
    id: "ue-gas-shooter",
    name: "GASShooter",
    engine: "unreal",
    engineVersion: "4.27",
    upstream: "tranek/GASShooter",
    fork: "hanzoai/GASShooter",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "fps-tps",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Advanced multiplayer FPS/TPS sample built entirely on Unreal's Gameplay Ability System (weapons, reload, abilities).",
    assetSlots: [],
    stars: 1160,
    lastUpstreamActivity: "2024-07-09",
  },
  {
    id: "ue-gas-documentation",
    name: "GAS Documentation Sample",
    engine: "unreal",
    engineVersion: "5.3",
    upstream: "tranek/GASDocumentation",
    fork: "hanzoai/GASDocumentation",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "action-sample",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Playable third-person Gameplay Ability System reference project accompanying the definitive GAS guide.",
    assetSlots: [],
    stars: 5861,
    lastUpstreamActivity: "2024-04-06",
  },
  {
    id: "ue-bomber",
    name: "Bomber",
    engine: "unreal",
    engineVersion: "5.7",
    upstream: "JanSeliv/Bomber",
    fork: "hanzoai/Bomber",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "arcade-multiplayer",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Bomberman-style multiplayer arcade game showcasing clean modern UE5 C++ and data-driven design.",
    assetSlots: [],
    stars: 368,
    lastUpstreamActivity: "2026-06-30",
  },
  {
    id: "ue-argus",
    name: "Argus",
    engine: "unreal",
    engineVersion: "5.8",
    upstream: "Karazaa/Argus",
    fork: "hanzoai/Argus",
    license: "MIT",
    licenseSource: "LICENSE — GitHub SPDX match MIT",
    licenseRestrictions: "MIT: retain copyright notice; freely redistributable.",
    genre: "rts",
    targets: ["windows", "linux"],
    buildable: true,
    description:
      "Real-time strategy game with a custom deterministic ECS layer over UE5 for large unit counts.",
    assetSlots: [],
    stars: 17,
    lastUpstreamActivity: "2026-07-09",
  },
  {
    id: "ue-alis",
    name: "ALIS",
    engine: "unreal",
    engineVersion: "5.7",
    upstream: "fallintodusk/alis",
    fork: "hanzoai/alis",
    license: "AODL v2.0 (multi-license: per-component OSS licenses)",
    licenseSource:
      "LICENSE — 'Alis Open Development Policy (AODL) v2.0 ... each component uses a real, established license'",
    licenseRestrictions:
      "Multi-licensed by component; each component carries its own established OSS license. Honor the per-component LICENSE when redistributing.",
    genre: "survival-openworld",
    targets: ["windows", "linux"],
    buildable: true,
    description:
      "Open-source UE5 survival game with modular C++ gameplay, data-driven JSON definitions, and AI-agent-friendly flows.",
    assetSlots: [],
    stars: 8,
    lastUpstreamActivity: "2026-07-07",
  },
];

// =============================================================================
// NOT FORKABLE — documented gap (EULA / all-rights-reserved / unlicensed)
// =============================================================================

const referenceOnly: GameEntry[] = [
  // --- Unreal: restrictive / unlicensed GitHub repos ---
  {
    id: "ue-action-roguelike",
    name: "ActionRoguelike",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "tomlooman/ActionRoguelike",
    fork: null,
    forkReason:
      "Bundles Epic Paragon assets under the Unreal EULA; not redistributable to a public GitHub org.",
    license: "Unreal Engine EULA (assets); project code has no OSS LICENSE file",
    licenseSource:
      "README.md — 'Game Assets: Licensed for use with the Unreal Engine only ... (Unreal Engine EULA applies)'; no LICENSE file in repo tree",
    licenseRestrictions:
      "Use via the Epic ecosystem only; cannot be mirrored publicly. Excellent reference for UE5 C++ course architecture.",
    genre: "action-roguelike",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Tom Looman's flagship UE5 C++ course project — a third-person action roguelike (widely used as a learning reference).",
    assetSlots: [],
    stars: 4510,
    lastUpstreamActivity: "2026-07-09",
  },
  {
    id: "ue-simple-fps-template",
    name: "SimpleFPSTemplate",
    engine: "unreal",
    engineVersion: "4.x",
    upstream: "tomlooman/SimpleFPSTemplate",
    fork: null,
    forkReason:
      "README explicitly places the project under the Unreal Engine EULA; not redistributable to a public org.",
    license: "Unreal Engine EULA",
    licenseSource:
      "README.md — 'This project is licensed under the Unreal Engine EULA.'",
    licenseRestrictions: "Use via the Epic ecosystem only.",
    genre: "fps-template",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Minimal networked first-person-shooter starter template (hitscan/projectile, health, respawn).",
    assetSlots: [],
    stars: 681,
    lastUpstreamActivity: "2023-08-28",
  },
  {
    id: "ue-open-tournament",
    name: "Open Tournament",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "OpenTournament/OpenTournament",
    fork: null,
    forkReason:
      "LICENSE is 'All Rights Reserved — source provided only for use in the official Open Tournament project'; no redistribution grant.",
    license: "Proprietary / All Rights Reserved",
    licenseSource:
      "LICENSE (repo root) — 'Copyright (C) Open Tournament - All Rights Reserved ... provided only for use in the development of the official Open Tournament project'",
    licenseRestrictions:
      "No redistribution/reuse rights. Contribute upstream only; do not mirror.",
    genre: "arena-fps",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Community arena first-person-shooter in the spirit of Unreal Tournament / Quake.",
    assetSlots: [],
    stars: 199,
    lastUpstreamActivity: "2026-06-22",
  },
  {
    id: "ue-iniside-actionrpg",
    name: "ActionRPGGame (iniside)",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "iniside/ActionRPGGame",
    fork: null,
    forkReason:
      "No LICENSE file — default copyright is all-rights-reserved; no redistribution grant.",
    license: "Unlicensed (no LICENSE file)",
    licenseSource: "repo root — no LICENSE/COPYING file present in tree",
    licenseRestrictions:
      "No redistribution rights without explicit permission from the author.",
    genre: "action-rpg",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Long-running community UE action-RPG framework (abilities, inventory, attributes).",
    assetSlots: [],
    stars: 1036,
    lastUpstreamActivity: "2023-02-18",
  },
  // --- Unity: unlicensed official sample ---
  {
    id: "unity-trash-dash",
    name: "Trash Dash (Endless Runner Sample)",
    engine: "unity",
    engineVersion: "2020.x",
    upstream: "Unity-Technologies/EndlessRunnerSampleGame",
    fork: null,
    forkReason:
      "No LICENSE file and no license text in the README — default all-rights-reserved; no redistribution grant.",
    license: "Unlicensed (no LICENSE file)",
    licenseSource:
      "repo root — only ProjectSettings/ + Readme.md; no LICENSE file and no license text in Readme.md",
    licenseRestrictions:
      "No redistribution rights. Available via Unity Asset Store; do not mirror publicly.",
    genre: "endless-runner",
    targets: ["webgl", "android", "ios"],
    buildable: true,
    description:
      "Temple-Run-style endless runner sample game by Unity (aka Trash Dash).",
    assetSlots: [],
    stars: 483,
    lastUpstreamActivity: "2026-04-17",
  },
  // --- Unreal: canonical Epic samples — EULA, use via Epic Launcher / Fab ---
  {
    id: "ue-lyra",
    name: "Lyra Starter Game",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "https://dev.epicgames.com/documentation/unreal-engine/lyra-sample-game-in-unreal-engine",
    fork: null,
    forkReason:
      "Epic Content License / Unreal EULA — distributed via Fab & the Epic Launcher, not redistributable to a public GitHub org.",
    license: "Unreal Engine EULA",
    licenseSource: "Unreal Engine EULA (dev.epicgames.com/eula) — Epic Fab/Launcher listing",
    licenseRestrictions:
      "Use via Epic Launcher/Fab only. The reference modern-UE5 multiplayer shooter framework (GAS, GameFeatures, Enhanced Input).",
    genre: "fps-framework",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Epic's flagship sample: a modular multiplayer arena/FPS demonstrating current best-practice UE5 architecture.",
    assetSlots: [],
    stars: null,
    lastUpstreamActivity: null,
  },
  {
    id: "ue-city-sample",
    name: "City Sample (The Matrix Awakens)",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "https://dev.epicgames.com/documentation/unreal-engine/city-sample-project-unreal-engine-demonstration",
    fork: null,
    forkReason:
      "Epic Content License / Unreal EULA — distributed via Fab, not redistributable to a public org.",
    license: "Unreal Engine EULA",
    licenseSource: "Unreal Engine EULA (dev.epicgames.com/eula) — Epic Fab listing",
    licenseRestrictions:
      "Use via Fab only. Open-world city + vehicle traversal reference (Nanite, Lumen, MetaHuman crowds).",
    genre: "open-world-driving",
    targets: ["windows"],
    buildable: true,
    description:
      "The Matrix Awakens open-world city demo — large-scale streaming, vehicles, and crowd systems.",
    assetSlots: [],
    stars: null,
    lastUpstreamActivity: null,
  },
  {
    id: "ue-stack-o-bot",
    name: "Stack-O-Bot",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "https://dev.epicgames.com/community/learning/tutorials/RJ3/stack-o-bot",
    fork: null,
    forkReason:
      "Epic Content License / Unreal EULA — distributed via Fab, not redistributable to a public org.",
    license: "Unreal Engine EULA",
    licenseSource: "Unreal Engine EULA (dev.epicgames.com/eula) — Epic Fab listing",
    licenseRestrictions: "Use via Fab only. Small, complete, approachable UE sample.",
    genre: "3d-platformer",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Epic's small open 3D platformer sample — a robot navigating a puzzle world; ideal minimal reference.",
    assetSlots: [],
    stars: null,
    lastUpstreamActivity: null,
  },
  {
    id: "ue-shootergame",
    name: "ShooterGame",
    engine: "unreal",
    engineVersion: "4.x",
    upstream: "https://dev.epicgames.com/documentation/unreal-engine/sample-game-projects",
    fork: null,
    forkReason:
      "Epic sample under the Unreal EULA; historically required EpicGames GitHub org access — not redistributable to a public org.",
    license: "Unreal Engine EULA",
    licenseSource: "Unreal Engine EULA (dev.epicgames.com/eula) — Epic sample projects",
    licenseRestrictions: "Use via Epic Launcher only.",
    genre: "fps",
    targets: ["windows", "mac", "linux"],
    buildable: true,
    description:
      "Epic's classic first-person multiplayer shooter sample (predecessor reference to Lyra).",
    assetSlots: [],
    stars: null,
    lastUpstreamActivity: null,
  },
  {
    id: "ue-action-rpg-epic",
    name: "Action RPG (Epic sample)",
    engine: "unreal",
    engineVersion: "5.x",
    upstream: "https://dev.epicgames.com/documentation/unreal-engine/sample-game-projects",
    fork: null,
    forkReason:
      "Epic sample under the Unreal EULA; distributed via Epic Launcher/Fab — not redistributable to a public org.",
    license: "Unreal Engine EULA",
    licenseSource: "Unreal Engine EULA (dev.epicgames.com/eula) — Epic sample projects",
    licenseRestrictions: "Use via Epic Launcher/Fab only.",
    genre: "action-rpg",
    targets: ["windows", "mac", "android", "ios"],
    buildable: true,
    description:
      "Epic's hack-and-slash Action RPG sample (originally a mobile showcase) demonstrating GAS and ability data.",
    assetSlots: [],
    stars: null,
    lastUpstreamActivity: null,
  },
];

// =============================================================================
// CATALOG + DERIVED VIEWS (DRY — derive, never duplicate)
// =============================================================================

export const gamesCatalog: GameEntry[] = [
  ...unityForked,
  ...unrealForked,
  ...referenceOnly,
];

export const unityGames = gamesCatalog.filter((g) => g.engine === "unity");
export const unrealGames = gamesCatalog.filter((g) => g.engine === "unreal");

/** Games mirrored into the hanzoai org (license permits redistribution). */
export const forkedGames = gamesCatalog.filter((g) => g.fork !== null);

/** Games we may NOT mirror — listed for reference with a documented reason. */
export const referenceGames = gamesCatalog.filter((g) => g.fork === null);

/** Games that can build to WebGL (browser-playable). */
export const webglGames = gamesCatalog.filter((g) =>
  g.targets.includes("webgl"),
);

export interface GameGenreGroup {
  genre: string;
  games: GameEntry[];
}

/** Group the catalog by genre for gallery rendering. */
export function groupByGenre(entries: GameEntry[]): GameGenreGroup[] {
  const byGenre = new Map<string, GameEntry[]>();
  for (const g of entries) {
    const bucket = byGenre.get(g.genre) ?? [];
    bucket.push(g);
    byGenre.set(g.genre, bucket);
  }
  return [...byGenre.entries()]
    .map(([genre, games]) => ({ genre, games }))
    .sort((a, b) => a.genre.localeCompare(b.genre));
}

// =============================================================================
// SURFACE HELPERS — link contracts + in-browser play (for the /games UI)
// =============================================================================

/** Genres for the filter bar: distinct, sorted, "All" first. */
export function genreList(entries: GameEntry[] = gamesCatalog): string[] {
  return ["All", ...groupByGenre(entries).map((g) => g.genre)];
}

/** Look up one title by id. */
export function getGame(id: string): GameEntry | undefined {
  return gamesCatalog.find((g) => g.id === id);
}

/**
 * Titles with a WebGL build (or a placeholder harness) hosted under
 * /webgl/<id>/ and thus playable in-browser right now. Kept explicit — a game
 * being webgl-capable (targets.includes("webgl")) does NOT imply an artifact is
 * hosted yet. See public/webgl/README.md for the CI drop contract.
 */
export const hostedWebglBuilds = new Set<string>(["unity-red-runner"]);

/** Where a title's hosted WebGL build (or its placeholder) is served. */
export function webglBuildPath(id: string): string {
  return `/webgl/${id}/index.html`;
}

/** True when the title can be played in-browser now (real or placeholder). */
export function isPlayable(game: GameEntry): boolean {
  return game.targets.includes("webgl") && hostedWebglBuilds.has(game.id);
}

/**
 * Of the hosted builds, those still served by the placeholder harness rather
 * than a real engine export. CI flips these to real by dropping the export and
 * removing the id here (see public/webgl/README.md).
 */
export const placeholderWebglBuilds = new Set<string>(["unity-red-runner"]);

export function isPlaceholderBuild(game: GameEntry): boolean {
  return placeholderWebglBuilds.has(game.id);
}

/**
 * A clonable git URL for the builder. Prefer the hanzoai fork, else the
 * upstream; `owner/repo` shorthand expands to github.com, full URLs pass through.
 */
export function gameRepoUrl(game: GameEntry): string {
  const ref = game.fork ?? game.upstream;
  return /^https?:\/\//.test(ref) ? ref : `https://github.com/${ref}`;
}

/** Studio pipeline origin — the generative asset surface (lands separately). */
export const STUDIO_ORIGIN = "https://studio.hanzo.ai";

/**
 * Deep link into the studio generative pipeline, carrying the game id + the
 * asset slots to regenerate. The URL contract the studio side reads.
 */
export function studioHref(game: GameEntry): string {
  const q = new URLSearchParams({ game: game.id });
  if (game.assetSlots.length) q.set("slots", game.assetSlots.join(","));
  return `${STUDIO_ORIGIN}/generate?${q.toString()}`;
}

/**
 * Route an ask into the existing builder with the game's repo as context.
 * `/dev` accepts `?repo=<gitUrl>&prompt=<seed>` (parseGitUrl -> clone), so this
 * is the real generative-builder hook, not dead UI.
 */
export function builderHref(game: GameEntry, ask: string): string {
  const q = new URLSearchParams({ repo: gameRepoUrl(game), prompt: ask, action: "edit" });
  return `/dev?${q.toString()}`;
}
