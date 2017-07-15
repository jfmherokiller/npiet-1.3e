


add_executable (npiet npiet.c)
target_link_libraries(npiet gd_static)
set_target_properties(npiet PROPERTIES LINK_FLAGS "${EMSCRIPEN_FLAGS} --memory-init-file 0")

