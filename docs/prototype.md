# Engine Prototype Notes

## `/scripts/core/context.ts`

```typescript
export class Context {

}
```

## `/scripts/core/entity.ts`

```typescript
export class Entity {

}
```

## `/scripts/core/action.ts`

```typescript
type ResolveMethod<T> = (value?: T | PromiseLike<T>) => void;
type RejectMethod<T> = (reason?: any) => void;
type PromiseExecuter<T> = (resolve: ResolveMethod<T>, reject: RejectMethod<T>) => void) => void;

// To use and return Actions all you need to do use Action in the return
// signature. TypeScript is clever enough to change the underlying
// implementation used.
export class Action<T> extends Promise<T> {
  constructor(executor: PromiseExecuter<T>) {
    // This basic technique could be used to inject Contexts.
    super((resolve, reject) => {
      executor(resolve, reject);
    });
  }
  // TODO(joshua): Method Overrides.
}
```

## `/scripts/core/component.ts`

```typescript
import * as core from "core";

export interface CreateParameters {
  onCreate<T extends Component<CreateParameters>>(this: T): core.Action<void>;
}

export abstract class Component<Params extends CreateParameters> {
  readonly state: Params;

  async create(params: Params): Action<void> {

  }

  // TOOD(joshua) This type signature needs improvement.
  static template<T extends CreateParameters>(params: T): core.EntityConstructor {
    class Component extends core.Component {
      async create(): Action<void> {
        await super.create(params);
      }
    }
    return Component;
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
    return this.getModifier(this.state.strength);
  }

  get dexterityMod() {
    return this.getModifier(this.state.dexterity);
  }

  get constitutionMod() {
    return this.getModifier(this.state.constitution);
  }

  get intelligenceMod() {
    return this.getModifier(this.state.intelligence);
  }

  get wisdomMod() {
    return this.getModifier(this.state.wisdom);
  }

  get charismaMod() {
    return this.getModifier(this.state.charisma);
  }

  private getModifier(score: number) {
    return (score - 10) / 2;
  }
}
```

## `/scripts/d20/creature/monster/CR0_Commoner.ts`

```typescript
import * as core from 'core';
import * as d20 from 'd20';

const CommonerClub = core.Entity.template({
  displayName: "Club",
  components: [
    d20.component.AIWeapon.template({
      id: "commonerClub"
    }),
    d20.component.MonsterWeapon.template({
      hitBonus: +2,
      reach: 5,
      hitDamage() {
        return d20.damageRoll("1d4", d20.DamageType.Bludgeoning);
      }
    })
  ]
});

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
    
    d20.component.HitPoints.template({
      async onCreate(this: d20.component.HitPoints) {
        this.state.maxHitPoints = await d20.roll("2d4");
      }
    }),
    // This seems well defined but I don't like exactly how it's defined.
    d20.component.Creature.template({
      armorClass: 10,
      
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
    // Other monster logic may fit into this component.
    d20.component.Monster.template({
      challenge: 0
    }),
    // What happens when there are a lot of theses. Is there reason to
    // say that monsters have an inventory?
    // The disadvantage of that is monster weapons are much simpler
    // then player weapons and may be incompatible.
    // As items get more complicated a player style inventory seems like
    // a good idea.
    d20.component.Inventory.template({
      // I don't like an explicit populate but I think it's needed due to
      // the entity tempesting structure.
      // It can be generalized though.
      onCreate(this: d20.component.Inventory) {
        this.addItem(CommonerClub);
      }
    }),
    // The controller receives an event when it becomes this entities turn
    // and executes an action in response. In this case it could mean attack
    // an enemy with it's club.
    d20.component.SimpleMonsterController.template({
      attackActions: ["commonerClub"]
    })
  ]
});
```