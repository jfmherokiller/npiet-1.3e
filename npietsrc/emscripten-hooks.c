#include "npiet.h"

int EMSCRIPTEN_KEEPALIVE load_png_from_url(char *urlToPass) {
    char *myfile = "tempfile.png";
    emscripten_wget(urlToPass, myfile);
    read_png(myfile);
    return piet_run();
}

int EMSCRIPTEN_KEEPALIVE load_ppm_from_url(char *urlToPass) {
    char *myfile = "tempfile.ppm";
    emscripten_wget(urlToPass, myfile);
    read_ppm(myfile);
    return piet_run();
}