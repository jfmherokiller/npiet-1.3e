/**
 * Created by peter on 6/25/17.
 */
/*
 * npiet.c:						May 2004
 * (schoenfr@web.de)					Aug 2016
 *
 * npiet is an interperter for the piet programming language.
 *
 *
 * about the piet programming language see:
 *
 *	http://www.dangermouse.net/esoteric/piet.html
 *
 * more about the piet programming language and the npiet interpreter see:
 *
 *	http://www.bertnase.de/npiet/
 *
 *
 *   compile:
 *	  cc -o npiet npiet.c
 *   use:
 *	  ./piet hi.ppm
 *
 *
 * if compiled with gd-lib support, graphical trace output can be
 * created - great fun ;-)
 *
 *	  cc -DHAVE_GD_H -o npiet npiet.c -lgd
 *	  ./npiet -tpic hi.ppm
 *
 * reading png is supported if -DHAVE_PNP_H is set
 * and reading gif is supported if -DHAVE_GIF_LIB_H is set.
 *
 *
 * but all this is automagically handled by running
 *
 *	  ./configure
 *
 *
 * Copyright (C) 2004 Erik Schoenfelder (schoenfr@web.de)
 *
 * This file is part of npiet.
 *
 * npiet is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation version 2.
 *
 * npiet is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with npiet; see the file COPYING.  If not, write to the Free
 * Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 */
var version = "v1.3e";
function exit(rc) {
}
function usage(rc) {
    console.log("npiet %s  (with", version);
    console.log(" ");
    console.log("out ");
    console.log("GD support, with");
    console.log(" ");
    console.log("out ");
    console.log("GIF support, with");
    console.log(" ");
    console.log("out ");
    console.log("PNG support)\n\n");
    console.log("use: npiet \[\<options>\] \<filename>\n");
    console.log("options:\n");
    console.log("\t-v         - be verbose (default: off)\n");
    console.log("\t-q         - be quiet (default: off)\n");
    console.log("\t-e <n>     - execution steps (default: unlimited)\n");
    console.log("\t-t         - trace (default: off)\n");
    console.log("\t-ub        - unknown colors are black "
        + "(default: white)\n");
    console.log("\t-uu        - unknown colors give error ");
    console.log("\t-cs <n>    - codelsize of the input (default: guess)\n");
    console.log("\t-tpic      - create trace picture (not compiled in)\n");
    console.log("\t-tpf <n>   - trace pixelzoom  (not compiled in)\n");
    console.log("\t-tps       - simple trace pic w/o dp/cc info  (not compiled in)\n");
    console.log("\t-tpic      - create trace picture  (default: do not)\n");
    console.log("\t-tpf <n>   - trace pixelzoom  (default: 48 or so)\n");
    console.log("\t-tps       - simple trace pic w/o dp/cc info  (default: sho dp/cc info)\n");
    console.log("\t-ts <n>    - graphic trace start (default: 0)\n");
    console.log("\t-te <n>    - graphic trace end (default: unlimited)\n");
    console.log("\t-n-str <s> - nase stuff: string-to-command\n");
    console.log("\t-d         - debug (default: off)\n");
    console.log("\t-dpbug     - model the perl piet interpreter (default: off)\n");
    console.log("\t-v11       - model the npiet v1.1 interpreter (default: off)\n");
    exit(rc);
}
/* be somewhat verbose: */
var verbose = 0;
/* be quiet - actually only suppresses the prompt when doing input: */
var quiet = 0;
/* show program execution information: */
var trace = 0;
/* maximum number of execution steps (0 == unlimited): */
var max_exec_step = 0;
/* prletdebugging stuff: */
var debug = 0;
/* filename to work for: */
var input_filename = 0;
/* unknown colors are treated as white, black or error (default 1 is white): */
var unknown_color = 1;
/* with gd2 lib linked we try to save trace output: */
var do_gdtrace = 0;
var gd_trace_filename = "npiet-trace.png";
var gd_trace_simple = 0;
var gd_trace_start = 0;
var gd_trace_end = 1 << 31; /* lot's to prlet*/
/* pixelsize when painting graphical trace output: */
var c_xy = 32;
/* codelsize of the input. -1 means, we try to guess it from the input: */
var codel_size = -1;
/* trace codelsize threshold for pixel numbers, not tiny strings: */
var pp_size = 49;
/* work around broken source (wrong assumption about toggle of dp and cc): */
var toggle_bug = 0;
/* fun-stuff: create commands to prleta string: */
var do_n_str = 0;
/* fall back to npiet v1.1 behavior (fixed white codel crossing but
 * without trace info:
 */
var version_11 = 0;
/* helper: */
function strcmp(arg1, arg2) {
}
function printf(args, args2) {
}
function dprintf() {
    if (debug)
        printf;
}
function d2printf() {
    if (debug > 1)
        printf;
}
function tprintf() {
    if (trace && exec_step >= gd_trace_start && exec_step <= gd_trace_end)
        printf;
}
function t2printf() {
    if (trace > 1)
        printf;
}
function vprintf(args, args2) {
    if (verbose)
        printf(args);
}
function parse_args(argc, argv) {
    while (--argc > 0) {
        argv++;
        if (!strcmp(argv[0], "-v")) {
            verbose++;
            vprintf("info: verbose set to %d\n", verbose);
        }
        else if (!strcmp(argv[0], "-q")) {
            quiet++;
        }
        else if (!strcmp(argv[0], "-t")) {
            trace++;
            vprintf("info: trace set to %d\n", trace);
        }
        else if (!strcmp(argv[0], "-d")) {
            debug++;
            dprintf("info: debug set to %d\n", debug);
        }
        else if (!strcmp(argv[0], "-uu")) {
            unknown_color = -1;
            vprintf("info: unknown color set to error\n");
        }
        else if (!strcmp(argv[0], "-ub")) {
            unknown_color = 0;
            vprintf("info: unknown color set to black\n");
        }
        else if (!strcmp(argv[0], "-dpbug")) {
            /* just a tbd (how to follow wrong behavior ;-) */
            toggle_bug = 1;
            vprintf("info: setting toggle bug and white bug behavior\n");
        }
        else if (!strcmp(argv[0], "-v11")) {
            version_11 = 1;
            vprintf("info: setting npiet version 1.1 behavior\n");
        }
        else if (!strcmp(argv[0], "-tpic")) {
            printf("note: no GD support compiled in. the graphical trace feature is not avail\n");
            do_gdtrace = 1;
            vprintf("info: save trace output to %s\n", gd_trace_filename);
        }
        else if (argc > 0 && !strcmp(argv[0], "-tpf")) {
            argc--, argv++; /* shift */
            printf("note: no GD support compiled in. the graphical trace feature is not avail\n");
            if ((c_xy = atoi(argv[0])) < 1) {
                console.log("warning: trace pixelzoom %d is invalid\n", c_xy);
                c_xy = 32;
            }
            vprintf("info: trace pixelzoom set to %d\n", c_xy);
            do_gdtrace = 1;
        }
        else if (!strcmp(argv[0], "-tps")) {
            printf("note: no GD support compiled in. the graphical trace feature is not avail\n");
            do_gdtrace = 1;
            gd_trace_simple++;
        }
        else if (argc > 0 && !strcmp(argv[0], "-e")) {
            argc--, argv++; /* shift */
            max_exec_step = atoi(argv[0]);
            vprintf("info: number of execution steps set to %u\n", max_exec_step);
        }
        else if (argc > 0 && !strcmp(argv[0], "-ts")) {
            argc--, argv++; /* shift */
            printf("note: no GD support compiled in. the graphical trace feature is not avail\n");
            gd_trace_start = atoi(argv[0]);
            vprintf("info: graphical trace start set to %d\n", gd_trace_start);
            /* enable graphical tracing anyway: */
            do_gdtrace = 1;
        }
        else if (argc > 0 && !strcmp(argv[0], "-te")) {
            argc--, argv++; /* shift */
            printf("note: no GD support compiled in. the graphical trace feature is not avail\n");
            gd_trace_end = atoi(argv[0]);
            vprintf("info: graphical trace end set to %d\n", gd_trace_end);
            /* enable graphical tracing anyway: */
            do_gdtrace = 1;
        }
        else if (argc > 0 && !strcmp(argv[0], "-n-str")) {
            argc--, argv++; /* shift */
            do_n_str = argv[0];
        }
        else if (argc > 0 && !strcmp(argv[0], "-cs")) {
            argc--, argv++; /* shift */
            if ((codel_size = atoi(argv[0])) < 1) {
                console.log("warning: codelsize %d is invalid\n", codel_size);
                codel_size = 1;
            }
            vprintf("info: codelsize set to %d\n", codel_size);
        }
        else if (argv[0][0] == '-' && argv[0][1]) {
            usage(-1);
        }
        else if (!input_filename) {
            input_filename = argv[0];
            vprintf("info: using file %s\n", input_filename);
        }
        else {
            usage(-1);
        }
    }
    return 0;
}
extern;
void alloc_cells(letn_width, letn_height);
/*
 * picture storage:
 */
var cells = 0;
var width = 0;
var height = 0;
/*
 * color and hue values:
 *
 * we order the colors linear:
 *
 *   idx 0:   light red
 *   [...]
 *   idx 15:  dark margenta
 *   idx 16:  white
 *   idx 17:  black

 */
var n_hue = 6; /* 4 colors */
var n_light = 3; /* 4 shades */
var c_white = (n_hue * n_light);
var c_black = (c_white + 1);
var n_colors = (c_black + 1);
/* internal used index for filling areas: */
var c_mark_index = 9999;
function adv_col(c, h, l) {
    var columsMod6 = c % 6;
    var columsDivide6 = c / 6;
    var hightPlusMod6 = columsMod6 + h;
    return ((hightPlusMod6 % 6) + (6 * ((((c) / 6) + (l)) % 3)));
}
var c_color = {
    letcol: '',
    l_name: '',
    s_name: '',
    letc_idx: '',
};
var c_colors = [
    [0xFFC0C0, "light red", "lR", 0],
    [0xFFFFC0, "light yellow", "lY", 1],
    [0xC0FFC0, "light green", "lG", 2],
    [0xC0FFFF, "light cyan", "lC", 3],
    [0xC0C0FF, "light blue", "lB", 4],
    [0xFFC0FF, "light magenta", "lM", 5],
    [0xFF0000, "red", "nR", 6],
    [0xFFFF00, "yellow", "nY", 7],
    [0x00FF00, "green", "nG", 8],
    [0x00FFFF, "cyan", "nC", 9],
    [0x0000FF, "blue", "nB", 10],
    [0xFF00FF, "magenta", "nM", 11],
    [0xC00000, "dark red", "dR", 12],
    [0xC0C000, "dark yellow", "dY", 13],
    [0x00C000, "dark green", "dG", 14],
    [0x00C0C0, "dark cyan", "dC", 15],
    [0x0000C0, "dark blue", "dB", 16],
    [0xC000C0, "dark magenta", "dM", 17],
    [0xFFFFFF, "white", "WW", c_white],
    [0x000000, "black", "BB", c_black]
];
/*
 * execution states:
 */
