var katescript = {
    "name": "R",
    "author": "Pierre de Villemerereuil <flyos@mailoo.org>",
    "license": "LGPL",
    "revision": 1,
    "kate-version": "5.1",
    "indent-languages": ["R", "R Script"],
}; // kate-script-header, must be at the start of the file without comments

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
             '%>%', '%T>%', '%$%', '%<>%'];
equalOperatorSigns = ['=', '>', '<', '!'];

// Extension of endswith for an array of tests
function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}

// Return the given line without comments and leading or trailing whitespace.
// but keep strings (compared to getCode)
// Eg.
// getCode(x) -> "for i in range(3):"
//     if document.line(x) == "  for i in range(3):"
// getCode(x) -> "for i in range(3):"
//     if document.line(x) == "for i in range(3):  "
// getCode(x) -> "for i in range(3):"
//     if document.line(x) == "for i in range(3):  # grand"
function getCodeWithString(lineNr) {
    var line = document.line(lineNr);
    var code = '';
    for (var position = 0; position < line.length; position++) {
        if (document.isCode(lineNr, position) || document.isString(lineNr, position)) {
            code += line[position];
        }
    }
    return code.trim();
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
                    return {indent : j + 1 + countSpaces(i,j), line : i, type : "unclosed"};
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
                        return {indent : -1, line : i, type : "allclosed"};
                    } else {
                        return {indent : j, line : i, type : "allclosed"};
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
            if (lineString[j] == "=" && equalOperatorSigns.indexOf(lineString[j - 1]) == -1 && lineString[j + 1] != "=") {
               // If not between equal-inducing brackets
               if (countClosing[')'] == 0 && countClosing[']'] == 0) {
                   // If no comma is "closing" the equal
                   if (countComma == 0) {
                       // Return the position of equal to create a new indent
                       return {indent : j + 1 + countSpaces(i,j), line : i, type : "equal"};
                   }
               }
            }
        }
    }
    return {indent : -1, line : i};
}

// Returns the indent based on operators
// `lineNr`: number of the line for which the indent is calculated 
// `indentWidth` : indent width
// `lineLastOp` : does the line on which returns was hit end with an operator
//  (note that the line for lineLastOp is not necessarily lineNr)
function calcOperatorIndent(lineNr, indentWidth, lineLastOp) {
    var currentIndent = document.firstVirtualColumn(lineNr);
    // If we haven't indented yet and line ends up with an operator
    // then indent
    if (currentIndent == 0 && lineLastOp) {
        return indentWidth;
    }
    // If the current line ends up with an operator
    if (lineLastOp) {
        var previousLine = getCode(lineNr - 1);
        while (previousLine == '' && lineNr >= 0) {
            lineNr = lineNr - 1;
            previousLine = getCode(lineNr - 1);
        }
        // If the line before the indent line doesn't ends up with an operator
        if (!endsWithAny(operators, previousLine)) {
            // then indent
            return currentIndent + indentWidth;
        } else {
            // else don't
            return currentIndent;
        }
    } else {
        var previousLine = getCode(lineNr - 1);
        while (previousLine == '' && lineNr >= 0) {
            lineNr = lineNr - 1;
            previousLine = getCode(lineNr - 1);
        }
        
        // If the previous line ends with an operator
        if (endsWithAny(operators, previousLine)) {
            // Looking for the start of the operator indenting
            for (i = lineNr - 1; i>=0; --i) {
                // If we indented in the past
                if (document.firstVirtualColumn(i) < currentIndent) {
                    currentIndent = document.firstVirtualColumn(i);
                    var previousLine = getCode(i - 1);
                    // and doesn't end up with an operator
                    if (!endsWithAny(operators, previousLine)) {
                        //return this line indent otherwise
                        return currentIndent;
                    }
                }
            }
        } else {
            return currentIndent;
        }
        
        
        
        // If the current line doesn't ends up with an operator, we might need to unindent
        // Let's look above
        for (i = lineNr; i>=0; --i) {
            // If a line has a lower indent
            if (document.firstVirtualColumn(i) <= currentIndent) {
                currentIndent = document.firstVirtualColumn(i);
                var previousLine = getCode(i - 1);
                // and doesn't end up with an operator
                if (!endsWithAny(operators, previousLine)) {
                    //return this line indent
                    return currentIndent;
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
function indent(line, indentWidth, ch) {
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
    var mismatch = calcMismatchIndent(line - 1);
    var indent = mismatch.indent;
    
    // if indent is based on non-opened brackets, try indent because of operators
    // Don't do it if the end is "<-" though (necessary because "-" is an operator...)
    if (mismatch.type == "allclosed" && !lastLine.endsWith('<-')) {
        // compute indent due to an operator
        indent = calcOperatorIndent(mismatch.line, indentWidth, endsWithAny(operators, lastLine));
    }
    
    if (mismatch.type == "unclosed" && endsWithAny(operators, lastLine)) {
        // If there is formula on this line, 
        // return its position as indent
        var lineString = document.line(line - 1);
        for (j = lineString.length; j>=0; --j) {
            if (document.isComment(line - 1, j) || document.isString(line - 1, j))
                continue;
            if (lineString[j] == "~") {
                return j + 1 + countSpaces(line - 1,j)
            }
        }
    }
    
    // At that point, we might have computed an indent equal to the current one,
    // let's keep it simple
    if (document.firstVirtualColumn(line - 1) == indent) {
        indent = -1;
    }
    
    // Assignment is important and particular, so always indent when we do it
    if (getCodeWithString(line - 1).endsWith('<-')) {
        if (indent > -1)
            indent += indentWidth;
        else
            indent = document.firstVirtualColumn(line - 1) + indentWidth;
    }
    return indent;
}
