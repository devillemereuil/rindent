/** kate-script
 * name: R
 * license: LGPL
 * author: Pierre de Villemerereuil <flyos@mailoo.org>
 * revision: 1
 * indent-languages: R, Script R
 * kate-version: 3.10
 */

// Some functions from Python indentation file (credit to Paul Giannaros <paul@giannaros.org>, Gerald Senarclens de Grancy <oss@senarclens.eu>)

// NB: This script works best if "<-" is used for assignment rather than "="

// required katepart js libraries
require ("range.js");
require ("string.js");

openings  = ['(', '[','{'];
closings  = [')', ']','}'];  // requires same order as in openings
operators = ['+', '-', '*', '/', '^',
             '&', '|', '==', '>', '<', '<=', '>=', '!=',
             '%%', '%*%', '%/%', '%in%', 
             '%>%', '%T>%', '%$%']; 

// Extension of endswith for an array of tests
function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}

// Return the given line without comments and leading or trailing whitespace.
// Eg.
// getCode(x) -> "for i in range(3):"
//     if document.line(x) == "  for i in range(3):"
// getCode(x) -> "for i in range(3):"
//     if document.line(x) == "for i in range(3):  "
// getCode(x) -> "for i in range(3):"
//     if document.line(x) == "for i in range(3):  # grand"
function getCode(lineNr) {
    var line = document.line(lineNr);
    var code = '';
    for (var position = 0; position < line.length; position++) {
        if (document.isCode(lineNr, position)) {
            code += line[position];
        }
    }
    return code.trim();
}

// Returns the number of spaces after "pos""
// on the line number "lineNr"
function countSpaces(lineNr, pos) {
    var line = document.line(lineNr);
    var add = 0;
    var pos = pos + 1;
    while (line[pos] == " ") {
        add++;
        pos++;
    }
    return add;
}

// Returns the indent if finding a mismatch using brackets, commas and equal signs
// If there are no mismatch, -1 is returned.
// `lineNr`: number of the line for which the indent is calculated
function calcMismatchIndent(lineNr) {
    // initialising some counters
    var countClosing = new Array();
    closings.forEach(function(elem) {
        countClosing[elem] = 0;
    });
    var countComma = 0;
    
    // starting looking for mismatches
    for (var i = lineNr; i >= 0; --i) {
        var lineString = document.line(i);
        for (var j = lineString.length; j >= 0; --j) {
            // Ignore comments and strings
            if (document.isComment(i, j) || document.isString(i, j))
                continue; 
            
            // Testing for brackets
            // If a closing bracket, add 1 to counter
            if (closings.indexOf(lineString[j]) > -1) {
                countClosing[lineString[j]]++;
            }
            // If an opening bracket, add 1 to the corresponding closing counter
            var index = openings.indexOf(lineString[j]);
            if (index > -1) {
                countClosing[closings[index]]--;
                // If an open-but-not-closed bracket is found
                // Return indent corresponding to its position
                if (countClosing[closings[index]] == -1)
                    return j + 1 + countSpaces(i,j);
            }
            // If the start of the line is reached and
            // no comma was "opened"
            if (j == document.firstVirtualColumn(i) && countComma == 0) {
                // Test if all brackets are closed
                var allclosed = true;
                for (var key in countClosing) {
                    if (countClosing[key] != 0) {
                        allclosed = false;
                    }
                }                // If they are all closed, return the indent of this line
                if (allclosed) {
                    // if we didn't move, return -1 (keep indent), else return the indent of line i
                    if (i == lineNr) {
                        return -1;
                    } else {
                        return j;
                    }
                }
                    
            }
            
            // Counting the commas if needed
            if (lineString[j] == ',') {
                // If not between comma-inducing brackets
                if (countClosing[')'] == 0 && countClosing[']'] == 0)
                    countComma++;
            }
            
            // Handling equal signs
            if (lineString[j] == "=") {
               // If not between equal-inducing brackets
               if (countClosing[')'] == 0 && countClosing[']'] == 0) {
                   // If no comma is "closing" the equal
                   if (countComma == 0) {
                       // Return the position of equal to create a new indent
                       return j + 1 + countSpaces(i,j);
                   }
               }
            }
        }
    }
    return -1;
}

// Returns the indent if finding a mismatch using brackets, commas and equal signs
// If there are no mismatch, -1 is returned.
// `lineNr`: number of the line for which the indent is calculated
function calcOperatorIndent(lineNr, indentWidth, lineLastOp) {
    var currentIndent = document.firstVirtualColumn(lineNr);
    if (currentIndent == 0 && lineLastOp) {
        return indentWidth;
    }
    if (lineLastOp) {
        var previousLine = getCode(lineNr - 1);
        if (!endsWithAny(operators, previousLine)) {
            return currentIndent + indentWidth;
        } else {
            return -1;
        }
    } else {
        for (i = lineNr - 1; i>=0; --i) {
            if (document.firstVirtualColumn(i) < currentIndent) {
                currentIndent = document.firstVirtualColumn(i);
                var previousLine = getCode(i - 1);
                if (!endsWithAny(operators, previousLine)) {
                    if (i == lineNr - 1) {
                        return -1
                    } else {
                        return currentIndent;
                    }
                }
            }
        }
    }
    return -1;
}



// Return the amount of characters (in spaces) to be indented.
// Special indent() return values:
//   -2 = no indent
//   -1 = keep last indent
function indent(line, indentWidth, character) {
    if (line == 0)  // don't ever act on document's first line
        return -2;
    var lastLine = getCode(line - 1);
    var lastChar = lastLine.substr(-1);
    
    // if empty line, strictly keep indent 
    // (-1 seems to be not strict and "restore" latest indent with text)
    if (!lastLine.length) {
        return countSpaces(line - 1, -1);
    }
    
    // opening brackets and returns: simply indent
    if (openings.indexOf(lastChar) > -1) {
        return document.firstVirtualColumn(line - 1) + indentWidth;
    }
    
    // calculate indents based on mismatch of brackets, commas and equal signs 
    var indent = calcMismatchIndent(line - 1);

    // if indent is kept based on mismatch, try indents because of last character
    if (indent == -1) {
        if (endsWithAny(operators, lastLine) && !lastLine.endsWith('<-')) {
            indent = calcOperatorIndent(line - 1, indentWidth, true);
        }
        if (!endsWithAny(operators, lastLine) && !lastLine.endsWith('<-')) {
            indent = calcOperatorIndent(line - 1, indentWidth, false);
        }
    }
    if (lastLine.endsWith('<-')) {
        if (indent > -1)
            indent += indentWidth;
        else
            indent = document.firstVirtualColumn(line - 1) + indentWidth;
    }
    return indent;
}

// kate: space-indent on; indent-width 4; replace-tabs on;