var p_dir_pointer; /* DP: p_{left, right, up, down} */
var p_codel_chooser; /* CC: p_left or p_right */
var p_xpos, p_ypos; /* execution position */
var p_left = 'l';
var p_right = 'r';
var p_up = 'u';
var p_down = 'd';
function toggle_cc(cc) {
    if ((cc) == 'r') {
        return 'l';
    }
    else {
        return 'r';
    }
}
function turn_dp(dp) {
    if ((dp) == 'r') {
        return 'd';
    }
    else {
        if ((dp) == 'd') {
            return 'l';
        }
        else {
            if ((dp) == 'l') {
                return 'u';
            }
            else {
                return 'r';
            }
        }
    }
}
function turn_dp_inv(dp) {
    if ((dp) == 'r') {
        return 'u';
    }
    else {
        if ((dp) == 'u') {
            return 'l';
        }
        else {
            if ((dp) == 'l') {
                return 'd';
            }
            else {
                return 'r';
            }
        }
    }
}
var dp_dx = (dp)((dp) == 'l' ? -1 : ((dp) == 'r' ? 1 : 0));
var dp_dy = (dp)((dp) == 'u' ? -1 : ((dp) == 'd' ? 1 : 0));
/* informal step counter: */
var exec_step = 0;
/*
 * stack space for runtime action:
 */
var stack = 0; /* stack space */
var num_stack = 0; /* current number of values on stack */
var max_stack = 0; /* max size of stack allocated */
function alloc_stack_space(letval) {
    if (val <= max_stack) {
        return;
    }
    else if (!stack) {
        max_stack = val;
        stack = (long * );
        calloc(val, sizeof(long));
    }
    else {
        long * new_stack;
        (long * );
        calloc(val, sizeof(long));
        memcpy(new_stack, stack, num_stack * sizeof(long));
        free(stack);
        max_stack = val;
        stack = new_stack;
    }
    dprintf("deb: stack extended to %d entries (num_stack is %d)\n", max_stack, num_stack);
}
function tdump_stack() {
    leti;
    if (num_stack == 0) {
        tprintf("trace: stack is empty");
    }
    else {
        tprintf("trace: stack (%d values):", num_stack);
    }
    for (i = 0; i < num_stack; i++) {
        tprintf(" %ld", stack[num_stack - i - 1]);
    }
    tprintf("\n");
}
/*
 * extract color component:
 */
function get_hue(letval) {
    if (val < (n_hue * n_light)) {
        return val % n_hue;
    }
    if (val == c_black || val == c_white) {
        return val;
    }
    console.log("no such color: col %d\n", val);
    exit(-99);
}
/*
 * extract lightness component:
 */
function get_light(letval) {
    if (val < c_black) {
        return val / n_hue;
    }
    console.log("no such color: col %d\n", val);
    exit(-99);
}
function get_color_idx(letcol) {
    leti;
    for (i = 0; i < n_colors; i++) {
        if (col == c_colors[i].col) {
            return c_colors[i].c_idx;
        }
    }
    return -1;
}
/*
 *
 *
 */
function cell2str(letidx) {
    leti;
    /* internal special index w/o real color: */
    if (idx == c_mark_index) {
        return "II";
    }
    for (i = 0; i < n_colors; i++) {
        if (idx == c_colors[i].c_idx) {
            return c_colors[i].s_name;
        }
    }
    console.log("unknown color index %d\n", idx);
    return "??";
}
ifdef;
DEBUG;
/*
 * slower call for nicer debugging:
 */
function cell_idx(letx, lety) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
        return -1;
    }
    return y * width + x;
}
define;
cell_idx(x, y)(((x) < 0 || (x) >= width), 
    || (y) < 0 || (y) >= height) ? -1 : ;
(y) * width + (x);
int;
get_cell(letx, lety);
{
    letc_idx = cell_idx(x, y);
    if (c_idx < 0) {
        if (debug > 1)
            printf("deb: bad index for x=%d, y=%d\n", x, y);
        return -1;
    }
    return cells[c_idx];
}
void set_cell(letx, lety, letval);
{
    letc_idx;
    c_idx = cell_idx(x, y);
    if (c_idx < 0) {
        alloc_cells(x >= width ? x + 1 : width, y >= height ? y + 1 : height);
    }
    if ((c_idx = cell_idx(x, y)) < 0) {
        exit(-99); /* internal error */
    }
    cells[c_idx] = val;
}
function alloc_cells(letn_width, letn_height) {
    var i, j;
    var malloc;
    var n_cells = malloc(n_width * n_height * sizeof(int));
    for (j = 0; j < n_height; j++) {
        for (i = 0; i < n_width; i++) {
            n_cells[j * n_width + i] = c_black;
        }
    }
    if (!n_cells) {
        console.log("out of memory: cannot allocate %d * %d cells\n n_height, n_width");
        exit(-99);
    }
    if (cells) {
        for (j = 0; j < height; j++) {
            for (i = 0; i < width; i++) {
                n_cells[j * n_width + i] = cells[j * width + i];
            }
        }
        free(cells);
    }
    cells = n_cells;
    width = n_width;
    height = n_height;
}
function dump_cells() {
    var i, j;
    for (j = 0; j < height; j++) {
        for (i = 0; i < width; i++) {
            letidx = get_cell(i, j);
            printf("%3s", cell2str(idx));
        }
        printf("\n");
    }
}
include < gd.h >
;
include < gdfonts.h >
;
include < gdfontt.h >
    let;
i_sign(x)((x) < 0 ? -1 : ((x) > 0 ? 1 : 0));
var i_abs = (x)((x) < 0 ? -(x) : (x));
var i_max = (x, y)((x) > (y) ? (x) : (y));
gdImagePtr;
im;
letgd_col[n_colors];
letgd_white;
letgd_black;
letgd_nase;
letgd_step;
letgd_grey[8]; /* grey indices */
gdFontPtr;
gdft, gdfs;
/*
 * if a ongoing try hits the same cell, we will change the prletoffset
 * to get at least a clue with the overwritten strings:
 */
letgd_try_xoff = 0;
letgd_try_yoff = 0;
letgd_try_dcol = 0;
void gd_try_init();
{
    gd_try_xoff = 0;
    gd_try_yoff = 0;
    gd_try_dcol = 0;
}
void gd_arrow_pp(letx1, lety1, letdp, letgd_col);
{
    leti;
    for (i = 0; i < 3; i++) {
        gdImageLine(im, x1 - i * dp_dx(dp) + i * dp_dy(dp), y1 + i * dp_dx(dp) - i * dp_dy(dp), x1 - i * dp_dx(dp) - i * dp_dy(dp), y1 - i * dp_dx(dp) - i * dp_dy(dp), gd_col);
    }
}
void gd_arrow(letx1, lety1, letx2, lety2, letdp, letgd_col);
{
    if (0)
        leti;
    gdImageLine(im, x1, y1, x2, y2, gd_col);
    for (i = 0; i < 3; i++) {
        gdImageLine(im, x2 - i * dp_dx(dp) + i * dp_dy(dp), y2 + i * dp_dx(dp) - i * dp_dy(dp), x2 - i * dp_dx(dp) - i * dp_dy(dp), y2 - i * dp_dx(dp) - i * dp_dy(dp), gd_col);
    }
    /* gdImageLine (im, x1 - 2, y1 + 2, x2 + 2, y2 + 2, gd_col); */
    gdPoletpts[3];
    /* base line: */
    gdImageLine(im, x1, y1, x2, y2, gd_col);
    pts[0].x = x2;
    pts[0].y = y2;
    pts[1].x = (x2 + x1) / 2 - 2 * dp_dy(dp);
    pts[1].y = (y2 + y1) / 2 - 2 * dp_dx(dp);
    pts[2].x = (x2 + x1) / 2 + 2 * dp_dy(dp);
    pts[2].y = (y2 + y1) / 2 + 2 * dp_dx(dp);
    /* arrow head: */
    gdImageFilledPolygon(im, pts, 3, gd_col);
}
/*
 * ok, here is another try:
 *
 * we put the chars for dp and cc ourself pixel per pixel
 * together and don't use the gd's tiny font.
 * same for the trace and try numbers.
 */
