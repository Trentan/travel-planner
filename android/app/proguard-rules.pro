# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---------------------------------------------------------------------------
# High Performance R8 / ProGuard Optimization Rules for Android 15 & Capacitor
# ---------------------------------------------------------------------------
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor Core Bridge & Plugin Annotations
-keep public class com.getcapacitor.BridgeActivity
-keep public class com.getcapacitor.Bridge
-keep public class com.getcapacitor.Plugin
-keep public class com.getcapacitor.PluginCall
-keep public class com.getcapacitor.JSObject
-keep public class com.getcapacitor.JSArray
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public void *(com.getcapacitor.PluginCall);
    public *;
}

# JavaScript Interfaces called reflectively from WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView framework clients
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public boolean *(android.webkit.WebView, android.webkit.WebResourceRequest);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# GoogleAuth Plugin & Google Play Services Auth
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.** { *; }

# Allow R8 to optimize AndroidX and suppress optional API warnings
-dontwarn androidx.**
-dontwarn com.google.android.gms.**
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**

