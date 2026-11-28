package com.trenscends.travelplanner;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.FileProvider;

import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    private String pendingExportContent = null;
    private String pendingExportFilename = "export.json";
    private String pendingExportMimeType = "application/json";
    private ActivityResultLauncher<Intent> createDocumentLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        setTheme(R.style.AppTheme_NoActionBar);
        EdgeToEdge.enable(this);

        createDocumentLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null && pendingExportContent != null) {
                        try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                            if (os != null) {
                                os.write(pendingExportContent.getBytes(StandardCharsets.UTF_8));
                                os.flush();
                                Toast.makeText(this, "Saved " + pendingExportFilename, Toast.LENGTH_SHORT).show();
                            }
                        } catch (Exception e) {
                            Toast.makeText(this, "Save failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    }
                }
                pendingExportContent = null;
            }
        );

        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.parseColor("#0f172a")));
        if (getWindow().getDecorView() != null) {
            getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0f172a"));
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidNativeExportBridge(), "AndroidNativeExport");
        }
    }

    private class AndroidNativeExportBridge {
        @JavascriptInterface
        public void saveFile(String filename, String content, String mimeType) {
            runOnUiThread(() -> {
                pendingExportFilename = (filename != null && !filename.trim().isEmpty()) ? filename.trim() : "export.json";
                pendingExportContent = content != null ? content : "";
                pendingExportMimeType = (mimeType != null && !mimeType.trim().isEmpty()) ? mimeType.trim() : "application/octet-stream";

                try {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(pendingExportMimeType);
                    intent.putExtra(Intent.EXTRA_TITLE, pendingExportFilename);
                    createDocumentLauncher.launch(intent);
                } catch (Exception e) {
                    shareFallbackFile(pendingExportFilename, pendingExportContent, pendingExportMimeType);
                }
            });
        }

        @JavascriptInterface
        public void printPage(String jobName) {
            runOnUiThread(() -> {
                try {
                    WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                    if (webView == null) return;
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager == null) return;
                    String safeJobName = (jobName != null && !jobName.trim().isEmpty()) ? jobName.trim() : "Travel Itinerary";
                    printManager.print(safeJobName, webView.createPrintDocumentAdapter(safeJobName), new PrintAttributes.Builder().build());
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Print unavailable: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void shareFallbackFile(String filename, String content, String mimeType) {
        try {
            File cacheFile = new File(getCacheDir(), filename);
            try (FileOutputStream fos = new FileOutputStream(cacheFile)) {
                fos.write(content.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", cacheFile);
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType(mimeType);
            shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(shareIntent, "Export " + filename));
        } catch (Exception ex) {
            Toast.makeText(this, "Export failed: " + ex.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