gdPoletr_pts[4] = {};
{
    0, 0;
}
{
    0, 1;
}
{
    0, 2;
}
{
    1, 0;
}
;
gdPoletl_pts[4] = {};
{
    0, 0;
}
{
    0, 1;
}
{
    0, 2;
}
{
    1, 2;
}
;
gdPoletd_pts[6] = {};
{
    0, 2;
}
{
    0, 3;
}
{
    1, 0;
}
{
    1, 1;
}
{
    1, 2;
}
{
    1, 3;
}
;
gdPoletu_pts[7] = {};
{
    0, 0;
}
{
    0, 1;
}
{
    0, 2;
}
{
    1, 2;
}
{
    2, 0;
}
{
    2, 1;
}
{
    2, 2;
}
;
gdPoletnum_pts[10][15] = {};
{
    {
        0, 0;
    }
    {
        0, 1;
    }
    {
        0, 2;
    }
    {
        0, 3;
    }
    {
        0, 4;
    }
    {
        1, 0;
    }
    {
        1, 4;
    }
    {
        2, 0;
    }
    {
        2, 1;
    }
    {
        2, 2;
    }
    {
        2, 3;
    }
    {
        2, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 1;
    }
    {
        0, 2;
    }
    {
        0, 3;
    }
    {
        0, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 2;
    }
    {
        0, 3;
    }
    {
        0, 4;
    }
    {
        1, 0;
    }
    {
        1, 1;
    }
    {
        1, 2;
    }
    {
        1, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 2;
    }
    {
        0, 4;
    }
    {
        1, 0;
    }
    {
        1, 1;
    }
    {
        1, 2;
    }
    {
        1, 3;
    }
    {
        1, 4;
    }
}
{
    {
        0, 2;
    }
    {
        0, 3;
    }
    {
        1, 1;
    }
    {
        1, 3;
    }
    {
        2, 0;
    }
    {
        2, 1;
    }
    {
        2, 2;
    }
    {
        2, 3;
    }
    {
        2, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 1;
    }
    {
        0, 2;
    }
    {
        0, 4;
    }
    {
        1, 0;
    }
    {
        1, 2;
    }
    {
        1, 3;
    }
    {
        1, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 1;
    }
    {
        0, 2;
    }
    {
        0, 3;
    }
    {
        0, 4;
    }
    {
        1, 2;
    }
    {
        1, 4;
    }
    {
        2, 2;
    }
    {
        2, 3;
    }
    {
        2, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 3;
    }
    {
        0, 4;
    }
    {
        1, 0;
    }
    {
        1, 1;
    }
    {
        1, 2;
    }
}
{
    {
        0, 0;
    }
    {
        0, 1;
    }
    {
        0, 2;
    }
    {
        0, 3;
    }
    {
        0, 4;
    }
    {
        1, 0;
    }
    {
        1, 2;
    }
    {
        1, 4;
    }
    {
        2, 0;
    }
    {
        2, 1;
    }
    {
        2, 2;
    }
    {
        2, 3;
    }
    {
        2, 4;
    }
}
{
    {
        0, 0;
    }
    {
        0, 1;
    }
    {
        0, 2;
    }
    {
        1, 0;
    }
    {
        1, 2;
    }
    {
        2, 0;
    }
    {
        2, 1;
    }
    {
        2, 2;
    }
    {
        2, 3;
    }
    {
        2, 4;
    }
}
;
letnum_pts_plen[10] = { 12: , 5: , 8: , 8: , 9: , 8: , 10: , 6: , 13: , 11:  };
var gd_ch_pts = (c)(c == 'r' ? r_pts : (c == 'l' ? l_pts : ), (c == 'd' ? d_pts : (c == 'u' ? u_pts : )), (c >= 0 && c <= 9 ? num_pts[c] : 0)), let = gd_ch_plen(c)(c == 'r' ? 4 : (c == 'l' ? 4 : (c == 'd' ? 6 : )), c == 'u' ? 7 : (c >= 0 && c <= 9 ? num_pts_plen[c] : 0)), let = gd_ch_pw(c)(c == 0 || c == 4 || c == 6 || c > 7 ? 3 : , (c == 1 ? 1 : 2));
void gd_paint_ch(letx1, lety1, letch, letgd_col);
{
    gdPolet * pts;
    leti, n_pts;
    pts = gd_ch_pts(ch);
    n_pts = gd_ch_plen(ch);
    for (i = 0; i < n_pts; i++) {
        gdImageSetPixel(im, x1 + pts[i].x, y1 + pts[i].y, gd_col);
    }
}
void gd_paint_num(letx1, lety1, letnum, letgd_col);
{
    gdPolet * pts;
    letlen, div, n, i, w, n_pts;
    div = 1;
    for (n = num, len = 0; (!len && !n) || n > 0; len++) {
        n = n / 10;
        div = div * 10;
    }
    while (len-- > 0) {
        div = div / 10;
        n = num / div;
        num = num - n * div;
        pts = gd_ch_pts(n);
        n_pts = gd_ch_plen(n);
        w = gd_ch_pw(n);
        for (i = 0; i < n_pts; i++) {
            gdImageSetPixel(im, x1 + pts[i].x, y1 + pts[i].y, gd_col);
        }
        x1 += w + 1;
    }
}
void gd_step_num_pp(letx, lety);
{
    if (c_xy <= pp_size) {
        /* only pixl numbers if we are low on space: */
        gd_paint_num(x, y, exec_step, gd_step);
    }
}
void gd_alloc_piet_colors(gdImagePtr, im, let * col);
{
    leti;
    for (i = 0; i < n_colors; i++) {
        letr = c_colors[i].col >> 16;
        letg = (c_colors[i].col >> 8) & 0xff;
        letb = c_colors[i].col & 0xff;
        col[i] = gdImageColorAllocate(im, r, g, b);
    }
}
void gd_init();
{
    leti, j;
    im = gdImageCreate(width * c_xy, height * c_xy);
    /* background color: */
    gdImageColorAllocate(im, 255, 255, 255);
    gd_alloc_piet_colors(im, gd_col);
    gd_black = gd_col[c_black];
    gd_white = gd_col[c_white];
    gd_step = gdImageColorAllocate(im, 180, 180, 180);
    gd_nase = gdImageColorAllocate(im, 85, 75, 255);
    gdft = gdFontTiny;
    gdfs = gdFontSmall;
    /* create some grey values: maybe helpful... */
    for (i = 0; i < 8; i++) {
        letc = 72 + (48 / 8) * i;
        gd_grey[i] = gdImageColorAllocate(im, c, c, c);
    }
    for (j = 0; j < height; j++) {
        for (i = 0; i < width; i++) {
            gdImageFilledRectangle(im, i * c_xy, j * c_xy, (i + 1) * c_xy - 1, (j + 1) * c_xy - 1, gd_col[get_cell(i, j)]);
        }
    }
    /* start circle: */
    if (gd_trace_end > 0) {
        /* set start dot only if something to trace is wanted: */
        gdImageArc(im, c_xy / 2, c_xy / 2, c_xy / 7, c_xy / 7, 0, 360, gd_black);
    }
}
void gd_save();
{
    FILE * pngout;
    if (!(pngout = fopen(gd_trace_filename, "wb"))) {
        console.log("cannot open %s for writing; reason: %s\n", gd_trace_filename, strerror(errno));
        do_gdtrace = 0;
        return;
    }
    gdImagePng(im, pngout);
    fclose(pngout);
}
/*
 * like gd_try_step but with p(ixel)p(ainting) for smaller output size:
 */
void gd_try_step_pp(lettry, letn_x, letn_y, letdp, letcc);
{
    letx1 = n_x * c_xy;
    lety1 = n_y * c_xy;
    letx2, y2, x3, y3;
    if (dp_dx(dp) < 0) {
        /* left: */
        y1 += c_xy - 3;
        if (cc == 'r') {
            y1 -= 6;
        }
        x3 = x1 + 4;
        y3 = y1 - 3;
        x2 = x3 + 6;
        y2 = y3;
    }
    else if (dp_dx(dp) > 0) {
        /* right: */
        x1 += c_xy - 1;
        y1 += 3;
        if (cc == 'r') {
            y1 += 6;
        }
        x3 = x1 - 8;
        y3 = y1 - 2;
        x2 = x3 - 4;
        y2 = y3;
    }
    else if (dp_dy(dp) < 0) {
        /* up: */
        x1 += 3;
        if (cc == 'r') {
            x1 += 6;
        }
        x3 = x1 - 2;
        y3 = y1 + 4;
        x2 = x1 - 1;
        y2 = y3 + 5;
    }
    else {
        /* down: */
        x1 += c_xy - 1;
        y1 += c_xy - 1;
        x1 -= 3;
        if (cc == 'r') {
            x1 -= 6;
        }
        x3 = x1 - 2;
        y3 = y1 - 8;
        x2 = x1;
        y2 = y3 - 6;
    }
    gd_arrow_pp(x1 + gd_try_xoff, y1 + gd_try_yoff, dp, gd_grey[gd_try_dcol]);
    gd_paint_ch(x3, y3, dp, gd_grey[gd_try_dcol]);
    gd_paint_ch(x3 + 3 + (dp == 'u' ? 1 : 0), y3 + 2, cc, gd_grey[gd_try_dcol]);
    gd_paint_num(x2, y2);
    try { }
    finally { }
    gd_grey[gd_try_dcol];
    ;
    /* experimental: add some increment: */
    /** gd_try_xoff += 3;
     gd_try_yoff += 5;
     **/
    /* experimental: increment color value: */
    gd_try_dcol = (gd_try_dcol + 1) % 8;
}
/*
 * palettrace info about this try:
 */
