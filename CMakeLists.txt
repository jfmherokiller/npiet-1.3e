cmake_minimum_required(VERSION 3.4.3)
add_definitions(-s USE_LIBPNG=1 -O3 -s NO_EXIT_RUNTIME=1 --memory-init-file 0)
add_executable (npiet npiet.c)
set_target_properties(npiet PROPERTIES LINK_FLAGS " -s NO_EXIT_RUNTIME=1 -O3 -s USE_LIBPNG=1 --memory-init-file 0")
