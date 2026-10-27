package com.karuhundeveloper.posoffline;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import java.io.File;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class ApkVerifier {
    private static long code(PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }

    @SuppressWarnings("deprecation")
    private static Signature[] signers(PackageInfo info) throws Exception {
        Signature[] result = Build.VERSION.SDK_INT >= 28
            ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
        if (result == null || result.length == 0) throw new Exception("APK tidak memiliki tanda tangan");
        return result;
    }

    @SuppressWarnings("deprecation")
    static void verify(Context context, File apk, String filename) throws Exception {
        Matcher match = Pattern.compile("pos-offline-v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.apk").matcher(filename);
        if (!match.matches()) throw new Exception("Nama APK tidak valid");
        long major = Long.parseLong(match.group(1)), minor = Long.parseLong(match.group(2)), patch = Long.parseLong(match.group(3));
        if (major > 2100 || minor > 999 || patch > 999) throw new Exception("Versi APK di luar batas");
        long expectedCode = major * 1000000 + minor * 1000 + patch;
        String expectedVersion = match.group(1) + "." + match.group(2) + "." + match.group(3);
        PackageManager manager = context.getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo installed = manager.getPackageInfo(context.getPackageName(), flags);
        PackageInfo candidate = manager.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        if (candidate == null || !context.getPackageName().equals(candidate.packageName)) throw new Exception("Identitas APK berbeda");
        if (code(candidate) != expectedCode || !expectedVersion.equals(candidate.versionName) || code(candidate) <= code(installed)) {
            throw new Exception("Versi APK harus lebih baru dan sesuai rilis");
        }
        Signature[] current = signers(installed), next = signers(candidate);
        if (current.length != next.length) throw new Exception("Penanda tangan APK berbeda");
        for (Signature signature : current) {
            boolean found = false;
            for (Signature other : next) if (Arrays.equals(signature.toByteArray(), other.toByteArray())) found = true;
            if (!found) throw new Exception("Penanda tangan APK berbeda");
        }
    }
}
