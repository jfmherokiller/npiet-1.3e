/**
 * Created by peter on 6/25/17.
 */
var mymodule = require("npiet.js");
function loadpng(pngurl)
{
    var buffer = mymodule._malloc(pngurl.length + 1);
    mymodule.writeStringToMemory(pngurl, buffer);
    var returnval = mymodule.ccall('mymainpng', 'number',['number'], buffer);
    mymodule._free(buffer);
    return returnval;
}
function loadppm(pngurl)
{
    var buffer = mymodule._malloc(pngurl.length + 1);
    mymodule.writeStringToMemory(pngurl, buffer);
    var returnval = mymodule.ccall('mymainppm', 'number',['number'], buffer);
    mymodule._free(buffer);
    return returnval;
}

