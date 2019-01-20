DiceRoll = Operation

Operation "op"
	= head:Drop tail:(("+"/"-") Drop)* {
    	return tail.reduce((prev, next) => {
        	return {kind: "op", lhs: prev, op: next[0], rhs: next[1]};
        }, head);
    }

Drop "drop"
	= "drop(" roll:Roll "," type:("+"/"-") count:Integer ")" {
    	return {kind: "drop", roll, type: type == "+" ? "high" : "low", count};
    }
    / Roll

Roll "roll"
	= count:Integer "d" type:Integer {
    	return {kind: "roll", count, type};
      }
    / "d" type:Integer {
    	return {kind: "roll", count: 1, type};
      }
    / Const
      
Const "const"
	= value:Integer {
    	return {kind: "const", value};
    }

Integer "integer"
	= [0-9]+ { return parseInt(text(), 10); }