# Engine Prototype Notes

## `/scripts/core/entity.ts`

```typescript
export class Entity {

}
```

## `/scripts/core/component.ts`

```typescript
import * as core from "core";

export interface CreateParameters {

}

export abstract class Component<Params extends CreateParameters> {
  readonly state: Params;

  template(params: Params): core.EntityConstructor {
    class Entity extends core.Entity {
      create() {
        super.create(params);
      }
    }
    return Entity;
  }
}
```

## `/scripts/d20/component/creature.ts`

```typescript
import * as core from "core";
import * as d20 from "d20";

interface CreatureCreateParameters extends core.CreateParameters {
  /**
   * Supplying an armor class will force one rather then calculating
   * based on inventory.
   */
  armorClass?: number,
  
  hitPoints: () => core.DiceRollAction,
  
  /** Measured in feet/turn. */
  speed: number,

  strength: number,
  dexterity: number,
  constitution: number,
  intelligence: number,
  wisdom: number,
  charisma: number,
  
  passivePerception?: number,

  languages?: d20.Language[]
}

// I should be able to abuse Proxies and TypeScript to clean up the
// interface.
@ requireComponent(d20.component.SizeType)
class Creature extends core.Component<CreatureCreateParameters> {
  
  get strengthMod() {
    return Math.floor(this.state.strength / 2);
  }

  get dexterityMod() {
    return Math.floor(this.state.dexterity / 2);
  }

  get constitutionMod() {
    return Math.floor(this.state.constitution / 2);
  }

  get intelligenceMod() {
    return Math.floor(this.state.intelligence / 2);
  }

  get wisdomMod() {
    return Math.floor(this.state.wisdom / 2);
  }

  get charismaMod() {
    return Math.floor(this.state.charisma / 2);
  }
}
```

## `/scripts/d20/creature/CR0_Commoner.ts`

```typescript
import * as core from 'core';
import * as d20 from 'd20';

export core.Entity.template({
  displayName: "Commoner",
  // Is there some way this could be validated.
  // Something like @requireComponent(d20.Component.SizeType) may work.
  components: [
    // Could this component be added to creature?
    // Or is this something that could be generalized to an object level.
    d20.component.SizeType.template({
      size: d20.Size.Medium,
      type: d20.Type.Humanoid
    }),
    // This seems well defined but I don't like exactly how it's defined.
    d20.component.Creature.template({
      armorClass: 10,
      hitPoints() {
        return core.roll("1d8");
      },
      speed: 30,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      passivePerception: 10
    }),
    // As well as controlling random generation this is used for experience
    // values.
    d20.component.Monster.template({
      challenge: 0
    }),
    // What happens when there are a lot of theses. Is there reason to
    // say that monsters have an inventory?
    // The disadvantage of that is monster weapons are much simpler
    // then player weapons and may be incompatible.
    d20.component.MeleeWeapon.template({
      id: "default",
      displayName: "Club",
      hitBonus: +2,
      reach: 5,
      hitDamage() {
        return d20.damageRoll("1d4", d20.DamageType.Bludgeoning);
      }
    })
  ]
});
```