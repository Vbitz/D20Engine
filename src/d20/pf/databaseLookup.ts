import * as Core from 'core';
import * as PF from 'd20/pf';

import * as path from 'path';
import TurndownService from 'turndown';

export class DatabaseLookupParameters extends Core.ComponentParameters {}

interface Monster {
  Name: string;
  CR: string;
  XP: string;
  Race: string;
  Class: string;
  MonsterSource: string;
  Alignment: string;
  Size: string;
  Type: string;
  SubType: string;
  Init: string;
  Senses: string;
  Aura: string;
  AC: string;
  AC_Mods: string;
  HP: string;
  HD: string;
  HP_Mods: string;
  Saves: string;
  Fort: string;
  Ref: string;
  Will: string;
  Save_Mods: string;
  DefensiveAbilities: string;
  DR: string;
  Immune: string;
  Resist: string;
  SR: string;
  Weaknesses: string;
  Speed: string;
  Speed_Mod: string;
  Melee: string;
  Ranged: string;
  Space: string;
  Reach: string;
  SpecialAttacks: string;
  SpellLikeAbilities: string;
  SpellsKnown: string;
  SpellsPrepared: string;
  SpellDomains: string;
  AbilityScores: string;
  AbilityScore_Mods: string;
  BaseAtk: string;
  CMB: string;
  CMD: string;
  Feats: string;
  Skills: string;
  RacialMods: string;
  Languages: string;
  SQ: string;
  Environment: string;
  Organization: string;
  Treasure: string;
  Description_Visual: string;
  Group: string;
  Source: string;
  IsTemplate: string;
  SpecialAbilities: string;
  Description: string;
  FullText: string;
  Gender: string;
  Bloodline: string;
  ProhibitedSchools: string;
  BeforeCombat: string;
  DuringCombat: string;
  Morale: string;
  Gear: string;
  OtherGear: string;
  Vulnerability: string;
  Note: string;
  CharacterFlag: string;
  CompanionFlag: string;
  Fly: string;
  Climb: string;
  Burrow: string;
  Swim: string;
  Land: string;
  TemplatesApplied: string;
  OffenseNote: string;
  BaseStatistics: string;
  ExtractsPrepared: string;
  AgeCategory: string;
  DontUseRacialHD: string;
  VariantParent: string;
  Mystery: string;
  ClassArchetypes: string;
  Patron: string;
  CompanionFamiliarLink: string;
  FocusedSchool: string;
  Traits: string;
  AlternateNameForm: string;
  StatisticsNote: string;
  LinkText: string;
  id: string;
  UniqueMonster: string;
  MR: string;
  Mythic: string;
  MT: string;
}

interface Spell {
  name: string;
  school: string;
  subschool: string;
  descriptor: string;
  spell_level: string;
  casting_time: string;
  components: string;
  costly_components: string;
  range: string;
  area: string;
  effect: string;
  targets: string;
  duration: string;
  dismissible: string;
  shapeable: string;
  saving_throw: string;
  spell_resistence: string;
  description: string;
  description_formated: string;
  source: string;
  full_text: string;
  verbal: string;
  somatic: string;
  material: string;
  focus: string;
  divine_focus: string;
  sor: string;
  wiz: string;
  cleric: string;
  druid: string;
  ranger: string;
  bard: string;
  paladin: string;
  alchemist: string;
  summoner: string;
  witch: string;
  inquisitor: string;
  oracle: string;
  antipaladin: string;
  magus: string;
  adept: string;
  deity: string;
  SLA_Level: string;
  domain: string;
  short_description: string;
  acid: string;
  air: string;
  chaotic: string;
  cold: string;
  curse: string;
  darkness: string;
  death: string;
  disease: string;
  earth: string;
  electricity: string;
  emotion: string;
  evil: string;
  fear: string;
  fire: string;
  force: string;
  good: string;
  language_dependent: string;
  lawful: string;
  light: string;
  mind_affecting: string;
  pain: string;
  poison: string;
  shadow: string;
  sonic: string;
  water: string;
  linktext: string;
  id: string;
  material_costs: string;
  bloodline: string;
  patron: string;
  mythic_text: string;
  augmented: string;
  mythic: string;
  bloodrager: string;
  shaman: string;
  psychic: string;
  medium: string;
  mesmerist: string;
  occultist: string;
  spiritualist: string;
  skald: string;
  investigator: string;
  hunter: string;
  haunt_statistics: string;
  ruse: string;
  draconic: string;
  meditative: string;
  summoner_unchained: string;
}

