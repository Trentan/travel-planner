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

// Robust Android GoogleAuth Plugin implementation
const googleAuthJava = path.join(root, 'node_modules', '@codetrix-studio', 'capacitor-google-auth', 'android', 'src', 'main', 'java', 'com', 'codetrixstudio', 'capacitor', 'GoogleAuth', 'GoogleAuth.java');
if (fs.existsSync(googleAuthJava)) {
  const robustGoogleAuthCode = `package com.codetrixstudio.capacitor.GoogleAuth;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.accounts.AccountManagerFuture;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.codetrixstudio.capacitor.GoogleAuth.capacitorgoogleauth.R;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.GoogleAuthUtil;
import com.google.android.gms.auth.UserRecoverableAuthException;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.Task;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuth extends Plugin {
    private static final String TAG = "GoogleAuthNative";
    private static final String FIELD_ACCESS_TOKEN = "accessToken";
    private static final String FIELD_TOKEN_EXPIRES = "expires";
    private static final String FIELD_TOKEN_EXPIRES_IN = "expires_in";

    private GoogleSignInClient googleSignInClient;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private void ensureClient(String customClientId, List<String> customScopes) {
        String clientId = customClientId;
        if (clientId == null || clientId.trim().isEmpty()) {
            try {
                clientId = getContext().getString(R.string.server_client_id);
            } catch (Exception ignored) {
                clientId = "253620621116-u76e3v3e2qv6ffq9b58re4l4bbqs1e3g.apps.googleusercontent.com";
            }
        }

        GoogleSignInOptions.Builder builder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(clientId)
                .requestEmail()
                .requestProfile();

        List<String> scopes = (customScopes != null && !customScopes.isEmpty()) ? customScopes : getDefaultScopes();
        for (String s : scopes) {
            if (s != null && !s.trim().isEmpty() && !s.equalsIgnoreCase("profile") && !s.equalsIgnoreCase("email")) {
                builder.requestScopes(new Scope(s.trim()));
            }
        }

        googleSignInClient = GoogleSignIn.getClient(getContext(), builder.build());
    }

    private List<String> getDefaultScopes() {
        List<String> list = new ArrayList<>();
        list.add("profile");
        list.add("email");
        list.add("https://www.googleapis.com/auth/drive.file");
        return list;
    }

    @Override
    public void load() {}

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            String clientId = call.getString("clientId");
            if (clientId == null || clientId.trim().isEmpty()) {
                clientId = getConfig().getString("serverClientId", getConfig().getString("clientId", null));
            }

            List<String> scopeList = new ArrayList<>();
            try {
                JSArray arr = call.getArray("scopes");
                if (arr != null) {
                    for (int i = 0; i < arr.length(); i++) {
                        String item = arr.getString(i);
                        if (item != null && !item.trim().isEmpty()) scopeList.add(item.trim());
                    }
                }
            } catch (Exception ignored) {}

            if (scopeList.isEmpty()) {
                String str = call.getString("scopes");
                if (str != null && !str.trim().isEmpty()) {
                    String cleanStr = str.replace('[', ' ').replace(']', ' ');
                    for (String item : cleanStr.split(",")) {
                        String cleanItem = item.replace('\"', ' ').trim();
                        if (!cleanItem.isEmpty()) scopeList.add(cleanItem);
                    }
                }
            }

            ensureClient(clientId, scopeList);
            call.resolve();
        } catch (Exception t) {
            Log.e(TAG, "initialize error", t);
            call.reject("Initialization failed: " + t.getMessage(), t);
        }
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            if (googleSignInClient == null) {
                ensureClient(null, null);
            }
            Intent signInIntent = googleSignInClient.getSignInIntent();
            startActivityForResult(call, signInIntent, "signInResult");
        } catch (Exception t) {
            Log.e(TAG, "signIn start error", t);
            call.reject("Unable to launch Google Sign-In: " + t.getMessage(), t);
        }
    }

    @ActivityCallback
    protected void signInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        try {
            if (result == null || result.getData() == null) {
                call.reject("Sign-in was cancelled.", String.valueOf(GoogleSignInStatusCodes.SIGN_IN_CANCELLED));
                return;
            }

            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account == null) {
                call.reject("Google account was not returned.", "NULL_ACCOUNT");
                return;
            }

            processAccountAndResolve(call, account);
        } catch (ApiException apiEx) {
            Log.w(TAG, "Google Sign-In ApiException: code=" + apiEx.getStatusCode() + " msg=" + apiEx.getMessage());
            if (apiEx.getStatusCode() == GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
                call.reject("The user canceled the sign-in flow.", String.valueOf(apiEx.getStatusCode()));
            } else {
                call.reject("Google Sign-In error (" + apiEx.getStatusCode() + "): " + apiEx.getMessage(), String.valueOf(apiEx.getStatusCode()));
            }
        } catch (Exception topEx) {
            Log.e(TAG, "signInResult top-level exception", topEx);
            call.reject("Sign-in error: " + topEx.getMessage(), topEx);
        }
    }

    private void processAccountAndResolve(PluginCall call, GoogleSignInAccount account) {
        executor.execute(() -> {
            try {
                String scopeStr = "oauth2:https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata profile email";
                String authToken = null;
                Account androidAccount = account.getAccount() != null ? account.getAccount() : (account.getEmail() != null ? new Account(account.getEmail(), "com.google") : null);

                if (androidAccount != null) {
                    try {
                        authToken = GoogleAuthUtil.getToken(getContext(), androidAccount, scopeStr);
                    } catch (UserRecoverableAuthException urae) {
                        Log.i(TAG, "Google Drive consent required, launching recovery intent");
                        startActivityForResult(call, urae.getIntent(), "handleUserRecoverableAuth");
                        return;
                    } catch (Exception tokenEx) {
                        Log.w(TAG, "GoogleAuthUtil token attempt: " + tokenEx.getMessage());
                        try {
                            AccountManager manager = AccountManager.get(getContext());
                            AccountManagerFuture<Bundle> future = manager.getAuthToken(androidAccount, scopeStr, null, getActivity(), null, null);
                            Bundle b = future.getResult();
                            authToken = b != null ? b.getString(AccountManager.KEY_AUTHTOKEN) : null;
                        } catch (Exception mgrEx) {
                            Log.w(TAG, "AccountManager token attempt: " + mgrEx.getMessage());
                        }
                    }
                }

                if (authToken == null || authToken.isEmpty()) {
                    authToken = account.getIdToken();
                }

                JSObject authentication = new JSObject();
                authentication.put("idToken", account.getIdToken());
                authentication.put(FIELD_ACCESS_TOKEN, authToken != null ? authToken : "");
                authentication.put(FIELD_TOKEN_EXPIRES, 3600 + (System.currentTimeMillis() / 1000));
                authentication.put(FIELD_TOKEN_EXPIRES_IN, 3600);

                JSObject user = new JSObject();
                user.put("serverAuthCode", account.getServerAuthCode());
                user.put("idToken", account.getIdToken());
                user.put("authentication", authentication);
                user.put("name", account.getDisplayName());
                user.put("displayName", account.getDisplayName());
                user.put("email", account.getEmail());
                user.put("familyName", account.getFamilyName());
                user.put("givenName", account.getGivenName());
                user.put("id", account.getId());
                user.put("imageUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");

                call.resolve(user);
            } catch (Exception bgEx) {
                Log.e(TAG, "Background account processing error", bgEx);
                call.reject("Failed processing sign-in result: " + bgEx.getMessage(), bgEx);
            }
        });
    }

    @ActivityCallback
    protected void handleUserRecoverableAuth(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result != null && result.getResultCode() == Activity.RESULT_OK) {
            GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getContext());
            if (account != null) {
                processAccountAndResolve(call, account);
                return;
            }
        }
        call.reject("Google Drive authorization was cancelled or denied.", String.valueOf(GoogleSignInStatusCodes.SIGN_IN_CANCELLED));
    }

    @PluginMethod
    public void refresh(PluginCall call) {
        try {
            GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getContext());
            if (account == null) {
                call.reject("User not logged in.");
                return;
            }

            executor.execute(() -> {
                try {
                    String scopeStr = "oauth2:https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata profile email";
                    String authToken = null;
                    try {
                        Account androidAccount = account.getAccount();
                        if (androidAccount != null) {
                            authToken = GoogleAuthUtil.getToken(getContext(), androidAccount, scopeStr);
                        } else if (account.getEmail() != null) {
                            authToken = GoogleAuthUtil.getToken(getContext(), account.getEmail(), scopeStr);
                        }
                    } catch (Exception ignored) {}

                    if (authToken == null || authToken.isEmpty()) {
                        authToken = account.getIdToken();
                    }

                    JSObject auth = new JSObject();
                    auth.put("idToken", account.getIdToken());
                    auth.put(FIELD_ACCESS_TOKEN, authToken != null ? authToken : "");
                    auth.put("refreshToken", "");
                    call.resolve(auth);
                } catch (Exception t) {
                    call.reject("Failed refreshing token: " + t.getMessage(), t);
                }
            });
        } catch (Exception t) {
            call.reject("Refresh error: " + t.getMessage(), t);
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            if (googleSignInClient == null) {
                ensureClient(null, null);
            }
            googleSignInClient.signOut()
                    .addOnSuccessListener(getActivity(), aVoid -> call.resolve())
                    .addOnFailureListener(getActivity(), e -> call.reject("Sign out failed", e));
        } catch (Exception t) {
            call.reject("Sign out exception: " + t.getMessage(), t);
        }
    }
}
`;
  fs.writeFileSync(googleAuthJava, robustGoogleAuthCode, 'utf8');
}


