


add_executable (npiet npiet.c)
target_link_libraries(npiet gd_static)
set_target_properties(npiet PROPERTIES LINK_FLAGS " -s NO_EXIT_RUNTIME=1 -O3 -s USE_LIBPNG=1 -s USE_ZLIB=1 --memory-init-file 0")

