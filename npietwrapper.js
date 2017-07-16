/**
 * Created by peter on 6/25/17.
 */
var mymodule = require("npiet.js");
function load_png_from_url(pngurl)
{
    var buffer = mymodule._malloc(pngurl.length + 1);
    mymodule.writeStringToMemory(pngurl, buffer);
    var returnval = mymodule.ccall('load_png_from_url', 'number',['number'], buffer);
    mymodule._free(buffer);
    return returnval;
}
function load_ppm_from_url(pngurl)
{
    var buffer = mymodule._malloc(pngurl.length + 1);
    mymodule.writeStringToMemory(pngurl, buffer);
    var returnval = mymodule.ccall('load_ppm_from_url', 'number',['number'], buffer);
    mymodule._free(buffer);
    return returnval;
}

function _arrayToHeap(typedArray){
    var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
    var ptr = Module._malloc(numBytes);
    var heapBytes = Module.HEAPU8.subarray(ptr, ptr + numBytes);
    heapBytes.set(typedArray);
    return heapBytes;
}
function _freeArray(heapBytes){
    Module._free(heapBytes.byteOffset);
}

function Load_PPM_From_Array(TheArray)
{
    var heapBytes = _arrayToHeap(TheArray);
    Module.sum({ ptr: heapBytes.byteOffset, length: heapBytes.length});
    _freeArray(heapBytes);
}

