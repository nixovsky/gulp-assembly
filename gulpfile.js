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
const njk = require('gulp-nunjucks-render');
const prettify = require('gulp-html-prettify');



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

function nunjucks(){
    return src('src/templates/**/*.html')
    .pipe(njk())
    .pipe(prettify({
        indent_size : 4 // размер отступа - 4 пробела
    }))
    .pipe(dest('src/pages'))
    .pipe(browserSync.stream());
}

function browsersync(){
    browserSync.init({
        server: {
            baseDir: 'src/',
            index: 'pages/index.html'
        }
    });
}

function watching(){
    watch(['src/scss/style.scss'], styles)
    watch(['src/js/script.js'], scripts)
    watch(['src/templates/*.html', 'src/layout/*.html', 'src/components/*.html'], nunjucks).on('change', browserSync.reload)
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
        'src/pages/**/*.html',
    ], {base: 'src'})
    .pipe(dest('dist'))
}

exports.styles = styles;
exports.scripts = scripts;
exports.watching = watching;
exports.browsersync = browsersync;
exports.img = img;
exports.nunjucks = nunjucks;

exports.cleanDist = cleanDist; 

exports.build = series(cleanDist, building);
exports.default = parallel(styles, scripts, nunjucks, browsersync, watching);