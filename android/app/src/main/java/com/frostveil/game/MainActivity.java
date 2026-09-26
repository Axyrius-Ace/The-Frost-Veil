package com.frostveil.game;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

/**
 * Fullscreen immersion: hides the phone status bar (battery/wifi/icons) and
 * the system navigation buttons so only the game is visible. Swiping from a
 * screen edge temporarily reveals them (sticky immersion).
 */
public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    hideSystemUI();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) hideSystemUI();
  }

  @Override
  protected void onResume() {
    super.onResume();
    hideSystemUI();
  }

  private void hideSystemUI() {
    if (getWindow() == null) return;
    getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    View decor = getWindow().getDecorView();
    if (decor == null) return;
    decor.setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      | View.SYSTEM_UI_FLAG_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
  }
}
