package com.befitlab.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: el WebView dibuja detrás del status bar y nav bar
        // Permite que env(safe-area-inset-top) funcione correctamente en Android 7+
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