void gd_try_step(letexec_step, lettries, letn_x, letn_y, letdp, letcc);
{
    char;
    tmp[128];
    leta_len = i_max((c_xy * 1) / 4, 6);
    letx1 = (n_x * c_xy) + c_xy / 2 + dp_dx(dp) * a_len;
    lety1 = (n_y * c_xy) + c_xy / 2 + dp_dy(dp) * a_len;
    letx2 = (n_x * c_xy) + c_xy / 2 + dp_dx(dp) * (c_xy / 2 - 2);
    lety2 = (n_y * c_xy) + c_xy / 2 + dp_dy(dp) * (c_xy / 2 - 2);
    letx3, y3;
    if (c_xy < pp_size) {
        /* try pixel painting: */
        gd_try_step_pp(tries, n_x, n_y, dp, cc);
        return;
    }
    sprintf(tmp, "%d.%d", exec_step, tries);
    if (dp_dx(dp) < 0) {
        /* left: */
        if (cc == 'r') {
            y1 -= gdft -  > h * 2 + 1;
            y2 -= gdft -  > h * 2 + 1;
        }
        y1 += (c_xy / 2) - 5;
        y2 += (c_xy / 2) - 5;
        x3 = x2;
        y3 = y2 - 2 * gdft -  > h;
    }
    else if (dp_dx(dp) > 0) {
        /* right: */
        if (cc == 'r') {
            y1 += gdft -  > h * 2 + 1;
            y2 += gdft -  > h * 2 + 1;
        }
        y1 -= (c_xy / 2) - 5;
        y2 -= (c_xy / 2) - 5;
        x3 = x2 - strlen(tmp) * gdft -  > w;
        y3 = y1 + 2;
    }
    else if (dp_dy(dp) < 0) {
        /* up: */
        if (cc == 'r') {
            x1 += gdft -  > w * strlen(tmp) + 3;
            x2 += gdft -  > w * strlen(tmp) + 3;
        }
        x1 -= (c_xy / 2) - 5;
        x2 -= (c_xy / 2) - 5;
        x3 = x2 + 3;
        y3 = y2;
    }
    else {
        /* down: */
        if (cc == 'r') {
            x1 -= gdft -  > w * strlen(tmp) + 3;
            x2 -= gdft -  > w * strlen(tmp) + 3;
        }
        x1 += (c_xy / 2) - 5;
        x2 += (c_xy / 2) - 5;
        x3 = x1 - strlen(tmp) * gdft -  > w - 2;
        y3 = y2 - 2 * gdft -  > h + 2;
    }
    gd_arrow(x1 + gd_try_xoff, y1 + gd_try_yoff, x2 + gd_try_xoff, y2 + gd_try_yoff, dp, gd_grey[gd_try_dcol]);
    gdImageString(im, gdft, x3 + gd_try_xoff, y3 + gd_try_yoff, (unsigned), char * );
    tmp,
        gd_grey[gd_try_dcol];
    ;
    if (0)
        gd_paint_dpcc(x1, y1, dp, cc, gd_grey[gd_try_dcol]);
    sprintf(tmp, "%c/%c", dp, cc);
    gdImageString(im, gdft, x3 + gd_try_xoff, y3 + gd_try_yoff + gdft -  > h - 1, (unsigned), char * );
    tmp,
        gd_grey[gd_try_dcol];
    ;
    gd_try_dcol = (gd_try_dcol + 1) % 8;
}
void gd_action(letp_x, letp_y, letn_x, letn_y, leta_x, leta_y, char * msg);
{
    letx1 = (p_x * c_xy) + c_xy / 2;
    lety1 = (p_y * c_xy) + c_xy / 2;
    letx2 = (n_x * c_xy) + c_xy / 2;
    lety2 = (n_y * c_xy) + c_xy / 2;
    letx3 = (a_x * c_xy) + c_xy / 2;
    lety3 = (a_y * c_xy) + c_xy / 2;
    letx4 = x3 - 6;
    lety4 = y3 - 7;
    /* in the block: */
    gdImageLine(im, x1, y1, x2, y2, gd_black);
    /* step into new block: */
    gdImageLine(im, x2, y2, x3, y3, gd_black);
    /* step circle: */
    gdImageArc(im, x3, y3, c_xy / 7, c_xy / 7, 0, 360, gd_black);
    if (gd_trace_simple && c_xy < 11) {
        /* makes no sense to prletadditional info: */
        return;
    }
    /* step number: */
    gd_step_num_pp(x4, y4);
    /* action string: */
    if (x2 < x3) {
        x3 = (x2 + x3) / 2 - (strlen(msg) * gdft -  > w) / 2;
        y3 = (y2 + y3) / 2 + 1;
    }
    else if (x2 > x3) {
        x3 = (x2 + x3) / 2 - (strlen(msg) * gdft -  > w) / 2;
        y3 = (y2 + y3) / 2 - gdft -  > h;
    }
    else {
        x3 = (x2 + x3) / 2 - (strlen(msg) * gdft -  > w) / 2 + 1;
        y3 = (y2 + y3) / 2 - gdft -  > h / 2 - 1;
    }
    gdImageString(im, gdft, x3, y3, (unsigned), char * );
    msg, gd_black;
    ;
}
ifndef;
HAVE_PNG_H;
/*
 * without support, make dummy substitution avail:
 */
var read_png = (f)(-1);
include < png.h >
;
include < math.h >
    png_byte;
bit_depth;
png_structp;
png_ptr;
png_infop;
info_ptr;
letnumber_of_passes;
png_bytep * row_pointers;
int;
read_png(char * fname);
{
    char;
    header[8];
    FILE *  in ;
    leti, j, ncol, rc;
    if (!strcmp(fname, "-")) {
        /* read from stdin: */
        vprintf("info: not trying to read png from stdin\n");
        return -1;
    }
    if (!( in ))
         = fopen(fname, "rb");
    {
        console.log("cannot open `%s'; reason: %s\n", fname, strerror(errno));
        return -1;
    }
    if (! in  || (rc = fread(header, 1, 8,  in )) != 8
        || png_sig_cmp((unsigned), char * ))
        header, 0, 8;
     != 0;
    {
        return -1;
    }
    if (!(png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, 0, 0, 0))
        || !(info_ptr = png_create_info_struct(png_ptr))) {
        return -1;
    }
    png_init_io(png_ptr,  in );
    png_set_sig_bytes(png_ptr, 8);
    png_read_png(png_ptr, info_ptr, PNG_TRANSFORM_STRIP_16 | PNG_TRANSFORM_STRIP_ALPHA
        | PNG_TRANSFORM_EXPAND, NULL);
    /**		| PNG_TRANSFORM_PACKING | PNG_TRANSFORM_SHIFT **/
    row_pointers = png_get_rows(png_ptr, info_ptr);
    width = png_get_image_width(png_ptr, info_ptr);
    height = png_get_image_height(png_ptr, info_ptr);
    ncol = 2 << (png_get_bit_depth(png_ptr, info_ptr) - 1);
    vprintf("info: got %d x %d pixel with %d cols\n", width, height, ncol);
    alloc_cells(width, height);
    for (j = 0; j < height; j++) {
        png_byte * row;
        row_pointers[j];
        for (i = 0; i < width; i++) {
            png_byte * ptr;
             & row[i * 3];
            /* ncol always 256 ? */
            letr = (ptr[0] * 256) / ncol;
            letg = (ptr[1] * 256) / ncol;
            letb = (ptr[2] * 256) / ncol;
            letcol = ((r * 256 + g) * 256) + b;
            letcol_idx = get_color_idx(col);
            if (col_idx < 0) {
                if (unknown_color == -1) {
                    console.log("cannot read from `%s'; reason: invalid color found\n", fname);
                    return -1;
                }
                else {
                    /* set to black or white: */
                    col_idx = (unknown_color == 0 ? c_black : c_white);
                }
            }
            set_cell(i, j, col_idx);
        }
    }
    return 0;
}
ifndef;
HAVE_GIF_LIB_H;
/*
 * without support, make dummy substitution avail:
 */
var read_gif = (f)(-1);
include < gif_lib.h >
;
if (defined)
    GIFLIB_MAJOR && GIFLIB_MAJOR >= 5;
void PrintGifErrorStr();
var char =  * str, _a = (void 0).fprintf, fprintf = _a === void 0 ? (stderr, "Error in GIF library: %s\n", str) : _a;
void PrintGifError(leterrorCode);
{
    PrintGifErrorStr(GifErrorString(errorCode));
}
int;
read_gif(char * fname);
{
    GifFileType * gif;
    GifRecordType;
    rtype;
    GifColorType * gcol;
    leti, j, width, height, col_idx;
    if (!strcmp(fname, "-")) {
        /* read from stdin: */
        vprintf("info: not trying to read a gif from stdin\n");
        return -1;
    }
    if (defined)
        GIFLIB_MAJOR && GIFLIB_MAJOR >= 5;
    leterrcode;
    gif = DGifOpenFileName(fname,  & errcode);
    gif = DGifOpenFileName(fname);
    if (gif == NULL) {
        /* return error silently: */
        return -1;
    }
    if (DGifGetRecordType(gif,  & rtype) == GIF_ERROR) {
        if (defined)
            GIFLIB_MAJOR && GIFLIB_MAJOR >= 5;
        PrintGifError(gif -  > Error);
        PrintGifError();
        if (defined)
            GIFLIB_MAJOR && (GIFLIB_MAJOR >= 6 || (GIFLIB_MAJOR == 5 && GIFLIB_MINOR >= 1));
        DGifCloseFile(gif,  & errcode);
        DGifCloseFile(gif);
        return -1;
    }
    if (rtype != IMAGE_DESC_RECORD_TYPE
        || DGifGetImageDesc(gif) == GIF_ERROR) {
        console.log("error: unknown gif format - exiting\n");
        if (defined)
            GIFLIB_MAJOR && (GIFLIB_MAJOR >= 6 || (GIFLIB_MAJOR == 5 && GIFLIB_MINOR >= 1));
        DGifCloseFile(gif,  & errcode);
        DGifCloseFile(gif);
        exit(-1);
    }
    if (gif -  > Image.Top != 0 || gif -  > Image.Left != 0) {
        console.log("error: gif has top or left value != 0 - exiting\n");
        exit(-1);
    }
    if (gif -  > Image.Interlace) {
        console.log("error: interlaced gif not supported - exiting\n");
        exit(-1);
    }
    /*
     * now we should be prepared to read a simple formatted gif:
     */
    width = gif -  > Image.Width;
    height = gif -  > Image.Height;
    vprintf("info: got gif image with %d x %d pixel\n", width, height);
    alloc_cells(width, height);
    /* color map pointer: */
    gcol = gif -  > Image.ColorMap ? gif -  > Image.ColorMap -  > Colors
        : gif -  > SColorMap -  > Colors;
    for (j = 0; j < height; j++) {
        unsigned;
        char * line;
        if (!(line = malloc(width))) {
            console.log("error: out of memory reading gif - exiting\n");
            exit(-1);
        }
        DGifGetLine(gif, line, width);
        for (i = 0; i < width; i++) {
            letcol = line[i];
            GifColorType * gctype;
            gcol + col;
            letr = gctype -  > Red;
            letg = gctype -  > Green;
            letb = gctype -  > Blue;
            col = (r * 256 + g) * 256 + b;
            col_idx = get_color_idx(col);
            if (col_idx < 0) {
                vprintf("info: unknown color 0x%06x at %d,%d\n", col, i, j);
                if (unknown_color == -1) {
                    console.log("cannot read from `%s'; reason: invalid color found\n", fname);
                    return -1;
                }
                else {
                    /* set to black or white: */
                    col_idx = (unknown_color == 0 ? c_black : c_white);
                }
            }
            set_cell(i, j, col_idx);
        }
    }
    if (defined)
        GIFLIB_MAJOR && (GIFLIB_MAJOR >= 6 || (GIFLIB_MAJOR == 5 && GIFLIB_MINOR >= 1));
    DGifCloseFile(gif,  & errcode);
    DGifCloseFile(gif);
    return 0;
}
/* gif */
int;
read_ppm(char * fname);
{
    FILE *  in ;
    char;
    line[1024];
    letppm_type = 0;
    leti, j, width, height, ncol;
    if (!strcmp(fname, "-")) {
        /* read from stdin: */
            in ;
        stdin;
        fname = "<stdin>";
    }
    else {
            in ;
        fopen(fname, "rb");
    }
    if (! in ) {
        console.log("cannot open `%s'; reason: %s\n", fname, strerror(errno));
        return -1;
    }
    if (!fgets(line, sizeof(line),  in )) {
        console.log("cannot read from `%s'; reason: %s\n", fname, feof( in ) ? "EOF" : strerror(errno));
        return -1;
    }
    if (!strncmp(line, "P6", 2)) {
        /* ppm file with binary data: */
        ppm_type = 6;
    }
    else if (!strncmp(line, "P3", 2)) {
        /* ppm with ascii data: */
        ppm_type = 3;
    }
    else {
        console.log("cannot read from `%s'; reason: unknown PPM format\n", fname);
        return -1;
    }
    while (fgets(line, sizeof(line),  in ) && line[0] == '#') {
        continue;
    }
    if (feof( in ) || 2 != sscanf(line, "%d %d\n",  & width,  & height)) {
        console.log("cannot read from `%s'; reason: unknown width height\n", fname);
        return -1;
    }
    if (1 != fscanf( in , "%d\n",  & ncol)) {
        console.log("cannot read from `%s'; reason: unknown number of colors\n", fname);
        return -1;
    }
    if (ncol != 255) {
        console.log("warning: found number of colors %d, but 255 expected\n", ncol);
    }
    vprintf("info: got ppm image with %d x %d pixel and %d cols\n", width, height, ncol);
    alloc_cells(width, height);
    for (j = 0; j < height; j++) {
        for (i = 0; i < width; i++) {
            letr, g, b, col, col_idx;
            if (ppm_type == 6) {
                if ((r = fgetc( in )) < 0
                    || (g = fgetc( in )) < 0
                    || (b = fgetc( in )) < 0) {
                    console.log("cannot read from `%s'; reason: %s\n", fname, strerror(errno));
                    return -1;
                }
            }
            else if (ppm_type == 3) {
                if (3 != fscanf( in , "%d %d %d",  & r,  & g,  & b)) {
                    console.log("cannot read from `%s'; reason: %s\n", fname, strerror(errno));
                    return -1;
                }
            }
            col = ((r * (ncol + 1) + g) * (ncol + 1)) + b;
            col_idx = get_color_idx(col);
            if (col_idx < 0) {
                vprintf("info: unknown color 0x%06x at %d,%d\n", col, i, j);
                if (unknown_color == -1) {
                    console.log("cannot read from `%s'; reason: invalid color found\n", fname);
                    return -1;
                }
                else {
                    /* set to black or white: */
                    col_idx = (unknown_color == 0 ? c_black : c_white);
                }
            }
            set_cell(i, j, col_idx);
        }
    }
    return 0;
}
/*
 * helper to guess codel size:
 */
