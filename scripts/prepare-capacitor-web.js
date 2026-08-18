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

// Patch @codetrix-studio/capacitor-google-auth android build.gradle for Gradle 9 & AGP 8 compatibility
const googleAuthGradle = path.join(root, 'node_modules', '@codetrix-studio', 'capacitor-google-auth', 'android', 'build.gradle');
if (fs.existsSync(googleAuthGradle)) {
  let content = fs.readFileSync(googleAuthGradle, 'utf8');
  content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
  content = content.replace(/VERSION_17/g, 'VERSION_21');
  content = content.replace(/'proguard-android\.txt'/g, "'proguard-android-optimize.txt'");
  content = content.replace(/'com\.google\.android\.gms:play-services-auth:18\.\+'/g, "'com.google.android.gms:play-services-auth:21.2.0'");
  fs.writeFileSync(googleAuthGradle, content, 'utf8');
}

// Patch GoogleAuth.java for null-safe signIn() without prior initialize()
const googleAuthJava = path.join(root, 'node_modules', '@codetrix-studio', 'capacitor-google-auth', 'android', 'src', 'main', 'java', 'com', 'codetrixstudio', 'capacitor', 'GoogleAuth', 'GoogleAuth.java');
if (fs.existsSync(googleAuthJava)) {
  let javaContent = fs.readFileSync(googleAuthJava, 'utf8');
  if (!javaContent.includes('if (googleSignInClient == null)')) {
    javaContent = javaContent.replace(
      'public void signIn(PluginCall call) {',
      'public void signIn(PluginCall call) {\n    if (googleSignInClient == null) {\n      String defaultClientId = this.getContext().getString(R.string.server_client_id);\n      String[] defaultScopes = new String[]{"profile", "email", "https://www.googleapis.com/auth/drive.file"};\n      loadSignInClient(defaultClientId, false, defaultScopes);\n    }'
    );
    fs.writeFileSync(googleAuthJava, javaContent, 'utf8');
  }
}

