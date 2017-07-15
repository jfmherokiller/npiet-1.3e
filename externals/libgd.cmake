
SET (LIBGD_SRC_FILES
        libgd/src/bmp.h
        libgd/src/gd.c
        libgd/src/gd.h
        libgd/src/gd_bmp.c
        libgd/src/gd_color.c
        libgd/src/gd_color.h
        libgd/src/gd_color_map.c
        libgd/src/gd_color_map.h
        libgd/src/gd_color_match.c
        libgd/src/gd_crop.c
        libgd/src/gd_filename.c
        libgd/src/gd_filter.c
        libgd/src/gd_gd.c
        libgd/src/gd_gd2.c
        libgd/src/gd_gif_in.c
        libgd/src/gd_gif_out.c
        libgd/src/gd_intern.h
        libgd/src/gd_interpolation.c
        libgd/src/gd_io.c
        libgd/src/gd_io.h
        libgd/src/gd_io_dp.c
        libgd/src/gd_io_file.c
        libgd/src/gd_io_ss.c
        libgd/src/gd_io_stream.cxx
        libgd/src/gd_io_stream.h
        libgd/src/gd_jpeg.c
        libgd/src/gd_matrix.c
        libgd/src/gd_nnquant.c
        libgd/src/gd_nnquant.h
        libgd/src/gd_png.c
        libgd/src/gd_rotate.c
        libgd/src/gd_security.c
        libgd/src/gd_ss.c
        libgd/src/gd_tga.c
        libgd/src/gd_tga.h
        libgd/src/gd_tiff.c
        libgd/src/gd_topal.c
        libgd/src/gd_transform.c
        libgd/src/gd_version.c
        libgd/src/gd_wbmp.c
        libgd/src/gd_webp.c
        libgd/src/gd_xbm.c
        libgd/src/gdcache.c
        libgd/src/gdcache.h
        libgd/src/gdfontg.c
        libgd/src/gdfontg.h
        libgd/src/gdfontl.c
        libgd/src/gdfontl.h
        libgd/src/gdfontmb.c
        libgd/src/gdfontmb.h
        libgd/src/gdfonts.c
        libgd/src/gdfonts.h
        libgd/src/gdfontt.c
        libgd/src/gdfontt.h
        libgd/src/gdft.c
        libgd/src/gdfx.c
        libgd/src/gdfx.h
        libgd/src/gdhelpers.c
        libgd/src/gdhelpers.h
        libgd/src/gdkanji.c
        libgd/src/gdpp.cxx
        libgd/src/gdpp.h
        libgd/src/gdtables.c
        libgd/src/gdxpm.c
        libgd/src/jisx0208.h
        libgd/src/wbmp.c
        libgd/src/wbmp.h
        )

SET(HAVE_CONFIG_H 1)

ADD_DEFINITIONS(-DHAVE_CONFIG_H -DHAVE_LIBPNG -DHAVE_LIBZ)

CHECK_INCLUDE_FILE("stdint.h"	HAVE_STDINT_H)
CHECK_INCLUDE_FILE("inttypes.h"	HAVE_INTTYPES_H)

CONFIGURE_FILE(libgd/src/config.h.cmake libgd/src/config.h ESCAPE_QUOTES)
add_library(gd_static STATIC ${LIBGD_SRC_FILES})
set_target_properties(gd_static PROPERTIES LINK_FLAGS "${EMSCRIPEN_FLAGS}")