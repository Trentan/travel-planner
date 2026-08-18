package com.trenscends.travelplanner;

import android.os.Bundle;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        setTheme(R.style.AppTheme_NoActionBar);
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.parseColor("#0f172a")));
        if (getWindow().getDecorView() != null) {
            getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0f172a"));
        }
    }
}