interface MagicItem {
  Name: string;
  Aura: string;
  CL: string;
  Slot: string;
  Price: string;
  Weight: string;
  Description: string;
  Requirements: string;
  Cost: string;
  Group: string;
  Source: string;
  AL: string;
  Int: string;
  Wis: string;
  Cha: string;
  Ego: string;
  Communication: string;
  Senses: string;
  Powers: string;
  MagicItems: string;
  FullText: string;
  Destruction: string;
  MinorArtifactFlag: string;
  MajorArtifactFlag: string;
  Abjuration: string;
  Conjuration: string;
  Divination: string;
  Enchantment: string;
  Evocation: string;
  Necromancy: string;
  Transmutation: string;
  AuraStrength: string;
  WeightValue: string;
  PriceValue: string;
  CostValue: string;
  Languages: string;
  BaseItem: string;
  LinkText: string;
  id: string;
  Mythic: string;
  LegendaryWeapon: string;
  Illusion: string;
  Universal: string;
  Scaling: string;
}

interface Feat {
  id: string;
  name: string;
  type: string;
  description: string;
  prerequisites: string;
  prerequisite_feats: string;
  benefit: string;
  normal: string;
  special: string;
  source: string;
  fulltext: string;
  teamwork: string;
  critical: string;
  grit: string;
  style: string;
  performance: string;
  racial: string;
  companion_familiar: string;
  race_name: string;
  note: string;
  goal: string;
  completion_benefit: string;
  multiples: string;
  suggested_traits: string;
  prerequisite_skills: string;
  panache: string;
  betrayal: string;
  targeting: string;
  esoteric: string;
  stare: string;
  weapon_mastery: string;
  item_mastery: string;
  armor_mastery: string;
  shield_mastery: string;
  blood_hex: string;
  trick: string;
}

enum RenderType {
  List,
  Short,
  Full
}

// tslint:disable-next-line:no-any
type RenderCallback = (type: RenderType, arg: any) => string;

export class DatabaseLookup extends Core.Component<DatabaseLookupParameters> {
  private db = new Core.Database.Database();

  private turndownService =
      new TurndownService({bulletListMarker: '-', codeBlockStyle: 'fenced'});

