const {src, dest, watch, parallel, series} = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const babel = require("gulp-babel");
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const imgCompress  = require('imagemin-jpeg-recompress');


function scripts(){
    return src([
        'src/js/*.js',
        '!src/js/script.min.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets: ["@babel/preset-env"]
    }))
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(dest('src/js'))
    .pipe(browserSync.stream())
}

function styles(){
    return src('src/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(autoprefixer({overrideBrowserslist: ['last 10 version']}))
    .pipe(concat('style.min.css'))
    .pipe(scss({
        outputStyle: 'compressed'
    }))
    .pipe(sourcemaps.write())
    .pipe(dest('src/css'))
    .pipe(browserSync.stream())
}

function browsersync(){
    browserSync.init({
        server: {
            baseDir: 'src/'
        }
    });
}

function watching(){
    watch(['src/scss/style.scss'], styles)
    watch(['src/js/script.js'], scripts)
    watch(['src/*.html']).on('change', browserSync.reload)
}

function cleanDist() {
    return src('dist')
    .pipe(clean())
}

function img(){
    return src('src/images/*')
    .pipe(imagemin([
        imgCompress({
          loops: 4,
          min: 70,
          max: 80,
          quality: 'high'
        }),
        imagemin.gifsicle(),
        imagemin.optipng(),
        imagemin.svgo()
      ]))
	.pipe(dest('dist/images'))
}

function building(){
    return src([
        'src/css/style.min.css',
        'src/js/script.min.js',
        'src/**/*.html'
    ], {base: 'src'})
    .pipe(dest('dist'))
}

exports.styles = styles;
exports.scripts = scripts;
exports.watching = watching;
exports.browsersync = browsersync;
exports.img = img;

exports.cleanDist = cleanDist; 

exports.build = series(cleanDist, building);
exports.default = parallel(styles, scripts, browsersync, watching);