DiceRoll = Operation

Operation "op"
	= head:Function _ tail:(op:("+"/"-") _ rhs:Function)* {
    	return tail.reduce((prev, next) => {
        	return {kind: "op", lhs: prev, op: next[0], rhs: next[2]};
        }, head);
    }
    
Function "function"
	= name:FunctionName "(" head:Operation tail:("," _ Operation)* ")" {
    	return {
        	kind: "function",
            name,
            args: [head, ...tail.map((a) => a[2])]
        };
    } / Roll
    
FunctionName
	= "adv"
    / "dis"
    / "repeat"
    / "drop"
    / Macro

Roll "roll"
	= count:Integer "d" type:Integer {
    	return {kind: "roll", count, type};
      }
    / "d" type:Integer {
    	return {kind: "roll", count: 1, type};
      }
    / Template
     
Template "template"
	= "%" id:Integer {
    	return {kind: "template", id};
    }
    / Macro
    
Macro "macro"
	= "$" id:Identifier {
    	return {kind: "macro", id};
    }
    / Offset
    
OffsetType
	= "+"
    / "-"
    
Offset "offset"
	= type:OffsetType value:Integer {
    	return {kind: "offset", type, value}
    } / Const
     
Const "const"
	= value:Integer {
    	return {kind: "const", value};
    }

Integer "integer"
	= [0-9]+ { return parseInt(text(), 10); }
    
Identifier "identifier"
	= [a-z][a-z0-9_]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*