  constructor() {
    super(new DatabaseLookupParameters());

    // Discord doesn't support heading or rules so disable them in turndown.
    this.turndownService.addRule('discord', {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'hr'],
      replacement: (content) => `${content}\n`
    });
  }

  async onCreate(ctx: Core.Context) {
    try {
      await this.db.loadSqlite(path.join(
          await Core.getResourcePath(), 'restricted', 'pathfinder', 'database',
          'pathfinder.db'));

      this.addRPCMarshal(
          'spell', 'get <name> -full | search <name> : Search for a spell.',
          this.handleRPC.bind(
              this, {name: 'spells', nameColumn: 'name'}, this.renderSpell));

      this.addRPCMarshal(
          'magicItem',
          'get <name> -full | search <name> : Search for a magic item.',
          this.handleRPC.bind(
              this, {name: 'magic_items', nameColumn: 'Name'},
              this.renderMagicItem));

      this.addRPCMarshal(
          'monster', 'get <name> -full | search <name> : Search for a monster.',
          this.handleRPC.bind(
              this, {name: 'monsters', nameColumn: 'Name'},
              this.renderMonster));

      this.addRPCMarshal(
          'feat', 'get <name> -full | search <name> : Search for a feat.',
          this.handleRPC.bind(
              this, {name: 'feats', nameColumn: 'name'}, this.renderFeat));
    } catch (err) {
      console.error(
          '[d20.pf.DatabaseLookup] Database not Available. Not registering commands.');
    }
  }

  private async handleRPC(
      tableSpec: Core.Database.TableSpecification, renderer: RenderCallback,
      ctx: Core.Context, rpcCtx: Core.RPC.Context,
      chain: Core.Value[]): Promise<void> {
    console.log(tableSpec, chain);

    if (chain.length < 2) {
      throw new Core.RPC.MarshalUsageError('get <name> -full | search <name>');
    }

    const [firstValue, name, ...rest] = chain;

    let nameValue = '';

    if (typeof (name) === 'string') {
      nameValue = name;
    } else {
      throw new Error('Not Implemented');
    }

    if (firstValue === 'get') {
      // tslint:disable-next-line:no-any
      const row = await this.db.get<any>(tableSpec, nameValue);

      if (row === undefined) {
        await rpcCtx.reply(`Spell not found: ${nameValue}`);
      } else {
        if (rest.length >= 1 && rest[0] === '-full') {
          await rpcCtx.reply(renderer.call(this, RenderType.Full, row));
        } else {
          await rpcCtx.reply(renderer.call(this, RenderType.Short, row));
        }
      }
    } else if (firstValue === 'search') {
      const rows = await this.db.search(tableSpec, nameValue);

      let reply = '';

      for (const row of rows) {
        reply += renderer.call(this, RenderType.List, row) + '\n';
      }

      await rpcCtx.reply(`\`\`\`
${reply}
\`\`\``);
    }
  }

  private renderMonster(type: RenderType, monster: Monster): string {
    if (type === RenderType.List) {
      return `${monster.Name.padEnd(30)} | CR ${monster.CR}`;
    } else if (type === RenderType.Full) {
      return this.turndownService.turndown(monster.FullText);
    } else if (type === RenderType.Short) {
      return `**${monster.Name}**
${monster.Alignment} ${monster.Size} ${monster.Type} ${monster.SubType}
**CR** ${monster.CR} | **Init** ${monster.Init} | **Senses** ${monster.Senses}

**AC** ${monster.AC}
**HP** ${monster.HP} ${monster.HD}
**Fort** ${monster.Fort} | **Ref** ${monster.Ref} | **Will** ${monster.Will} ${
          monster.Save_Mods}

**Speed** ${monster.Speed}
**Melee** ${monster.Melee}
**Ranged** ${monster.Ranged}

${monster.AbilityScores}
**Base Atk** ${monster.BaseAtk} | **CMB** ${monster.CMB} | **CMD** ${
          monster.CMD}
**Feats** ${monster.Feats}
**Skills** ${monster.Skills}
**Languages** ${monster.Languages}

**Source** ${monster.Source}

**Use \`d20 pf lookup monster get "${
          monster.Name}" -full\` for full details.**`;
    } else {
      throw new Error('Not Implemented');
    }
  }

  private renderMagicItem(type: RenderType, magicItem: MagicItem): string {
    if (type === RenderType.List) {
      return `${magicItem.Name.padEnd(30)} | CL${
          magicItem.CL.padEnd(6)} | Price ${magicItem.Price}`;
    } else if (type === RenderType.Full) {
      return this.turndownService.turndown(magicItem.FullText);
    } else if (type === RenderType.Short) {
      return `**${magicItem.Name}**

**Aura** ${magicItem.Aura} | **CL** ${magicItem.CL} | **Weight** ${
          magicItem.Weight} | **Price** ${magicItem.Price}

**Construction Requirements** ${magicItem.Requirements} | **Cost** ${
          magicItem.Cost}

**Source** ${magicItem.Source}

**Use \`d20 pf lookup magicItem get "${
          magicItem.Name}" -full\` for full details.**`;
    } else {
      throw new Error('Not Implemented');
    }
  }

  private renderSpell(type: RenderType, spell: Spell): string {
    if (type === RenderType.List) {
      return `${spell.name.padEnd(30)} | ${spell.school.padEnd(15)} | ${
          spell.spell_level}`;
    } else if (type === RenderType.Full) {
      return this.turndownService.turndown(spell.full_text);
    } else if (type === RenderType.Short) {
      return `**${spell.name}**

**School** ${spell.school} | **Level** ${spell.spell_level} | **Domain** ${
          spell.domain}

**Casting Time** ${spell.casting_time}
**Components** ${spell.components}

**Range** ${spell.range} | **Area** ${spell.area}
**Duration** ${spell.duration}
**Saving Throw** ${spell.saving_throw} | **Spell Resistance** ${
          spell.spell_resistence}

**Description** ${spell.short_description}

**Source** ${spell.source}

**Use \`d20 pf lookup spell get "${spell.name}" -full\` for full details.**`;
    } else {
      throw new Error('Not Implemented');
    }
  }

  private renderFeat(type: RenderType, feat: Feat): string {
    if (type === RenderType.List) {
      return `${feat.name.padEnd(30)} | ${feat.type}`;
    } else if (type === RenderType.Full) {
      return this.turndownService.turndown(feat.fulltext);
    } else if (type === RenderType.Short) {
      return `**${feat.name}**

**Type** ${feat.type} | **Prerequisites** ${feat.prerequisites}

**Description** ${feat.description}

**Source** ${feat.source}

**Use \`d20 pf lookup feat get "${feat.name}" -full\` for full details.**`;
    } else {
      throw new Error('Not Implemented');
    }
  }
}