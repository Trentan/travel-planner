# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---------------------------------------------------------------------------
# Preserve line numbers in stack traces (makes crash reports readable without
# uploading mapping.txt; mapping.txt is still uploaded to Play Console for
# full deobfuscation).
# ---------------------------------------------------------------------------
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ---------------------------------------------------------------------------
# Capacitor / Cordova – keep all plugin classes and JS bridge interfaces.
# R8 cannot see calls from JavaScript, so these would otherwise be removed.
# ---------------------------------------------------------------------------
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Keep all classes annotated as Capacitor plugins
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    public *;
}

# Keep JavaScript interface methods (called reflectively from WebView)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ---------------------------------------------------------------------------
# WebView / WebChromeClient – Android framework
# ---------------------------------------------------------------------------
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public boolean *(android.webkit.WebView, android.webkit.WebResourceRequest);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# ---------------------------------------------------------------------------
# AndroidX / AppCompat – Allow R8 optimization via AAR consumer rules
# ---------------------------------------------------------------------------
-dontwarn androidx.**
-keepclassmembers class * extends androidx.fragment.app.Fragment {
    public <init>();
}

# ---------------------------------------------------------------------------
# GoogleAuth Capacitor Plugin & Google Play Services Auth
# ---------------------------------------------------------------------------
-keep class com.codetrixstudio.capacitor.** { *; }
-keep class com.google.android.gms.auth.api.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    *;
}

# ---------------------------------------------------------------------------
# Suppress warnings for classes that may not be present on all API levels
# ---------------------------------------------------------------------------
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn com.google.android.gms.**

