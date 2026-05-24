package com.befitlab.app;

import android.os.Bundle;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

public class HealthConnectRationaleActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        new AlertDialog.Builder(this)
            .setTitle(getString(R.string.health_rationale_title))
            .setMessage(getString(R.string.health_rationale_message))
            .setPositiveButton(getString(R.string.health_rationale_ok), (dialog, which) -> finish())
            .setOnDismissListener(d -> finish())
            .show();
    }
}
