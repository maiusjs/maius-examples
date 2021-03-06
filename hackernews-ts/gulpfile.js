const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const del = require('del');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence');
const tsconfig = require('./tsconfig');

const DIST_DIR = tsconfig.compilerOptions.outDir || path.resolve('./dist');

/**
 * 编译 ts 文件
 */

gulp.task('compile', () => {
  return gulp
    .src('src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(
      ts(Object.assign(tsconfig.compilerOptions, {
        outDir: DIST_DIR,
      }))
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIST_DIR));
});

/**
 * 删除 dist 目录
 */

gulp.task('del', (cb) => {
  return del([DIST_DIR], cb);
});

/**
 * 复制 src 文件下的非 .ts 后缀文件到 dist 目录
 */

gulp.task('copy', () => {
  return gulp
    .src(['src/**/*', '!src/**/*.ts', '!src/@types'])
    .pipe(gulp.dest(DIST_DIR));
});


let node;

/**
 * 启动 node 进程
 */

gulp.task('server', () => {
  if (node) node.kill();
  node = spawn('node', [path.resolve('./dist/maius.js')], { stdio: 'inherit' });
  node.on('close', (code) => {
    console.log(' ');
    switch (code) {
      case 8 || 12:
      console.log(chalk.red('Error detected, attempting reboot...'));
      setTimeout(runLiveServer, 500);
      break;
      case 1:
      console.log(chalk.red('The port alreay in use'));
      break;
      default:
      break;
    }
    if (!code) {
      console.log(chalk.green('The Application Had Relaunced.'));
    }
    console.log(' ');
  });
});

/**
 * 复合任务：构建项目
 *
 * 1. 删除 dist 目录
 * 2. 构建 TS 源码到 dist 目录下
 * 3. 将 src 目录下非 ts 后缀文件复制到 dist 目录下
 */

gulp.task('dist', (cb) => {
  runSequence(
    'del',
    ['compile', 'copy'],
    cb
  );
});

/**
 * 复合任务：重新启动并编译项目
 */

gulp.task('server.restart', (cb) => {
  runSequence(
    'dist',
    'server',
    cb,
  );
})

/**
 * 监听 src 目录下的文件改动，重新编译项目，并重启 Node 进程
 */

gulp.task('watch', ['server.restart'], () => {
  return gulp.watch('src/**/*', ['server.restart']);
});
