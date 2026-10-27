package com.karuhundeveloper.posoffline;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.database.Cursor;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "Documents")
public class DocumentsPlugin extends Plugin {
    private static final int MAX_BYTES = 64 * 1024 * 1024;
    private byte[] pendingBytes;

    @PluginMethod public void pick(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/zip", "application/octet-stream"});
        startActivityForResult(call, intent, "picked");
    }

    @PluginMethod public synchronized void save(PluginCall call) {
        if (pendingBytes != null) { call.reject("Penyimpanan lain sedang berjalan"); return; }
        String name = call.getString("name"), data = call.getString("data");
        if (name == null || data == null || data.length() > (MAX_BYTES * 4L / 3 + 8)) {
            call.reject("Dokumen tidak valid atau terlalu besar"); return;
        }
        try { pendingBytes = Base64.decode(data, Base64.DEFAULT); }
        catch (IllegalArgumentException error) { call.reject("Dokumen tidak valid", error); return; }
        if (pendingBytes.length > MAX_BYTES) { pendingBytes = null; call.reject("Dokumen terlalu besar"); return; }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/zip");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        try { startActivityForResult(call, intent, "saved"); }
        catch (Exception error) { pendingBytes = null; call.reject("Pemilih dokumen tidak tersedia", error); }
    }

    private boolean cancelled(PluginCall call, ActivityResult result) {
        if (call == null) return true;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.resolve(new JSObject().put("cancelled", true)); return true;
        }
        return false;
    }

    @ActivityCallback private void picked(PluginCall call, ActivityResult result) {
        if (cancelled(call, result)) return;
        Uri uri = result.getData().getData();
        new Thread(() -> {
            try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
                if (input == null) throw new java.io.IOException("Dokumen tidak bisa dibuka");
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                byte[] buffer = new byte[16384]; int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > MAX_BYTES) throw new java.io.IOException("Batas cadangan 64 MB");
                    output.write(buffer, 0, count);
                }
                String name = "backup.zip";
                try (Cursor cursor = getContext().getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                    if (cursor != null && cursor.moveToFirst() && !cursor.isNull(0)) name = cursor.getString(0);
                }
                JSObject response = new JSObject();
                response.put("cancelled", false); response.put("name", name);
                response.put("data", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
                call.resolve(response);
            } catch (Exception error) { call.reject("Cadangan tidak bisa dibaca", error); }
        }, "pos-backup-read").start();
    }

    @ActivityCallback private void saved(PluginCall call, ActivityResult result) {
        byte[] bytes = pendingBytes; pendingBytes = null;
        if (cancelled(call, result)) return;
        if (bytes == null) { call.reject("Dokumen kedaluwarsa, ekspor ulang"); return; }
        Uri uri = result.getData().getData();
        new Thread(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new java.io.IOException("Tujuan tidak bisa dibuka");
                output.write(bytes); output.flush();
                call.resolve(new JSObject().put("cancelled", false));
            } catch (Exception error) { call.reject("Cadangan tidak bisa disimpan", error); }
        }, "pos-backup-write").start();
    }
}
