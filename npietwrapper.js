/**
 * Created by peter on 6/25/17.
 */
function load_png_from_url(pngurl)
{
    var buffer = Module._malloc(pngurl.length + 1);
    Module.writeStringToMemory(pngurl, buffer);
    var returnval = Module.ccall('load_png_from_url', 'number',['number'], buffer);
    Module._free(buffer);
    return returnval;
}
function load_ppm_from_url(pngurl)
{
    var buffer = Module._malloc(pngurl.length + 1);
    Module.writeStringToMemory(pngurl, buffer);
    var returnval = Module.ccall('load_ppm_from_url', 'number',['number'], buffer);
    Module._free(buffer);
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

