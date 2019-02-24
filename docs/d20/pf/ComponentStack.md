# PF Component Stack

## Components

- Statistics Block (`PF.StatisticsBlock`)
  - Str/Dex/Con/Int/Wis/Cha
  - `generate`: Generate with Dice roll.
- Creature
  - Health
    - Current Health
      - `heal`
      - `damage`
    - Maximum Health
      - Either computed or explicitly set.
  - Action Tracking
    - Part of the high-level interface used to interact and control actions.
  - Skills
    - Stored as data rather then hard-coded.
  - Movement
    - Attached to world level physics system governing movement rules.
  - Initiative
  - Armor Class
  - Basic Combat calculation
  - Size
  - Alignment
- Feats
  - Each it's own component deriving from a base class `PF.Feat`.
  - Eventually the intent is most feats can be expressed without writing code.
- Actions
  - Both players and monsters use the same system. Players derive actions
    from items while monsters may use them directly.
  - Melee Attacks
  - Ranged Attacks
  - Special Actions
- Monster
- Player
  - Ability Allocation
  - Leveling/Exp
    - Leveling
  - Death Mechanics
- Player Race/Heritage
  - Not strictly restricted to players.
  - Actions
- Player Class
  - Actions
  - Modifiers
- Player Subclasses
  - Actions
- Inventory
  - Currency
  - Weapons
  - Armor
  - Magic Items
- Spellcasting
  - Spell Slots
  - Spell Book
  - Preparation

## Player Character

- Statistics Block
- Creature
- Feats
- Player
- Player Race/Heritage
- Player Class
- Inventory
- Spells

# Monster

- Statistics Block
- Creature
- Monster
- Actions