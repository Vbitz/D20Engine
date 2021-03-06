- [ ] Add previous parameter to event callbacks and convert event calls into a reduce type pattern.
- [x] Rename `ComponentParameters` to `Object` and `Component.parameters` to `Component.state`.
  - Name collisions turn out to be non trivial to resolve.
  - `StatefulObject` instead.
- [ ] Add saving system.
- [x] Add graph renderer.
- [ ] Add `GameState` to keep track of the current context object.
- [ ] Add Testing framework for RPCs.
- [ ] Add RPC Response system and start working on game user interface.
  - How is this system going to be stubbed for testing and AI?
- [ ] Add test cases for Pathfinder Character Tracking
    - [ ] Fighter/Barbarian (Not sure which one first)
- [ ] `d20 version` should link to github.
- [ ] Start adding aliases for commands. `?` would be a good one for `help`.
- [ ] Add `Entity.clone()` (Soft requires save and load system.)
- [x] `PF.StatisticsBlock` should have a roll stats method.
  - Also added a reroll method and tracking of how many rolls were done.
- [ ] `Game.Property` should be split into a getter and setter implementation.
- [ ] Transition all Discord commands to the new RPC system. This meens the RPC server will be the top level.
- [ ] Lock down public interfaces.
  - `Entity.addComponent(ctx, comp)` should turn into `Context.addComponent(ent, comp)`.
- [ ] Add global describe event.
- [ ] There should be differentiation between global events and entity events. It's too easy to mix up the method calls.
- [x] `Core.StatefulObject` should be another `ComplexPrimitiveValue` as they can be serialized.
- [ ] Write `Core.StatefulObject.inspect` which uses reflection metadata.