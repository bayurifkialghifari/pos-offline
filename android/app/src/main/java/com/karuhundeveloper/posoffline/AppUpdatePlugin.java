package com.karuhundeveloper.posoffline;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private final AtomicBoolean busy = new AtomicBoolean(false);

    @PluginMethod public void readChecksum(PluginCall call) {
        new Thread(() -> {
            try { call.resolve(new JSObject().put("text", ReleaseDownload.checksum(call.getString("url")))); }
            catch (Exception error) { call.reject("Checksum tidak bisa diunduh: " + error.getMessage(), error); }
        }, "pos-update-checksum").start();
    }

    @PluginMethod public void downloadAndInstall(PluginCall call) {
        if (!busy.compareAndSet(false, true)) { call.reject("Pembaruan sedang berjalan"); return; }
        String url = call.getString("url"), filename = call.getString("filename"), sha = call.getString("sha256");
        try {
            if (filename == null || !filename.matches("pos-offline-v[0-9]+\\.[0-9]+\\.[0-9]+\\.apk") || sha == null || !sha.matches("[a-f0-9]{64}")) throw new Exception("Data unduhan tidak valid");
            ReleaseDownload.validate(url, filename);
            if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent permission = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(permission);
                busy.set(false); call.resolve(new JSObject().put("status", "permission_required")); return;
            }
        } catch (Exception error) { busy.set(false); call.reject(error.getMessage(), error); return; }
        new Thread(() -> {
            File directory = new File(getContext().getCacheDir(), "updates");
            File partial = new File(directory, "update.part"), apk = new File(directory, "update.apk");
            try {
                if (!directory.exists() && !directory.mkdirs()) throw new Exception("Folder unduhan tidak bisa dibuat");
                String actual;
                try (FileOutputStream output = new FileOutputStream(partial)) {
                    actual = ReleaseDownload.transfer(url, output, 100 * 1024 * 1024);
                    output.getFD().sync();
                }
                if (!sha.equals(actual)) throw new Exception("Checksum APK tidak cocok");
                ApkVerifier.verify(getContext(), partial, filename);
                if (apk.exists() && !apk.delete()) throw new Exception("Unduhan lama tidak bisa dihapus");
                if (!partial.renameTo(apk)) throw new Exception("Unduhan tidak bisa disimpan");
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                getActivity().runOnUiThread(() -> {
                    try {
                        Intent installer = new Intent(Intent.ACTION_VIEW);
                        installer.setDataAndType(uri, "application/vnd.android.package-archive");
                        installer.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        getActivity().startActivity(installer);
                        call.resolve(new JSObject().put("status", "install_started"));
                    } catch (Exception error) { call.reject("Pemasang Android tidak tersedia", error); }
                    finally { busy.set(false); }
                });
            } catch (Exception error) {
                if (partial.exists()) partial.delete();
                busy.set(false); call.reject("Pembaruan gagal: " + error.getMessage(), error);
            }
        }, "pos-update-apk").start();
    }
}
