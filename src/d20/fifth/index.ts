// Enums are prioritized since they are needed for component decorators. The
// unusual syntax prevents issues with formatting.
import {Challenge} from 'd20/fifth/enum/challenge';
import {CreatureType, Size} from 'd20/fifth/enum/creature';
import {DamageType} from 'd20/fifth/enum/damage';
import {NPCInstance} from 'd20/fifth/enum/npc';

import * as Combat from './combat';
import * as BasicMonsterAI from './component/basicMonsterAI';
import * as Creature from './component/creature';
import * as MeleeAttackAction from './component/meleeAttackAction';
import * as Monster from './component/monster';
import * as MonsterRegistry from './registry/monster_registry';

export {
  BasicMonsterAI,
  Challenge,
  Combat,
  Creature,
  CreatureType,
  DamageType,
  MeleeAttackAction,
  Monster,
  MonsterRegistry,
  NPCInstance,
  Size
};
