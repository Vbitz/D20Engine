module.exports = /*
                  * Generated by PEG.js 0.10.0.
                  *
                  * http://pegjs.org/
                  */
    (function() {
      'use strict';

      function peg$subclass(child, parent) {
        function ctor() {
          this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
      }

      function peg$SyntaxError(message, expected, found, location) {
        this.message = message;
        this.expected = expected;
        this.found = found;
        this.location = location;
        this.name = 'SyntaxError';

        if (typeof Error.captureStackTrace === 'function') {
          Error.captureStackTrace(this, peg$SyntaxError);
        }
      }

      peg$subclass(peg$SyntaxError, Error);

      peg$SyntaxError.buildMessage = function(expected, found) {
        var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return '"' + literalEscape(expectation.text) + '"';
          },

          'class': function(expectation) {
            var escapedParts = '', i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array ?
                  classEscape(expectation.parts[i][0]) + '-'
                      + classEscape(expectation.parts[i][1]) :
                  classEscape(expectation.parts[i]);
            }

            return '[' + (expectation.inverted ? '^' : '') + escapedParts + ']';
          },

          any: function(expectation) {
            return 'any character';
          },

          end: function(expectation) {
            return 'end of input';
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

        function hex(ch) {
          return ch.charCodeAt(0).toString(16).toUpperCase();
        }

        function literalEscape(s) {
          return s.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\0/g, '\\0')
              .replace(/\t/g, '\\t')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(
                  /[\x00-\x0F]/g,
                  function(ch) {
                    return '\\x0' + hex(ch);
                  })
              .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
                return '\\x' + hex(ch);
              });
        }

        function classEscape(s) {
          return s.replace(/\\/g, '\\\\')
              .replace(/\]/g, '\\]')
              .replace(/\^/g, '\\^')
              .replace(/-/g, '\\-')
              .replace(/\0/g, '\\0')
              .replace(/\t/g, '\\t')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(
                  /[\x00-\x0F]/g,
                  function(ch) {
                    return '\\x0' + hex(ch);
                  })
              .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
                return '\\x' + hex(ch);
              });
        }

        function describeExpectation(expectation) {
          return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
        }

        function describeExpected(expected) {
          var descriptions = new Array(expected.length), i, j;

          for (i = 0; i < expected.length; i++) {
            descriptions[i] = describeExpectation(expected[i]);
          }

          descriptions.sort();

          if (descriptions.length > 0) {
            for (i = 1, j = 1; i < descriptions.length; i++) {
              if (descriptions[i - 1] !== descriptions[i]) {
                descriptions[j] = descriptions[i];
                j++;
              }
            }
            descriptions.length = j;
          }

          switch (descriptions.length) {
            case 1:
              return descriptions[0];

            case 2:
              return descriptions[0] + ' or ' + descriptions[1];

            default:
              return descriptions.slice(0, -1).join(', ') + ', or '
                  + descriptions[descriptions.length - 1];
          }
        }

        function describeFound(found) {
          return found ? '"' + literalEscape(found) + '"' : 'end of input';
        }

        return 'Expected ' + describeExpected(expected) + ' but '
            + describeFound(found) + ' found.';
      };

      function peg$parse(input, options) {
        options = options !== void 0 ? options : {};

        var peg$FAILED = {},

            peg$startRuleFunctions = {DiceRoll: peg$parseDiceRoll},
            peg$startRuleFunction = peg$parseDiceRoll,

            peg$c0 = peg$otherExpectation('op'), peg$c1 = '+',
            peg$c2 = peg$literalExpectation('+', false), peg$c3 = '-',
            peg$c4 = peg$literalExpectation('-', false),
            peg$c5 =
                function(head, tail) {
              return tail.reduce((prev, next) => {
                return {kind: 'op', lhs: prev, op: next[0], rhs: next[2]};
              }, head);
            },
            peg$c6 = peg$otherExpectation('function'), peg$c7 = '(',
            peg$c8 = peg$literalExpectation('(', false), peg$c9 = ',',
            peg$c10 = peg$literalExpectation(',', false), peg$c11 = ')',
            peg$c12 = peg$literalExpectation(')', false),
            peg$c13 =
                function(name, head, tail) {
              return {
                kind: 'function',
                name,
                args: [head, ...tail.map((a) => a[2])]
              };
            },
            peg$c14 = 'adv', peg$c15 = peg$literalExpectation('adv', false),
            peg$c16 = 'dis', peg$c17 = peg$literalExpectation('dis', false),
            peg$c18 = 'repeat',
            peg$c19 = peg$literalExpectation('repeat', false), peg$c20 = 'drop',
            peg$c21 = peg$literalExpectation('drop', false),
            peg$c22 = peg$otherExpectation('roll'), peg$c23 = 'd',
            peg$c24 = peg$literalExpectation('d', false),
            peg$c25 =
                function(count, type) {
              return {kind: 'roll', count, type};
            },
            peg$c26 =
                function(type) {
              return {kind: 'roll', count: 1, type};
            },
            peg$c27 = peg$otherExpectation('template'), peg$c28 = '%',
            peg$c29 = peg$literalExpectation('%', false),
            peg$c30 =
                function(id) {
              return {kind: 'template', id};
            },
            peg$c31 = peg$otherExpectation('macro'), peg$c32 = '$',
            peg$c33 = peg$literalExpectation('$', false),
            peg$c34 =
                function(id) {
              return {kind: 'macro', id};
            },
            peg$c35 = peg$otherExpectation('offset'),
            peg$c36 =
                function(type, value) {
              return {
                kind: 'offset', type, value
              }
            },
            peg$c37 = peg$otherExpectation('const'),
            peg$c38 =
                function(value) {
              return {kind: 'const', value};
            },
            peg$c39 = peg$otherExpectation('integer'), peg$c40 = /^[0-9]/,
            peg$c41 = peg$classExpectation([['0', '9']], false, false),
            peg$c42 =
                function() {
              return parseInt(text(), 10);
            },
            peg$c43 = peg$otherExpectation('identifier'), peg$c44 = /^[a-z]/,
            peg$c45 = peg$classExpectation([['a', 'z']], false, false),
            peg$c46 = /^[a-z0-9_]/,
            peg$c47 = peg$classExpectation(
                [['a', 'z'], ['0', '9'], '_'], false, false),
            peg$c48 =
                function() {
              return text();
            },
            peg$c49 = peg$otherExpectation('whitespace'),
            peg$c50 = /^[ \t\n\r]/,
            peg$c51 =
                peg$classExpectation([' ', '\t', '\n', '\r'], false, false),

            peg$currPos = 0, peg$savedPos = 0,
            peg$posDetailsCache = [{line: 1, column: 1}], peg$maxFailPos = 0,
            peg$maxFailExpected = [], peg$silentFails = 0,

            peg$result;

        if ('startRule' in options) {
          if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error(
                'Can\'t start parsing from rule "' + options.startRule + '".');
          }

          peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
        }

        function text() {
          return input.substring(peg$savedPos, peg$currPos);
        }

        function location() {
          return peg$computeLocation(peg$savedPos, peg$currPos);
        }

        function expected(description, location) {
          location = location !== void 0 ?
              location :
              peg$computeLocation(peg$savedPos, peg$currPos)

          throw peg$buildStructuredError(
              [peg$otherExpectation(description)],
              input.substring(peg$savedPos, peg$currPos), location);
        }

        function error(message, location) {
          location = location !== void 0 ?
              location :
              peg$computeLocation(peg$savedPos, peg$currPos)

          throw peg$buildSimpleError(message, location);
        }

        function peg$literalExpectation(text, ignoreCase) {
          return {type: 'literal', text: text, ignoreCase: ignoreCase};
        }

        function peg$classExpectation(parts, inverted, ignoreCase) {
          return {
            type: 'class',
            parts: parts,
            inverted: inverted,
            ignoreCase: ignoreCase
          };
        }

        function peg$anyExpectation() {
          return {type: 'any'};
        }

        function peg$endExpectation() {
          return {type: 'end'};
        }

        function peg$otherExpectation(description) {
          return {type: 'other', description: description};
        }

        function peg$computePosDetails(pos) {
          var details = peg$posDetailsCache[pos], p;

          if (details) {
            return details;
          } else {
            p = pos - 1;
            while (!peg$posDetailsCache[p]) {
              p--;
            }

            details = peg$posDetailsCache[p];
            details = {line: details.line, column: details.column};

            while (p < pos) {
              if (input.charCodeAt(p) === 10) {
                details.line++;
                details.column = 1;
              } else {
                details.column++;
              }

              p++;
            }

            peg$posDetailsCache[pos] = details;
            return details;
          }
        }

        function peg$computeLocation(startPos, endPos) {
          var startPosDetails = peg$computePosDetails(startPos),
              endPosDetails = peg$computePosDetails(endPos);

          return {
            start: {
              offset: startPos,
              line: startPosDetails.line,
              column: startPosDetails.column
            },
            end: {
              offset: endPos,
              line: endPosDetails.line,
              column: endPosDetails.column
            }
          };
        }

        function peg$fail(expected) {
          if (peg$currPos < peg$maxFailPos) {
            return;
          }

          if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
          }

          peg$maxFailExpected.push(expected);
        }

        function peg$buildSimpleError(message, location) {
          return new peg$SyntaxError(message, null, null, location);
        }

        function peg$buildStructuredError(expected, found, location) {
          return new peg$SyntaxError(
              peg$SyntaxError.buildMessage(expected, found), expected, found,
              location);
        }

        function peg$parseDiceRoll() {
          var s0;

          s0 = peg$parseOperation();

          return s0;
        }

        function peg$parseOperation() {
          var s0, s1, s2, s3, s4, s5, s6, s7;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = peg$parseFunction();
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = [];
              s4 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 43) {
                s5 = peg$c1;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c2);
                }
              }
              if (s5 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 45) {
                  s5 = peg$c3;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c4);
                  }
                }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseFunction();
                  if (s7 !== peg$FAILED) {
                    s5 = [s5, s6, s7];
                    s4 = s5;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 43) {
                  s5 = peg$c1;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c2);
                  }
                }
                if (s5 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 45) {
                    s5 = peg$c3;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c4);
                    }
                  }
                }
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse_();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parseFunction();
                    if (s7 !== peg$FAILED) {
                      s5 = [s5, s6, s7];
                      s4 = s5;
                    } else {
                      peg$currPos = s4;
                      s4 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c5(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c0);
            }
          }

          return s0;
        }

        function peg$parseFunction() {
          var s0, s1, s2, s3, s4, s5, s6, s7, s8;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = peg$parseFunctionName();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
              s2 = peg$c7;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c8);
              }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseOperation();
              if (s3 !== peg$FAILED) {
                s4 = [];
                s5 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 44) {
                  s6 = peg$c9;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c10);
                  }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseOperation();
                    if (s8 !== peg$FAILED) {
                      s6 = [s6, s7, s8];
                      s5 = s6;
                    } else {
                      peg$currPos = s5;
                      s5 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
                while (s5 !== peg$FAILED) {
                  s4.push(s5);
                  s5 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 44) {
                    s6 = peg$c9;
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c10);
                    }
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parseOperation();
                      if (s8 !== peg$FAILED) {
                        s6 = [s6, s7, s8];
                        s5 = s6;
                      } else {
                        peg$currPos = s5;
                        s5 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s5;
                      s5 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                }
                if (s4 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 41) {
                    s5 = peg$c11;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c12);
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c13(s1, s3, s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$parseRoll();
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c6);
            }
          }

          return s0;
        }

        function peg$parseFunctionName() {
          var s0;

          if (input.substr(peg$currPos, 3) === peg$c14) {
            s0 = peg$c14;
            peg$currPos += 3;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c15);
            }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c16) {
              s0 = peg$c16;
              peg$currPos += 3;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c17);
              }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 6) === peg$c18) {
                s0 = peg$c18;
                peg$currPos += 6;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c19);
                }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c20) {
                  s0 = peg$c20;
                  peg$currPos += 4;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c21);
                  }
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$parseMacro();
                }
              }
            }
          }

          return s0;
        }

        function peg$parseRoll() {
          var s0, s1, s2, s3;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = peg$parseInteger();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 100) {
              s2 = peg$c23;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c24);
              }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseInteger();
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c25(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 100) {
              s1 = peg$c23;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c24);
              }
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parseInteger();
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c26(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parseTemplate();
            }
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c22);
            }
          }

          return s0;
        }

        function peg$parseTemplate() {
          var s0, s1, s2;

          peg$silentFails++;
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 37) {
            s1 = peg$c28;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c29);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parseInteger();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c30(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$parseMacro();
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c27);
            }
          }

          return s0;
        }

        function peg$parseMacro() {
          var s0, s1, s2;

          peg$silentFails++;
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 36) {
            s1 = peg$c32;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c33);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parseIdentifier();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c34(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$parseOffset();
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c31);
            }
          }

          return s0;
        }

        function peg$parseOffsetType() {
          var s0;

          if (input.charCodeAt(peg$currPos) === 43) {
            s0 = peg$c1;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c2);
            }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c3;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c4);
              }
            }
          }

          return s0;
        }

        function peg$parseOffset() {
          var s0, s1, s2;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = peg$parseOffsetType();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseInteger();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c36(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$parseConst();
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c35);
            }
          }

          return s0;
        }

        function peg$parseConst() {
          var s0, s1;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = peg$parseInteger();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c38(s1);
          }
          s0 = s1;
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c37);
            }
          }

          return s0;
        }

        function peg$parseInteger() {
          var s0, s1, s2;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = [];
          if (peg$c40.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c41);
            }
          }
          if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
              s1.push(s2);
              if (peg$c40.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c41);
                }
              }
            }
          } else {
            s1 = peg$FAILED;
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c42();
          }
          s0 = s1;
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c39);
            }
          }

          return s0;
        }

        function peg$parseIdentifier() {
          var s0, s1, s2, s3;

          peg$silentFails++;
          s0 = peg$currPos;
          if (peg$c44.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c45);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = [];
            if (peg$c46.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c47);
              }
            }
            if (s3 !== peg$FAILED) {
              while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c46.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c47);
                  }
                }
              }
            } else {
              s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c48();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c43);
            }
          }

          return s0;
        }

        function peg$parse_() {
          var s0, s1;

          peg$silentFails++;
          s0 = [];
          if (peg$c50.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c51);
            }
          }
          while (s1 !== peg$FAILED) {
            s0.push(s1);
            if (peg$c50.test(input.charAt(peg$currPos))) {
              s1 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c51);
              }
            }
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c49);
            }
          }

          return s0;
        }

        peg$result = peg$startRuleFunction();

        if (peg$result !== peg$FAILED && peg$currPos === input.length) {
          return peg$result;
        } else {
          if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail(peg$endExpectation());
          }

          throw peg$buildStructuredError(
              peg$maxFailExpected,
              peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) :
                                              null,
              peg$maxFailPos < input.length ?
                  peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) :
                  peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
        }
      }

      return {SyntaxError: peg$SyntaxError, parse: peg$parse};
    })();
