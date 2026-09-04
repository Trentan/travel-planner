#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitCount() {
  try {
    return parseInt(execSync('git rev-list --count HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim(), 10);
  } catch {
    return 37;
  }
}

function getGitCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function getPackageJsonVersion() {
  try {
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || '1.1.0';
  } catch {
    return '1.1.0';
  }
}

function getVersionInfo() {
  const pkgVersion = getPackageJsonVersion();
  const commitCount = getGitCommitCount();
  const commitSha = getGitCommitSha();
  const branch = getGitBranch();

  const envCode = process.env.ANDROID_VERSION_CODE || process.env.VERSION_CODE;
  const versionCode = envCode ? parseInt(envCode, 10) : Math.max(commitCount, 37);

  const envName = process.env.ANDROID_VERSION_NAME || process.env.VERSION_NAME;
  const versionName = envName || pkgVersion;

  return {
    versionName,
    versionCode,
    commitCount,
    commitSha,
    branch,
    releaseTag: `v${versionName}-build.${versionCode}`,
    aabFileName: `travel-planner-v${versionName}-build${versionCode}.aab`,
    apkDebugFileName: `travel-planner-v${versionName}-build${versionCode}-debug.apk`,
    apkReleaseFileName: `travel-planner-v${versionName}-build${versionCode}-release.apk`
  };
}

if (require.main === module) {
  const info = getVersionInfo();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('=== Travel Planner Android Version Info ===');
    console.log(`Version Name (package.json): ${info.versionName}`);
    console.log(`Version Code (Play Store) : ${info.versionCode}`);
    console.log(`Git Commit Count           : ${info.commitCount}`);
    console.log(`Git Commit SHA             : ${info.commitSha}`);
    console.log(`Git Branch                 : ${info.branch}`);
    console.log(`Release Tag                : ${info.releaseTag}`);
    console.log(`Target AAB File            : ${info.aabFileName}`);
    console.log(`Target Debug APK File      : ${info.apkDebugFileName}`);
    console.log(`Target Release APK File    : ${info.apkReleaseFileName}`);
  }
}

module.exports = { getVersionInfo };
