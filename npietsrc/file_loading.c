//
// Created by peter on 7/15/17.
//
#include "npiet.h"



int read_ppm(char *fname) {
    FILE *in;
    char line[1024];
    int ppm_type = 0;
    int i, j, width, height, ncol;

    if (!strcmp(fname, "-")) {
        /* read from stdin: */
        in = stdin;
        fname = "<stdin>";
    } else {
        in = fopen(fname, "rb");
    }
    if (!in) {
        fprintf(stderr, "cannot open `%s'; reason: %s\n", fname, strerror(errno));
        return -1;
    }

    if (!fgets(line, sizeof(line), in)) {
        fprintf(stderr, "cannot read from `%s'; reason: %s\n", fname,
                feof(in) ? "EOF" : strerror(errno));
        return -1;
    }

    if (!strncmp(line, "P6", 2)) {
        /* ppm file with binary data: */
        ppm_type = 6;
    } else if (!strncmp(line, "P3", 2)) {
        /* ppm with ascii data: */
        ppm_type = 3;
    } else {
        fprintf(stderr, "cannot read from `%s'; reason: unknown PPM format\n",
                fname);
        return -1;
    }

    while (fgets(line, sizeof(line), in) && line[0] == '#') {
        continue;
    }

    if (feof(in) || 2 != sscanf(line, "%d %d\n", &width, &height)) {
        fprintf(stderr, "cannot read from `%s'; reason: unknown width height\n",
                fname);
        return -1;
    }

    if (1 != fscanf(in, "%d\n", &ncol)) {
        fprintf(stderr, "cannot read from `%s'; reason: unknown number of colors\n",
                fname);
        return -1;
    }

    if (ncol != 255) {
        fprintf(stderr, "warning: found number of colors %d, but 255 expected\n",
                ncol);
    }

    vprintf("info: got ppm image with %d x %d pixel and %d cols\n", width, height,
            ncol);

    alloc_cells(width, height);

    for (j = 0; j < height; j++) {
        for (i = 0; i < width; i++) {

            int r, g, b, col, col_idx;

            if (ppm_type == 6) {
                if ((r = fgetc(in)) < 0 || (g = fgetc(in)) < 0 || (b = fgetc(in)) < 0) {
                    fprintf(stderr, "cannot read from `%s'; reason: %s\n", fname,
                            strerror(errno));
                    return -1;
                }
            } else {
                if (3 != fscanf(in, "%d %d %d", &r, &g, &b)) {
                    fprintf(stderr, "cannot read from `%s'; reason: %s\n", fname,
                            strerror(errno));
                    return -1;
                }
            }

            col = ((r * (ncol + 1) + g) * (ncol + 1)) + b;
            col_idx = get_color_idx(col);
            if (col_idx < 0) {
                vprintf("info: unknown color 0x%06x at %d,%d\n", col, i, j);
                if (unknown_color == -1) {
                    fprintf(stderr,
                            "cannot read from `%s'; reason: invalid color found\n",
                            fname);
                    return -1;
                } else {
                    /* set to black or white: */
                    col_idx = (unknown_color == 0 ? c_black : c_white);
                }
            }

            set_cell(i, j, col_idx);
        }
    }

    return 0;
}

png_byte bit_depth;

png_structp png_ptr;
png_infop info_ptr;
int number_of_passes;
png_bytep *row_pointers;



int read_png(char *fname) {
    char header[8];
    FILE *in;
    int i, j, ncol;

    if (!strcmp(fname, "-")) {
        /* read from stdin: */
        vprintf("info: not trying to read png from stdin\n");
        return -1;
    }

    if (!(in = fopen(fname, "rb"))) {
        fprintf(stderr, "cannot open `%s'; reason: %s\n", fname, strerror(errno));
        return -1;
    }

    if (fread(header, 1, 8, in) != 8) {
        return -1;
    } else {
        if (png_sig_cmp((unsigned char *) header, 0, 8) != 0) {
            return -1;
        }
    }

    if (!(png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, 0, 0, 0)) ||
        !(info_ptr = png_create_info_struct(png_ptr))) {
        return -1;
    }

    png_init_io(png_ptr, in);
    png_set_sig_bytes(png_ptr, 8);

    png_read_png(png_ptr, info_ptr,
                 PNG_TRANSFORM_STRIP_16 | PNG_TRANSFORM_STRIP_ALPHA |
                 PNG_TRANSFORM_EXPAND,
                 NULL);
    /**		| PNG_TRANSFORM_PACKING | PNG_TRANSFORM_SHIFT **/

    row_pointers = png_get_rows(png_ptr, info_ptr);

    width = png_get_image_width(png_ptr, info_ptr);
    height = png_get_image_height(png_ptr, info_ptr);
    ncol = 2 << (png_get_bit_depth(png_ptr, info_ptr) - 1);

    vprintf("info: got %d x %d pixel with %d cols\n", width, height, ncol);

    alloc_cells(width, height);

    for (j = 0; j < height; j++) {
        png_byte *row = row_pointers[j];
        for (i = 0; i < width; i++) {

            png_byte *ptr = &row[i * 3];

            /* ncol always 256 ? */
            int r = (ptr[0] * 256) / ncol;
            int g = (ptr[1] * 256) / ncol;
            int b = (ptr[2] * 256) / ncol;

            int col = ((r * 256 + g) * 256) + b;
            int col_idx = get_color_idx(col);

            if (col_idx < 0) {
                if (unknown_color == -1) {
                    fprintf(stderr,
                            "cannot read from `%s'; reason: invalid color found\n",
                            fname);
                    return -1;
                } else {
                    /* set to black or white: */
                    col_idx = (unknown_color == 0 ? c_black : c_white);
                }
            }

            set_cell(i, j, col_idx);
        }
    }

    return 0;
}
