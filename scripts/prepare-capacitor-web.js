const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '.capacitor-web');
const copies = ['index.html', 'manifest.json', 'sw.js', 'favicon.png', 'js', 'dist', 'icons'];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const item of copies) {
  const source = path.join(root, item);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing mobile web asset: ${item}. Run the required build step first.`);
  }
  fs.cpSync(source, path.join(output, item), { recursive: true });
}

// Ensure dummy Java class exists in capacitor-cordova-android-plugins so R8 finds classes.jar during release builds
const cordovaJavaDir = path.join(root, 'android', 'capacitor-cordova-android-plugins', 'src', 'main', 'java', 'capacitor', 'cordova', 'android', 'plugins');
const cordovaJavaFile = path.join(cordovaJavaDir, 'CordovaPlugins.java');
if (!fs.existsSync(cordovaJavaFile)) {
  fs.mkdirSync(cordovaJavaDir, { recursive: true });
  fs.writeFileSync(cordovaJavaFile, `package capacitor.cordova.android.plugins;\n\npublic class CordovaPlugins {\n    // Placeholder class so R8 finds classes.jar when no cordova plugins are installed\n}\n`);
}

