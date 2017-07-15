#include "npiet.h"

int EMSCRIPTEN_KEEPALIVE load_png_from_url(char *urlToPass) {
    char *myfile = "tempfile.png";
    emscripten_wget(urlToPass, myfile);
    int rc;
    read_png(myfile);
    rc = piet_run();
    return rc;
}

int EMSCRIPTEN_KEEPALIVE load_ppm_from_url(char *urlToPass) {
    char *myfile = "tempfile.ppm";
    emscripten_wget(urlToPass, myfile);
    int rc;
    read_ppm(myfile);
    rc = piet_run();
    return rc;
}