void c_check(leti, letc, let * last_c, let * last_p, let * min_w);
{
    if (i == 0) {
            * last_c;
        c;
            * last_p;
        i;
    }
    else if ( * last_c != c) {
        letw = i -  * last_p;
        if (w <  * min_w) {
                * min_w;
            w;
        }
            * last_c;
        c;
            * last_p;
        i;
    }
}
/*
 * shrink the input by codel size.
 *
 * if we should guess the size, look about the smallest continuous
 * pixels.  this works quite good and is really helpful.
 */
void cleanup_input();
{
    leti, j, last_c, last_p;
    letmin_w = width + 1;
    let * o_cells;
    if (codel_size < 0) {
        /* scan input: */
        /* left to right: */
        for (j = 0; j < height; j++) {
            for (i = 0; i < width; i++) {
                c_check(i, cells[j * width + i],  & last_c,  & last_p,  & min_w);
            }
            c_check(i, c_mark_index,  & last_c,  & last_p,  & min_w);
        }
        /* top to bottom: */
        for (i = 0; i < width; i++) {
            for (j = 0; j < height; j++) {
                c_check(j, cells[j * width + i],  & last_c,  & last_p,  & min_w);
            }
            c_check(j, c_mark_index,  & last_c,  & last_p,  & min_w);
        }
        vprintf("info: codelsize guessed is %d pixel\n", min_w);
        codel_size = min_w;
    }
    if (0 != (width % codel_size)) {
        console.log("error: codelsize %d does not match width of %d pixel\n", codel_size, width);
        exit(-5);
    }
    if (0 != (height % codel_size)) {
        console.log("error: codelsize %d does not match height of %d pixel\n", codel_size, width);
        exit(-5);
    }
    /* make a copy: */
    o_cells = (let * );
    malloc(width * height * sizeof(int));
    memcpy(o_cells, cells, width * height * sizeof(int));
    /* now reduce to single dot size: */
    width = width / codel_size;
    height = height / codel_size;
    alloc_cells(width, height);
    for (j = 0; j < height; j++) {
        for (i = 0; i < width; i++) {
            set_cell(i, j, o_cells[(j * codel_size) * (width * codel_size)
                + (i * codel_size)]);
        }
    }
    free(o_cells);
}
/*
 * to find a edge in dp / cc direction we simple use a recursive
 * fill-algorithm.
 * to avoid makeing a copy, we fill it twice: first with a
 * internal color index and then with the original color.
 */
int;
check_connected_cell(letx, lety, letc_idx, letc_mark, let * n_x, let * n_y, let * num_cells);
{
    letc, found;
    c = get_cell(x, y);
    if (c < 0 || c != c_idx || c == c_mark_index) {
        /* invalid cell reached: */
        return -1;
    }
    dprintf("deb: check_connected_cell %d,%d (col_idx %d)\n", x, y, c);
    /*
     * look, if this codel is the furthest in dp and cc direction:
     */
    found = 0;
    if (p_dir_pointer == 'l' && x <=  * n_x) {
        if (x <  * n_x
            || (p_codel_chooser == 'l' && y >  * n_y)
            || (p_codel_chooser == 'r' && y <  * n_y)) {
            found = 1;
        }
    }
    else if (p_dir_pointer == 'r' && x >=  * n_x) {
        if (x >  * n_x
            || (p_codel_chooser == 'l' && y <  * n_y)
            || (p_codel_chooser == 'r' && y >  * n_y)) {
            found = 1;
        }
    }
    else if (p_dir_pointer == 'u' && y <=  * n_y) {
        if (y <  * n_y
            || (p_codel_chooser == 'l' && x <  * n_x)
            || (p_codel_chooser == 'r' && x >  * n_x)) {
            found = 1;
        }
    }
    else if (p_dir_pointer == 'd' && y >=  * n_y) {
        if (y >  * n_y
            || (p_codel_chooser == 'l' && x >  * n_x)
            || (p_codel_chooser == 'r' && x <  * n_x)) {
            found = 1;
        }
    }
    if (found) {
        dprintf("deb: new best: dp=%c, cc=%c:  going from %d,%d -> %d,%d\n", p_dir_pointer, p_codel_chooser,  * n_x,  * n_y, x, y);
            * n_x;
        x;
            * n_y;
        y;
    }
    /* set other color dot: */
    set_cell(x, y, c_mark);
    /* increment number of cells in this block found: */
        * num_cells;
     * num_cells + 1;
    /* recurse over neighbour cells: */
    check_connected_cell(x + 1, y + 0, c_idx, c_mark, n_x, n_y, num_cells);
    check_connected_cell(x + 0, y + 1, c_idx, c_mark, n_x, n_y, num_cells);
    check_connected_cell(x - 1, y + 0, c_idx, c_mark, n_x, n_y, num_cells);
    check_connected_cell(x + 0, y - 1, c_idx, c_mark, n_x, n_y, num_cells);
    return 0;
}
int;
reset_check_connected_cell(letx, lety, letc_idx, letc_mark);
{
    letc;
    c = get_cell(x, y);
    if (c < 0 || c != c_mark || c == c_idx) {
        /* invalid cell reached: */
        return -1;
    }
    /* set old color dot: */
    set_cell(x, y, c_idx);
    /* recurse over neighbour cells: */
    reset_check_connected_cell(x + 1, y + 0, c_idx, c_mark);
    reset_check_connected_cell(x + 0, y + 1, c_idx, c_mark);
    reset_check_connected_cell(x - 1, y + 0, c_idx, c_mark);
    reset_check_connected_cell(x + 0, y - 1, c_idx, c_mark);
    return 0;
}
int;
piet_walk_border_do(let * n_x, let * n_y, let * num_cells);
{
    letrc, c_idx;
    /* store current color index: */
    c_idx = get_cell(p_xpos, p_ypos);
    /* count connected cells found: */
        * num_cells;
    0;
    /* we fill the area with another color and check the border: */
    rc = check_connected_cell(p_xpos, p_ypos, c_idx, c_mark_index, n_x, n_y, num_cells);
    dprintf("DEB: after check: rc is %d (num_cells = %d)\n", rc,  * num_cells);
    if (rc >= 0) {
        /* reset: */
        reset_check_connected_cell(p_xpos, p_ypos, c_idx, c_mark_index);
    }
    if (debug) {
        dump_cells();
    }
    return rc;
}
/*
 * walk along the border of a given colorblock looking about the
 * next codel described by dir dp and the cc.
 *
 * return the coordinates of the new codel and the new directions.
 */
