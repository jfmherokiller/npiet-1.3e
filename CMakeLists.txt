cmake_minimum_required(VERSION 3.4.3)
SET(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/modules")
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/dist)
#include cmake module bits
include(CheckIncludeFiles)
include(CheckIncludeFile)

include(AC_HEADER_STDC)
include(CheckPrototypeExists)

SET(EMSCRIPEN_FLAGS "-s USE_LIBPNG=1 -s USE_ZLIB=1 -s NO_EXIT_RUNTIME=1")
add_definitions(${EMSCRIPEN_FLAGS})
include_directories(externals\\libgd\\src)
add_subdirectory(externals)
add_subdirectory(npietsrc)