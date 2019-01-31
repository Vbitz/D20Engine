import * as common from '../frontendCommon/common';
import * as rendererCommon from '../frontendCommon/renderer';

type ChildType = HTMLElement | string;

function createElement(factory: string, fields: common.Bag<string> | null, ...children: Array<ChildType | ChildType[]>) {
  console.log(arguments);
  let ele: HTMLElement;

  if (typeof factory === "string") {
    ele = document.createElement(factory);
  }

  if (fields !== null) {
    for (const fieldName of Object.keys(fields)) {
      if (fieldName === "htmlFor") {
        ele.setAttribute("for", fields[fieldName]);
      } else if (fieldName === "className") {
        ele.setAttribute("class", fields[fieldName]);
      } else {
        ele.setAttribute(fieldName, fields[fieldName]);
      }
    }
  }

  function addChild(child: ChildType) {
    if (child instanceof HTMLElement) {
      ele.appendChild(child);
    } else {
      ele.appendChild(document.createTextNode(child));
    }
  }

  for (const child of children) {
    if (Array.isArray(child)) {
      for (const subChild of child) {
        addChild(subChild);
      }
    } else {
      addChild(child);
    }
  }

  return ele;
}

class FrontendController {
  private _mainElement: HTMLDivElement | null = null;

  protected get mainElement(): HTMLDivElement {
    return this._mainElement || common.expect();
  }

  attach(frontendMain: HTMLDivElement) {
    this._mainElement = frontendMain;
  }

  run() { }
}

class FrontendTest extends FrontendController {
  run() {
    super.run();

    const spec: rendererCommon.ComponentSpecification = {
      "name": "CreatureParameters",
      "fields": [
        {
          "name": "size",
          "type": {
            "type": 3,
            "members": {
              "Medium": "d20.fifth.size.medium"
            }
          }
        },
        {
          "name": "type",
          "type": {
            "type": 3,
            "members": {
              "Humanoid": "d20.fifth.creatureSize.humanoid"
            }
          }
        },
        {
          "name": "armorClass",
          "type": {
            "type": 2
          }
        },
        {
          "name": "hitPointsRoll",
          "type": {
            "type": 4
          }
        },
        {
          "name": "speed",
          "type": {
            "type": 2
          }
        },
        {
          "name": "strength",
          "type": {
            "type": 2
          }
        },
        {
          "name": "dexterity",
          "type": {
            "type": 2
          }
        },
        {
          "name": "constitution",
          "type": {
            "type": 2
          }
        },
        {
          "name": "intelligence",
          "type": {
            "type": 2
          }
        },
        {
          "name": "wisdom",
          "type": {
            "type": 2
          }
        },
        {
          "name": "charisma",
          "type": {
            "type": 2
          }
        },
        {
          "name": "passivePerception",
          "type": {
            "type": 2
          }
        }
      ]
    };

    const ele = <form>
      <div className="heading">
        <h1>{spec.name}</h1>
      </div>

      {spec.fields.map((field) => {
        let control: HTMLElement;

        if (field.type.type === rendererCommon.PublicFieldType.String) {

          control = <input type="text" name={field.name} id={field.name} />;


        } else if (field.type.type === rendererCommon.PublicFieldType.Boolean) {
          control = <input type="checkbox" name={field.name} id={field.name} />;

        } else if (field.type.type === rendererCommon.PublicFieldType.Enum) {

          const members = field.type.members;

          control = <select name={field.name} id={field.name}>{
            Object.keys(members).map((memberName) =>
              <option value={members[memberName]}>{memberName}</option>
            )
          }</select>;

        } else if (field.type.type === rendererCommon.PublicFieldType.Number) {

          control = <input type="number" name={field.name} id={field.name} />;

        } else if (field.type.type === rendererCommon.PublicFieldType.DiceRoll) {

          control = <input type="text" name={field.name} id={field.name} />;

        }

        return <div className="field">
          <div className="fieldName">{field.name}</div>
          {control}
        </div>;
      })}
    </form>;

    this.mainElement.appendChild(ele);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const frontend = new FrontendTest();

  frontend.attach(document.querySelector('#frontendMain') || common.expect());

  frontend.run();
});