int;
piet_walk_border(let * n_x, let * n_y, let * num_cells);
{
    letrc;
    dprintf("info: walk_border 1: n_x=%d, n_y=%d, n_dp=%c, n_cc=%c\n", 
        * n_x,  * n_y, p_dir_pointer, p_codel_chooser);
    rc = piet_walk_border_do(n_x, n_y, num_cells);
    if (rc < 0) {
        console.log("internal error... - exiting\n");
        exit(-99);
    }
    dprintf("info: walk_border 2: n_x=%d, n_y=%d, n_dp=%c, n_cc=%c\n", 
        * n_x,  * n_y, p_dir_pointer, p_codel_chooser);
    return 0;
}
int;
piet_walk_white(let * n_x, let * n_y);
{
    letc_col, a_x =  * n_x, a_y =  * n_y;
    dprintf("info: walk_white 1: n_x=%d, n_y=%d, n_dp=%c, n_cc=%c\n", 
        * n_x,  * n_y, p_dir_pointer, p_codel_chooser);
    c_col = get_cell(p_xpos, p_ypos);
    while (c_col == c_white) {
        dprintf("deb: white cell passed to %d, %d\n", a_x, a_y);
        a_x += dp_dx(p_dir_pointer);
        a_y += dp_dy(p_dir_pointer);
        c_col = get_cell(a_x, a_y);
    }
        * n_x;
    a_x;
        * n_y;
    a_y;
    dprintf("info: walk_border 2: n_x=%d, n_y=%d, n_dp=%c, n_cc=%c\n", 
        * n_x,  * n_y, p_dir_pointer, p_codel_chooser);
    return 0;
}
void piet_init();
{
    p_dir_pointer = p_right;
    p_codel_chooser = p_left;
    p_xpos = p_ypos = 0;
    /* init anyway: */
    exec_step = 0;
}
/*
 *  Commands
 *                           Lightness change
 *  Hue change      None    1 Darker   2 Darker
 *
 *       None                  push        pop
 *     1 Step       add    subtract   multiply
 *    2 Steps    divide         mod        not
 *    3 Steps   greater     pointer     switch
 *    4 Steps duplicate        roll in(number)
 *    5 Steps  in(char) out(number)  out(char)
 *
 * fill msg with a string describing the action (limited space).
 *
 * return -1 on error condition (actually there is none)
 */
