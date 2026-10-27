package com.karuhundeveloper.posoffline;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;

final class ReleaseDownload {
    private static final String PREFIX = "https://github.com/bayurifkialghifari/pos-offline/releases/download/";

    static void validate(String address, String filename) throws Exception {
        if (address == null || filename == null || !address.startsWith(PREFIX)) throw new Exception("Alamat rilis tidak valid");
        String suffix = address.substring(PREFIX.length());
        if (!suffix.matches("v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)/" + java.util.regex.Pattern.quote(filename))) {
            throw new Exception("Aset tidak berasal dari rilis POS Offline");
        }
    }

    private static boolean permitted(URL url) {
        String host = url.getHost();
        return "https".equals(url.getProtocol()) && (url.getPort() == -1 || url.getPort() == 443)
            && url.getUserInfo() == null && (host.equals("github.com") || host.equals("release-assets.githubusercontent.com") || host.equals("objects.githubusercontent.com"));
    }

    static String transfer(String address, OutputStream output, int limit) throws Exception {
        URL url = new URL(address);
        for (int redirects = 0; redirects <= 5; redirects++) {
            if (!permitted(url)) throw new Exception("Pengalihan unduhan tidak diizinkan");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15000); connection.setReadTimeout(30000);
            connection.setRequestProperty("Accept", "application/octet-stream");
            connection.setRequestProperty("User-Agent", "POS-Offline-Android");
            try {
                int status = connection.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String target = connection.getHeaderField("Location");
                    if (target == null) throw new Exception("Alamat pengalihan kosong");
                    url = new URL(url, target); continue;
                }
                if (status != 200 || connection.getContentLengthLong() > limit) throw new Exception("Unduhan gagal atau terlalu besar");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                try (InputStream input = connection.getInputStream()) {
                    byte[] buffer = new byte[16384]; int count, total = 0;
                    while ((count = input.read(buffer)) != -1) {
                        if (count > limit - total) throw new Exception("Unduhan melebihi batas ukuran");
                        total += count; digest.update(buffer, 0, count); output.write(buffer, 0, count);
                    }
                    if (total == 0) throw new Exception("Unduhan kosong");
                }
                StringBuilder hex = new StringBuilder();
                for (byte value : digest.digest()) hex.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
                return hex.toString();
            } finally { connection.disconnect(); }
        }
        throw new Exception("Terlalu banyak pengalihan unduhan");
    }

    static String checksum(String address) throws Exception {
        validate(address, "SHA256SUMS.txt");
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        transfer(address, bytes, 16384);
        return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
    }
}
