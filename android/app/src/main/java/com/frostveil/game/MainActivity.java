package com.frostveil.game;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override protected void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); hideSystemUI(); }
  @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus) hideSystemUI(); }
  @Override public void onResume() { super.onResume(); hideSystemUI(); }
  @Override public void onBackPressed() {
    WebView webView = bridge != null ? bridge.getWebView() : null;
    if (webView != null) webView.evaluateJavascript("window.dispatchEvent(new Event('frost-back'));", null);
    else super.onBackPressed();
  }
  private void hideSystemUI() { Window window = getWindow(); if (window == null) return; window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN); window.setStatusBarColor(0x00000000); window.setNavigationBarColor(0x00000000); window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS); View decor = window.getDecorView(); if (decor == null) return; if (android.os.Build.VERSION.SDK_INT >= 30) { WindowInsetsController controller = decor.getWindowInsetsController(); if (controller != null) { controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars() | WindowInsets.Type.displayCutout()); controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE); } } decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE); }
}