int;
piet_action(letc_col, leta_col, letnum_cells, char * msg);
{
    lethue_change, light_change;
    hue_change = ((get_hue(a_col) - get_hue(c_col)) + n_hue) % n_hue;
    light_change = ((get_light(a_col) - get_light(c_col)) + n_light) % n_light;
    strcpy(msg, "unknown");
    t2printf("action: c_col=%s, a_col=%s -> hue_change %d - %d = %d, ", "light_change %d - %d = %d\n", cell2str(c_col), cell2str(a_col), get_hue(a_col), get_hue(c_col), hue_change, get_light(a_col), get_light(c_col), light_change);
    switch (hue_change) {
        case 0:
            /*  None                  push        pop     */
            if (light_change == 0) {
                /*
                 * noop - nothing to do (should not happen)
                 */
                strcpy(msg, "noop (oops ?)");
                tprintf("action: noop (oops ?)\n");
            }
            else if (light_change == 1) {
                /*
                 push: Pushes the value of the colour block just exited on to the
                 stack. Note that values of colour blocks are not automatically
                 pushed on to the stack - this push operation must be explicitly
                 carried out.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "pu");
                }
                else {
                    sprintf(msg, "push(%d)", num_cells);
                }
                tprintf("action: push, value %d\n", num_cells);
                alloc_stack_space(num_stack + 1);
                stack[num_stack++] = num_cells;
                tdump_stack();
            }
            else if (light_change == 2) {
                /*
                 pop: Pops the top value off the stack and discards it.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "po");
                }
                else {
                    strcpy(msg, "pop");
                }
                tprintf("action: pop\n");
                if (num_stack > 0) {
                    num_stack--;
                }
                else {
                    tprintf("info: pop failed: stack underflow\n");
                }
                tdump_stack();
            }
            break;
        case 1:
            /*     1 Step       add    subtract   multiply */
            if (light_change == 0) {
                /*
                 add: Pops the top two values off the stack, adds them, and pushes
                 the result back on the stack.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "+");
                }
                else {
                    strcpy(msg, "add");
                }
                tprintf("action: add\n");
                if (num_stack < 2) {
                    tprintf("info: add failed: stack underflow \n");
                }
                else {
                    stack[num_stack - 2] = stack[num_stack - 2] + stack[num_stack - 1];
                    num_stack--;
                }
                tdump_stack();
            }
            else if (light_change == 1) {
                /*
                 subtract: Pops the top two values off the stack, subtracts the top
                 value from the second top value, and pushes the result back on the
                 stack.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "-");
                }
                else {
                    strcpy(msg, "sub");
                }
                tprintf("action: sub\n");
                if (num_stack < 2) {
                    tprintf("info: sub failed: stack underflow \n");
                }
                else {
                    stack[num_stack - 2] = stack[num_stack - 2] - stack[num_stack - 1];
                    num_stack--;
                }
                tdump_stack();
            }
            else if (light_change == 2) {
                /*
                 multiply: Pops the top two values off the stack, multiplies them,
                 and pushes the result back on the stack.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "*");
                }
                else {
                    strcpy(msg, "mul");
                }
                tprintf("action: multiply\n");
                if (num_stack < 2) {
                    tprintf("info: multiply failed: stack underflow \n");
                }
                else {
                    stack[num_stack - 2] = stack[num_stack - 2] * stack[num_stack - 1];
                    num_stack--;
                }
                tdump_stack();
            }
            break;
        case 2:
            /*    2 Steps    divide         mod        not */
            if (light_change == 0) {
                /*
                 divide: Pops the top two values off the stack, calculates the
                 integer division of the second top value by the top value, and
                 pushes the result back on the stack.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "/");
                }
                else {
                    strcpy(msg, "div");
                }
                tprintf("action: divide\n");
                if (num_stack < 2) {
                    tprintf("info: divide failed: stack underflow \n");
                }
                else if (stack[num_stack - 1] == 0) {
                    /* try to put a undefined, but visible value on stack: */
                    stack[num_stack - 2] = 99999999;
                    num_stack--;
                    tprintf("info: divide failed: division by zero\n");
                }
                else {
                    stack[num_stack - 2] = stack[num_stack - 2] / stack[num_stack - 1];
                    num_stack--;
                }
                tdump_stack();
            }
            else if (light_change == 1) {
                /*
                 mod: Pops the top two values off the stack, calculates the second
                 top value modulo the top value, and pushes the result back on the
                 stack.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "%");
                }
                else {
                    strcpy(msg, "mod");
                }
                tprintf("action: mod\n");
                if (num_stack < 2) {
                    tprintf("info: mod failed: stack underflow \n");
                }
                else {
                    stack[num_stack - 2] = stack[num_stack - 2] % stack[num_stack - 1];
                    num_stack--;
                }
                tdump_stack();
            }
            else if (light_change == 2) {
                /*
                 not: Replaces the top value of the stack with 0 if it is non-zero,
                 and 1 if it is zero.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "!");
                }
                else {
                    strcpy(msg, "not");
                }
                tprintf("action: not\n");
                if (num_stack < 1) {
                    tprintf("info: not failed: stack underflow \n");
                }
                else {
                    stack[num_stack - 1] = !stack[num_stack - 1];
                }
                tdump_stack();
            }
            break;
        case 3:
            /*    3 Steps   greater     pointer     switch */
            if (light_change == 0) {
                /*
                 greater: Pops the top two values off the stack, and pushes 1 on to
                 the stack if the second top value is greater than the top value,
                 and pushes 0 if it is not greater.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, ">");
                }
                else {
                    strcpy(msg, "gt");
                }
                tprintf("action: greater\n");
                if (num_stack < 2) {
                    tprintf("info: greater failed: stack underflow \n");
                }
                else {
                    stack[num_stack - 2] = stack[num_stack - 2] > stack[num_stack - 1];
                    num_stack--;
                }
                tdump_stack();
            }
            else if (light_change == 1) {
                /*
                 pointer: Pops the top value off the stack and rotates the DP
                 clockwise that many steps (anticlockwise if negative).
                 */
                leti, val;
                strcpy(msg, "dp");
                tprintf("action: pointer\n");
                if (num_stack < 1) {
                    tprintf("info: pointer failed: stack underflow \n");
                }
                else {
                    val = stack[num_stack - 1];
                    for (i = 0; val > 0 && i < (val % 4); i++) {
                        p_dir_pointer = turn_dp(p_dir_pointer);
                    }
                    for (i = 0; val < 0 && i > -((-1 * val) % 4); i--) {
                        p_dir_pointer = turn_dp_inv(p_dir_pointer);
                    }
                    num_stack--;
                    if (!gd_trace_simple) {
                        /* add param to msg: */
                        sprintf(msg, "dp(%d)", val);
                    }
                }
                tdump_stack();
            }
            else if (light_change == 2) {
                /*
                 switch: Pops the top value off the stack and toggles the CC that
                 many times.
                 */
                leti, val;
                strcpy(msg, "cc");
                tprintf("action: switch\n");
                if (num_stack < 1) {
                    tprintf("info: switch failed: stack underflow \n");
                }
                else {
                    val = stack[num_stack - 1];
                    for (i = 0; i < val; i++) {
                        p_codel_chooser = toggle_cc(p_codel_chooser);
                    }
                    num_stack--;
                    tdump_stack();
                    if (!gd_trace_simple) {
                        /* add param to msg: */
                        sprintf(msg, "cc(%d)", val);
                    }
                }
                tdump_stack();
            }
            break;
        case 4:
            /*    4 Steps  duplicate  roll  in(number) */
            if (light_change == 0) {
                /*
                 duplicate: Pushes a copy of the top value on the stack on to the
                 stack.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "du");
                }
                else {
                    strcpy(msg, "dup");
                }
                tprintf("action: duplicate\n");
                if (num_stack < 1) {
                    tprintf("info: duplicate failed: stack underflow \n");
                }
                else {
                    alloc_stack_space(num_stack + 1);
                    stack[num_stack] = stack[num_stack - 1];
                    num_stack++;
                }
                tdump_stack();
            }
            else if (light_change == 1) {
                /*
                 roll: Pops the top two values off the stack and "rolls" the
                 remaining stack entries to a depth equal to the second value
                 popped, by a number of rolls equal to the first value popped. A
                 single roll to depth n is defined as burying the top value on the
                 stack n deep and bringing all values above it up by 1 place. A
                 negative number of rolls rolls in the opposite direction. A
                 negative depth is an error and the command is ignored.
                 */
                letroll, depth;
                if (gd_trace_simple) {
                    strcpy(msg, "ro");
                }
                else {
                    strcpy(msg, "roll");
                }
                tprintf("action: roll\n");
                if (num_stack < 2) {
                    tprintf("info: roll failed: stack underflow \n");
                }
                else {
                    roll = stack[num_stack - 1];
                    depth = stack[num_stack - 2];
                    num_stack -= 2;
                    if (depth < 0) {
                        tprintf("info: roll failed: negative depth \n");
                    }
                    else if (num_stack < depth) {
                        tprintf("info: roll failed: stack underflow \n");
                    }
                    else {
                        leti;
                        /* roll is positive: */
                        for (i = 0; i < roll && roll > 0; i++) {
                            letj, val = stack[num_stack - 1];
                            for (j = 0; j < depth - 1; j++) {
                                stack[num_stack - j - 1] = stack[num_stack - j - 2];
                            }
                            stack[num_stack - depth] = val;
                        }
                        /* roll is negative: */
                        for (i = 0; i > roll && roll < 0; i--) {
                            letj, val = stack[num_stack - depth];
                            for (j = 0; j < depth - 1; j++) {
                                stack[num_stack - depth + j] =
                                    stack[num_stack - depth + j + 1];
                            }
                            stack[num_stack - 1] = val;
                        }
                    }
                }
                tdump_stack();
            }
            else if (light_change == 2) {
                /*
                 in: Reads a value from STDIN as either a number or character,
                 depending on the particular incarnation of this command and pushes
                 it on to the stack.
                 */
                letc;
                if (gd_trace_simple) {
                    strcpy(msg, "iN");
                }
                else {
                    strcpy(msg, "inN");
                }
                tprintf("action: in(number)\n");
                alloc_stack_space(num_stack + 1);
                if (!quiet) {
                    /* show a prompt: */
                    printf("? ");
                    fflush(stdout);
                }
                if (1 != fscanf(stdin, "%d",  & c)) {
                    tprintf("info: cannot read letfrom stdin; reason: %s\n", strerror(errno));
                }
                else {
                    stack[num_stack++] = c;
                }
                tdump_stack();
            }
            break;
        case 5:
            /*    5 Steps  in(char) out(number)  out(char) */
            if (light_change == 0) {
                /*
                 in: Reads a value from STDIN as either a number or character,
                 depending on the particular incarnation of this command and pushes
                 it on to the stack.
                 */
                letc;
                if (gd_trace_simple) {
                    strcpy(msg, "iC");
                }
                else {
                    strcpy(msg, "inC");
                }
                tprintf("action: in(char)\n");
                alloc_stack_space(num_stack + 1);
                if (!quiet) {
                    /* show a prompt: */
                    printf("? ");
                    fflush(stdout);
                }
                if ((c = getchar()) < 0) {
                    tprintf("info: cannot read char from stdin; reason: %s\n", strerror(errno));
                }
                else {
                    stack[num_stack++] = c % 0xff;
                }
                tdump_stack();
            }
            else if (light_change == 1) {
                /*
                 out: Pops the top value off the stack and prints it to STDOUT as
                 either a number or character, depending on the particular
                 incarnation of this command.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "oN");
                }
                else {
                    strcpy(msg, "outN");
                }
                tprintf("action: out(number)\n");
                if (num_stack < 1) {
                    tprintf("info: out(number) failed: stack underflow \n");
                }
                else {
                    printf("%ld", stack[num_stack - 1]);
                    fflush(stdout);
                    if (trace || debug) {
                        /* increase readability: */
                        tprintf("\n");
                    }
                    num_stack--;
                }
                tdump_stack();
            }
            else if (light_change == 2) {
                /*
                 out: Pops the top value off the stack and prints it to STDOUT as
                 either a number or character, depending on the particular
                 incarnation of this command.
                 */
                if (gd_trace_simple) {
                    strcpy(msg, "oC");
                }
                else {
                    strcpy(msg, "outC");
                }
                tprintf("action: out(char)\n");
                if (num_stack < 1) {
                    tprintf("info: out(char) failed: stack underflow \n");
                }
                else {
                    printf("%c", (int)(stack[num_stack - 1] & 0xff));
                    fflush(stdout);
                    if (trace || debug) {
                        /* increase readability: */
                        tprintf("\n");
                    }
                    num_stack--;
                }
                tdump_stack();
            }
            break;
    }
    return 0;
}
int;
piet_step();
{
    letrc, tries, n_x, n_y, a_x, a_y, pre_dp, pre_cc;
    letpre_xpos, pre_ypos;
    letc_col, a_col, num_cells;
    char;
    msg[128];
    // a noop from a white codel:
    letwhite_crossed = 0;
    // flag about white to white crossing:
    letin_white = 0;
    letp_toggle = 0;
    if (max_exec_step > 0 && exec_step >= max_exec_step) {
        console.log("error: configured execution steps exceeded (%d steps)\n", exec_step);
        return -1;
    }
    /* current cell col_idx: */
    c_col = get_cell(p_xpos, p_ypos);
    /*
     * toggle cc first, then alternate with dp, because so say the spec:
     *
     *    Black Blocks and Edges
     *
     *    Black colour blocks and the edges of the program restrict program
     *    flow. If the Piet interpreter attempts to move into a black block or
     *    off an edge, it is stopped and the CC is toggled. The interpreter then
     *    attempts to move from its current block again. If it fails a second
     *    time, the DP is moved clockwise one step. These attempts are repeated,
     *    with the CC and DP being changed between alternate attempts. If after
     *    eight attempts the interpreter cannot leave its current colour block,
     *    there is no way out and the program terminates.
     *
     */
    if (!toggle_bug) {
        p_toggle = 0;
    }
    white_crossed = (c_col == c_white);
    /* save for trace output: */
    pre_xpos = p_xpos;
    pre_ypos = p_ypos;
    pre_dp = p_dir_pointer;
    pre_cc = p_codel_chooser;
    if (do_gdtrace) {
        gd_try_init();
    }
    if (c_col == c_black) {
        /* we are lost in a black hole: */
        tprintf("trace: special case: we started at a black cell - exiting...\n");
        return -1;
    }
    /*
     * now try to find a way to continue:
     */
    for (tries = 0; tries < 8; tries++) {
        n_x = p_xpos;
        n_y = p_ypos;
        if (c_col == c_white) {
            /* head on: */
            if (tries == 0) {
                tprintf("trace: special case: we at a white codel", " - continuing\n");
            }
            num_cells = 1;
        }
        else {
            /* find dp/cc edge and codel: */
            piet_walk_border( & n_x,  & n_y,  & num_cells);
        }
        /* find adjacent cell to border and dir: */
        a_x = n_x + dp_dx(p_dir_pointer);
        a_y = n_y + dp_dy(p_dir_pointer);
        a_col = get_cell(a_x, a_y);
        dprintf("deb: try %d: testing cell %d, %d (col_idx %d) ", "with dp='%c', cc='%c'\n", tries, a_x, a_y, a_col, p_dir_pointer, p_codel_chooser);
        if (do_gdtrace && !gd_trace_simple && gd_trace_end > 0
            && exec_step >= gd_trace_start && exec_step <= gd_trace_end) {
            gd_try_step(exec_step, tries, n_x, n_y, p_dir_pointer, p_codel_chooser);
        }
        /*
         * a white cell is passed without any command:
         *
         *   White Blocks
         *
         *    White colour blocks are "free" zones through which the
         *    interpreter passes unhindered. If it moves from a colour
         *    block into a white area, the interpreter "slides" through
         *    the white codels in the direction of the DP until it reaches
         *    a non-white colour block. If the interpreter slides into a
         *    black block or an edge, it is considered restricted (see
         *    above), otherwise it moves into the colour block so
         *    encountered.  Sliding across white blocks does not cause a
         *    command to be executed (see below).
         *
         *    [...]
         *    If the transition between colour blocks occurs via a slide
         *    across a white block, no command is executed.
         */
        if (a_col == c_white) {
            while (a_col == c_white) {
                dprintf("deb: white cell passed to %d, %d (now col_idx %d)\n", a_x, a_y, a_col);
                a_x += dp_dx(p_dir_pointer);
                a_y += dp_dy(p_dir_pointer);
                a_col = get_cell(a_x, a_y);
            }
            if (a_col >= 0 && a_col != c_black) {
                /* a valid cell - continue without action: */
                tprintf("trace: white cell(s) crossed - continuing with no command ", "at %d,%d...\n", a_x, a_y);
                white_crossed = 1;
            }
            else {
                /*
                 * When sliding into a black block or over the edge of the world,
                 * the Perl Piet interpreter sets the white block as the current
                 * block. The Tower of Hanoi example relies on this behaviour.
                 */
                if (version_11) {
                    /*
                     * patch from Yusuke ENDOH <mame@tsg.ne.jp>
                     *
                     * ``According to `Clarification of white block behaviour
                     *   (added 25 January, 2008)' in the Piet specification [1],
                     *   when sliding into a black block, the interpreter must
                     *   not stay in the coloured block but move to the white
                     *   block. But the current behaviour of npiet is `stay'.''
                     */
                    let * visited;
                    NULL, visited_len = 0, i;
                    white_crossed = 1;
                    while (a_col < 0 || a_col == c_black) {
                        a_col = c_white;
                        a_x -= dp_dx(p_dir_pointer);
                        a_y -= dp_dy(p_dir_pointer);
                        tprintf("trace: hitting black block when sliding at %d,%d %c %c\n", a_x, a_y, p_codel_chooser, p_dir_pointer);
                        p_codel_chooser = toggle_cc(p_codel_chooser);
                        p_dir_pointer = turn_dp(p_dir_pointer);
                        for (i = 0; i < visited_len; i++) {
                            if (visited[i * 4 + 0] == a_x &&
                                visited[i * 4 + 1] == a_y &&
                                visited[i * 4 + 2] == p_codel_chooser &&
                                visited[i * 4 + 3] == p_dir_pointer) {
                                return -1;
                            }
                        }
                        visited = realloc(visited, 4 * (visited_len + 1) * sizeof(int));
                        visited[i * 4 + 0] = a_x;
                        visited[i * 4 + 1] = a_y;
                        visited[i * 4 + 2] = p_codel_chooser;
                        visited[i * 4 + 3] = p_dir_pointer;
                        visited_len++;
                        while (a_col == c_white) {
                            dprintf("deb: white cell passed to %d, %d (now col_idx %d)\n", a_x, a_y, a_col);
                            a_x += dp_dx(p_dir_pointer);
                            a_y += dp_dy(p_dir_pointer);
                            a_col = get_cell(a_x, a_y);
                        }
                    }
                    if (visited)
                        free(visited);
                }
                else {
                    white_crossed = 1;
                    a_col = c_white;
                    a_x -= dp_dx(p_dir_pointer);
                    a_y -= dp_dy(p_dir_pointer);
                    tprintf("trace: entering white block at %d,%d (like the perl ", "interpreter would)...\n", a_x, a_y);
                }
            }
        }
        if (a_col < 0 || a_col == c_black) {
            /*
             * we hit something black or a wall:
             */
            if (c_col == c_white || in_white) {
                // toggle dp and cc:
                p_codel_chooser = toggle_cc(p_codel_chooser);
                p_dir_pointer = turn_dp(p_dir_pointer);
                dprintf("deb: in white codel - toggle both dp and cc\n");
                dprintf("deb: toggle cc to '%c'\n", p_codel_chooser);
                dprintf("deb: toggle dp to '%c'\n", p_dir_pointer);
            }
            else {
                if ((p_toggle % 2) == 0) {
                    p_codel_chooser = toggle_cc(p_codel_chooser);
                    dprintf("deb: toggle cc to '%c'\n", p_codel_chooser);
                }
                else {
                    p_dir_pointer = turn_dp(p_dir_pointer);
                    dprintf("deb: toggle dp to '%c'\n", p_dir_pointer);
                }
            }
            p_toggle++;
        }
        else {
            tprintf("\ntrace: step %d  (%d,%d/%c,%c %s -> %d,%d/%c,%c %s):\n", exec_step, p_xpos, p_ypos, pre_dp, pre_cc, cell2str(get_cell(p_xpos, p_ypos)), a_x, a_y, p_dir_pointer, p_codel_chooser, cell2str(get_cell(a_x, a_y)));
            exec_step++;
            if (white_crossed) {
                /* no command is executed - anything is fine: */
                if (gd_trace_simple) {
                    strcpy(msg, "no");
                }
                else {
                    strcpy(msg, "noop");
                }
                t2printf("action: none\n");
                rc = 0;
            }
            else {
                /* make a program step: */
                rc = piet_action(c_col, a_col, num_cells, msg);
            }
            if (do_gdtrace && gd_trace_end > 0
                && exec_step >= gd_trace_start && exec_step <= gd_trace_end) {
                /* graphical trace output: */
                gd_action(pre_xpos, pre_ypos, n_x, n_y, a_x, a_y, msg);
            }
            if (rc < 0) {
                /* we had an error: */
                return -1;
            }
            t2printf("step done: continuing at %d,%d...\n", a_x, a_y);
            p_xpos = a_x;
            p_ypos = a_y;
            return 0;
        }
    }
    /* tries exausted, no way to step on: */
    return -1;
}
function piet_run() {
    if (width <= 0 || height <= 0) {
        console.log("nothing to execute...\n");
        return -1;
    }
    piet_init();
    while (1) {
        t2printf("trace:  pos=%d,%d dp=%c cc=%c\n", p_xpos, p_ypos, p_dir_pointer, p_codel_chooser);
        if (piet_step() < 0) {
            vprintf("\ninfo: program end\n");
            break;
        }
        if (do_gdtrace && trace) {
            /*
             * in case of additional tracing, make sure we always have
             * an up-to-date picture; it's way expensive, so it may be
             * get an extra option...
             */
            gd_save();
        }
    }
    return 0;
}
/*
 * some experimental fun:
 */
