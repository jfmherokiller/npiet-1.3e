
SET(NPIET_SRC
        npiet.c
        file_loading.c
        emscripten-hooks.c)

add_executable (npiet ${NPIET_SRC})
target_link_libraries(npiet gd_static)
set_target_properties(npiet PROPERTIES LINK_FLAGS "${EMSCRIPEN_FLAGS} --post-js ${CMAKE_CURRENT_SOURCE_DIR}/../npietwrapper.js")

