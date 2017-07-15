
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "config.h"
#include <emscripten/emscripten.h>
#include <math.h>
#include <png.h>
#include <gd.h>
#include <gdfonts.h>
#include <gdfontt.h>

void usage(int return_code);
int read_ppm(char *fname);
int read_png(char *fname);
int parse_args(int argc, char **argv);
void alloc_cells(int n_width, int n_height);
int piet_run();
void piet_init();
int piet_step();
void gd_save();
int get_color_idx(int col);
void set_cell(int x, int y, int val);

#define n_hue 6   /* 4 colors */
#define n_light 3 /* 4 shades */
#define c_white (n_hue * n_light)
#define c_black (c_white + 1)
#define n_colors (c_black + 1)
/* internal used index for filling areas: */
#define c_mark_index 9999
int adv_col(int c, int h, int l);


/* be somewhat verbose: */
int verbose;

/* be quiet - actually only suppresses the prompt when doing input: */
int quiet;

/* show program execution information: */
int trace;

/* maximum number of execution steps (0 == unlimited): */
unsigned max_exec_step;

/* print debugging stuff: */
int debug;

/* filename to work for: */
char *input_filename;

/* unknown colors are treated as white, black or error (default 1 is white): */
int unknown_color;

/* with gd2 lib linked we try to save trace output: */
int do_gdtrace;
char *gd_trace_filename;
int gd_trace_simple;
unsigned gd_trace_start;
unsigned gd_trace_end;

/* pixelsize when painting graphical trace output: */
int c_xy;

/* codelsize of the input. -1 means, we try to guess it from the input: */
int codel_size;

/* trace codelsize threshold for pixel numbers, not tiny strings: */
int pp_size;

/* work around broken source (wrong assumption about toggle of dp and cc): */
int toggle_bug;

/* fun-stuff: create commands to print a string: */
char *do_n_str;

/* fall back to npiet v1.1 behavior (fixed white codel crossing but
 * without trace info:
 */
int version_11;

/*
 * picture storage:
 */
static int *cells;
static int width;
static int height;



/* helper: */
#define dprintf                                                                \
  if (debug)                                                                   \
  printf
#define tprintf                                                                \
  if (trace && exec_step >= gd_trace_start && exec_step <= gd_trace_end)       \
  printf
#define t2printf                                                               \
  if (trace > 1)                                                               \
  printf
#define vprintf                                                                \
  if (verbose)                                                                 \
  printf
