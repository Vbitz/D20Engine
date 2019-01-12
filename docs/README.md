# D20 Engine

[Prototype](./prototype.md)

## Goals

- Implement D20 based rulesets in an extendable way.
- Favor accuracy to the original rulesets over gameplay.

### Non-Goals

- Fancy Graphics (Initially).

## Roadmap

- [ ] Basic Combat Engine for fights between 2 AI-controlled monsters.
- [ ] External User Interface.
  - Discord Bot.
- [ ] Player Character Creation.
  - Connected to the combat system as custom monsters.
- [ ] Player-controlled Custom Characters.


## License

### `/src/` - Main Engine Source Code and `/scripts/base/` - Engine Scripting Code

```
Copyright 2019 Joshua Scarsbrook

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### `/scripts/d20/` - Game mechanics implementation

The scripts are derivative works from D20 SRDs so are therefore licensed under [Open Game License](scripts/d20/OGLv1.0a.md).