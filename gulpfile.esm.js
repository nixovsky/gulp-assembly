import { createRequire } from 'module';
const requiree = createRequire(import.meta.url);
const browserSync = requiree('browser-sync');
const nunjucks = requiree('gulp-nunjucks-render');

import gulp from 'gulp';
import { src, dest, parallel, series, watch } from 'gulp';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import autoprefixer from 'gulp-autoprefixer';
import { promises as fs } from 'fs';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import htmlPrettify from 'gulp-html-prettify';
import gulpIf from 'gulp-if';
import log from 'fancy-log';

const { rm } = fs;
const sass = gulpSass(dartSass);
const bs = browserSync.create();

// Конфигурация
const isDev = () => process.env.NODE_ENV === 'development';
console.log(isDev(), process.env.NODE_ENV);
const config = {
  paths: {
    scripts: {
      src: 'src/js/script.js',
      lib: 'src/js/lib/**/*.js',
      main: 'src/js/script.js',
      dest: 'src/js'
    },
    styles: {
      src: 'src/scss/**/*.scss',
      dest: 'src/css'
    },
    templates: {
      src: ['src/templates/*.html', 'src/layout/*.html', 'src/components/*.html'],
      dest: 'src/pages'
    },
    dist: {
      src: ['src/css/*.css', 'src/js/*.bundle.js', 'src/pages/**/*.html', 'src/images/**/*', 'src/fonts/**/*'],
      dest: 'dist'
    }
  },
  autoprefixer: {
    overrideBrowserslist: ['last 2 versions', '> 1%'],
    cascade: false
  },
  babel: {
    presets: ['@babel/preset-env']
  }
};

// Очистка dist
export const clean = () => rm(config.paths.dist.dest, { 
  recursive: true, 
  force: true 
});

// Обработка скриптов
export const scripts = () => {
  return src([config.paths.scripts.lib, config.paths.scripts.main], { sourcemaps: isDev() })
    .pipe(gulpIf(isDev(), sourcemaps.init()))
    .pipe(babel(config.babel))
    .pipe(concat('script.bundle.js'))
    .pipe(gulpIf(!isDev(), terser()))
    .pipe(gulpIf(isDev(), sourcemaps.write('.')))
    .pipe(dest(config.paths.scripts.dest))
    .pipe(bs.stream());
};

// Обработка стилей
export const styles = () => {
  return src(config.paths.styles.src, { sourcemaps: isDev() })
    .pipe(gulpIf(isDev(), sourcemaps.init()))
    .pipe(autoprefixer(config.autoprefixer))
    .pipe(sass({
      outputStyle: isDev() ? 'expanded' : 'compressed'
    }).on('error', sass.logError))
    .pipe(concat('style.min.css'))
    .pipe(gulpIf(isDev(), sourcemaps.write('.')))
    .pipe(dest(config.paths.styles.dest))
    .pipe(bs.stream());
};

// Шаблоны Nunjucks
export const templates = () => {
  return src('src/templates/*.html')
    .pipe(nunjucks().on('error', log.error))
    .pipe(htmlPrettify({ indent_size: 2 }))
    .pipe(dest(config.paths.templates.dest))
    .pipe(bs.stream());
};

// Сервер разработки
export const serve = () => {
  bs.init({
    server: {
      baseDir: 'src/',
      index: 'pages/index.html'
    },
    notify: false
  });

  watch(config.paths.styles.src, styles);
  watch(config.paths.scripts.src, scripts);
  watch(config.paths.templates.src, templates).on('change', bs.reload);
};

// Сборка проекта
export const build = series(
  clean,
  parallel(styles, scripts, templates),
  () => src(config.paths.dist.src, { base: 'src' }).pipe(dest(config.paths.dist.dest))
);

// Утилиты для переключения режимов
export const setDev = (done) => {
  process.env.NODE_ENV = 'development';
  done();
};

export const setProd = (done) => {
  process.env.NODE_ENV = 'production';
  done();
};

// Таски по умолчанию
export default series(
  setDev,
  parallel(styles, scripts, templates, serve)
);