DiceRoll = Operation

Operation "op"
	= head:Repeat tail:(("+"/"-") Repeat)* {
    	return tail.reduce((prev, next) => {
        	return {kind: "op", lhs: prev, op: next[0], rhs: next[1]};
        }, head);
    }
    
Repeat "repeat"
	= "repeat(" op:Operation "," _ count:Integer ")" {
    	return {kind: "repeat", op, count};
    }
    / Drop

Drop "drop"
	= "drop(" roll:Roll "," _ type:("+"/"-") count:Integer ")" {
    	return {kind: "drop", roll, type: type == "+" ? "high" : "low", count};
    }
    / Func
    
Func "adv/dis"
	= name:FunctionName "(" roll:Roll ")" {
    	return {kind: "func", name, roll};
    }
    / Roll
    
FunctionName
	= "adv"
    / "dis"

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
    
_ "whitespace"
  = [ \t\n\r]*