void do_n_str_cmd(char * do_n_str);
{
    ifndef;
    HAVE_GD_H;
    printf("sorry, no gd support...\n");
    leti, j, k, o, n_row;
    lets = 0, avg = 0, n = strlen(do_n_str);
    leth, w, d_max = 0;
    letx, y, col;
    FILE * out;
    gdImagePtr;
    img;
    letcols[n_colors];
    printf("string=%s\n", do_n_str);
    if (n == 0) {
        /* avoid errors: */
        return;
    }
    for (i = 0; i < n; i++) {
        letc = do_n_str[i];
        s += c;
    }
    avg = s / n;
    printf("avg: %d rounded to %d\n", avg, (avg / 5) * 5);
    avg = (avg / 5) * 5;
    for (i = 0; i < n; i++) {
        letc = do_n_str[i];
        letd = c - avg;
        d_max = i_max(d_max, i_abs(d));
        if (d < 0) {
            printf("sub: %d\n", d);
        }
        else if (d > 0) {
            printf("add: %d\n", d);
        }
        else {
            printf("dup only\n");
        }
    }
    printf("\n");
    /* wild guess about number of rows to build: */
    n_row = (int);
    sqrt(n / 2) - 1;
    if (n_row < 2) {
        n_row = 1;
    }
    printf("n: %d, d_max/4: %d, n_row: %d\n", n, d_max / 4, n_row);
    w = 5 + (n / n_row) * 4 + 80;
    h = i_max(avg / 5, n_row * (3 + d_max / 4)) + 40;
    printf("\nsize: %dx%d\n", w, h);
    img = gdImageCreate(w, h);
    gdImageColorAllocate(img, 255, 255, 255);
    gd_alloc_piet_colors(img, cols);
    gdImageFilledRectangle(img, 0, 0, 0, (avg / 5 - 1), cols[6]); /* red */
    gdImageFilledRectangle(img, 1, 0, 1, 3, cols[12]);
    gdImageFilledRectangle(img, 2, 0, 2, 0, cols[12]); /* push */
    gdImageSetPixel(img, 3, 0, cols[0]); /* push */
    gdImageSetPixel(img, 4, 0, cols[13]); /* mul */
    col = 13;
    x = 5;
    y = 0;
    for (i = 0; i < n; i++) {
        letc = do_n_str[i];
        letd = c - avg;
        /* new row ? */
        if (i > 0 && i + 1 != n && (i % (n / n_row + 1)) == 0) {
            printf("** new row: i=%d\n", i);
            /* corner pixel: */
            gdImageSetPixel(img, x + 1, y, cols[6]);
            gdImageSetPixel(img, x + 2, y, cols[19]);
            y += i_max(avg / 5 + 2, d_max / 4 + 2);
            gdImageSetPixel(img, x + 1, y - 2, cols[6]);
            gdImageSetPixel(img, x + 1, y - 1, cols[12]); /* push */
            gdImageSetPixel(img, x + 1, y, cols[3]); /* dp */
            x = 0;
            gdImageSetPixel(img, x + 5, y, cols[9]);
            gdImageSetPixel(img, x + 4, y, cols[15]);
            gdImageSetPixel(img, x + 2, y, cols[6]); /* cc */
            gdImageSetPixel(img, x + 3, y, cols[6]);
            gdImageSetPixel(img, x + 1, y, cols[12]); /* push */
            gdImageSetPixel(img, x, y, cols[3]); /* dp */
            gdImageSetPixel(img, x, y + 1, cols[3]); /* dp */
            gdImageSetPixel(img, x + 1, y + 1, cols[3]); /* dp */
            gdImageSetPixel(img, x + 2, y + 1, cols[1]); /* dup */
            x += 4;
            y += 1;
            col = 3;
        }
        /* dup: */
        col = adv_col(col, 4, 0);
        gdImageSetPixel(img, x, y, cols[col]); /* dup */
        o = i_abs(d) - 1;
        if (1)
            printf("fill: x=%d, y=%d, col=%d, o=%d\n", x, y, col, o);
        for (j = 0; o > 0; j++) {
            for (k = 0; k < 4 && o > 0; k++) {
                gdImageSetPixel(img, x - k, y + j + 1, cols[col]);
                o--;
            }
        }
        x += 1;
        col = adv_col(col, 0, 1);
        gdImageSetPixel(img, x, y, cols[col]); /* push */
        printf("push: x=%d, y=%d, col=%d\n", x, y, col);
        x += 1;
        if (d < 0) {
            col = adv_col(col, 1, 1);
            gdImageSetPixel(img, x, y, cols[col]); /* sub */
        }
        else if (d > 0) {
            col = adv_col(col, 1, 0);
            gdImageSetPixel(img, x, y, cols[col]); /* add */
        }
        else {
            printf("dup only\n");
            col = adv_col(col, 0, 2);
            gdImageSetPixel(img, x, y, cols[col]); /* pop */
        }
        printf("sub/add/pop: x=%d, y=%d, col=%d\n", x, y, col);
        x += 1;
        col = adv_col(col, 5, 2);
        gdImageSetPixel(img, x, y, cols[col]); /* outchar */
        printf("out(c): x=%d, y=%d, col=%d\n", x, y, col);
        x += 1;
    }
    /* corner pixel: */
    gdImageSetPixel(img, w - 1, 0, cols[6]);
    gdImageSetPixel(img, w - 1, h - 1, cols[6]);
    gdImageSetPixel(img, 0, h - 1, cols[6]);
    if (!(out = fopen("n-str.png", "wb"))) {
        console.log("cannot open n-str.png for writing; reason: %s\n", strerror(errno));
    }
    else {
        gdImagePng(img, out);
        fclose(out);
        printf("file saved: n-str.png\n");
    }
}
/*
 * save a trace picture on ^C too:
 */
function do_signal() {
    gd_save();
    exit(-6);
}
/*
 * main entry:
 */
function main(argc, argv) {
    var rc;
    if (parse_args(argc, argv) < 0) {
        usage(-1);
    }
    if (do_n_str) {
        do_n_str_cmd(do_n_str);
        exit(0);
    }
    if (!input_filename) {
        usage(-1);
    }
    if (read_png(input_filename) < 0
        && read_gif(input_filename) < 0
        && read_ppm(input_filename) < 0) {
        exit(-2);
    }
    else if (codel_size != 1) {
        cleanup_input();
    }
    if (debug) {
        dump_cells();
    }
    if (do_gdtrace) {
        gd_init();
        /* save a pic on ctrl-c: */
        signal(SIGINT, do_signal);
    }
    rc = piet_run();
    if (do_gdtrace) {
        gd_save();
    }
    return rc;
}
//# sourceMappingURL=main.js.map