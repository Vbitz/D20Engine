import * as Core from 'core';
import * as PF from 'd20/pf';

import * as path from 'path';
import TurndownService from 'turndown';

class DatabaseLookupParameters extends Core.ComponentParameters {}

enum RenderType {
  List,
  Short,
  Full
}

// tslint:disable-next-line:no-any
type RenderCallback = (type: RenderType, arg: any) => string;

const SPELLS_TABLES = {
  name: 'spells',
  nameColumn: 'name'
};

const MAGIC_ITEMS_TABLE = {
  name: 'magic_items',
  nameColumn: 'Name'
};

const MONSTERS_TABLE = {
  name: 'monsters',
  nameColumn: 'Name'
};

const FEATS_TABLE = {
  name: 'feats',
  nameColumn: 'name'
};

export class DatabaseLookup extends Core.Component<DatabaseLookupParameters> {
  static readonly Parameters = DatabaseLookupParameters;

  private db = new Core.Database.Database();

  static readonly getSpells = new Core.Event<() => PF.Database.Spell[]>();
  static readonly getMagicItems =
      new Core.Event<() => PF.Database.MagicItem[]>();
  static readonly getMonsters = new Core.Event<() => PF.Database.Monster[]>();
  static readonly getFeats = new Core.Event<() => PF.Database.Feat[]>();

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
          this.handleRPC.bind(this, SPELLS_TABLES, this.renderSpell));

      this.addRPCMarshal(
          'magicItem',
          'get <name> -full | search <name> : Search for a magic item.',
          this.handleRPC.bind(this, MAGIC_ITEMS_TABLE, this.renderMagicItem));

      this.addRPCMarshal(
          'monster', 'get <name> -full | search <name> : Search for a monster.',
          this.handleRPC.bind(this, MONSTERS_TABLE, this.renderMonster));

      this.addRPCMarshal(
          'feat', 'get <name> -full | search <name> : Search for a feat.',
          this.handleRPC.bind(this, FEATS_TABLE, this.renderFeat));

      this.registerHandler(
          DatabaseLookup.getSpells,
          async (ctx) =>
              await this.db.getRows<PF.Database.Spell>(SPELLS_TABLES));

      this.registerHandler(
          DatabaseLookup.getMagicItems,
          async (ctx) =>
              await this.db.getRows<PF.Database.MagicItem>(MAGIC_ITEMS_TABLE));

      this.registerHandler(
          DatabaseLookup.getMonsters,
          async (ctx) =>
              await this.db.getRows<PF.Database.Monster>(MONSTERS_TABLE));

      this.registerHandler(
          DatabaseLookup.getFeats,
          async (ctx) => await this.db.getRows<PF.Database.Feat>(FEATS_TABLE));
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

  private renderMonster(type: RenderType, monster: PF.Database.Monster):
      string {
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

  private renderMagicItem(type: RenderType, magicItem: PF.Database.MagicItem):
      string {
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

  private renderSpell(type: RenderType, spell: PF.Database.Spell): string {
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

  private renderFeat(type: RenderType, feat: PF.Database.Feat): string {
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