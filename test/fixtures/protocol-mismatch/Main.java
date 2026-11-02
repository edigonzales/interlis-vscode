package guru.interlis.lsp;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/** Negative test fixture only: a real Java process advertising an incompatible protocol. */
public final class Main {
    public static void main(String[] args) throws Exception {
        while (true) {
            int length = -1;
            String line;
            while ((line = line()) != null && !line.isEmpty()) {
                if (line.toLowerCase(Locale.ROOT).startsWith("content-length:")) length = Integer.parseInt(line.substring(15).trim());
            }
            if (line == null) return;
            if (length < 0 || length > 8_388_608) throw new IllegalArgumentException("Invalid fixture frame");
            var message = JsonParser.parseString(new String(System.in.readNBytes(length), StandardCharsets.UTF_8)).getAsJsonObject();
            String method = message.has("method") ? message.get("method").getAsString() : "";
            if (method.equals("exit")) return;
            if (!message.has("id")) continue;
            var response = new JsonObject();
            response.addProperty("jsonrpc", "2.0");
            response.add("id", message.get("id"));
            response.add("result", method.equals("initialize")
                ? JsonParser.parseString("{\"capabilities\":{\"textDocumentSync\":1,\"experimental\":{\"interlis\":{\"protocolVersion\":999,\"compile\":true,\"sourceContent\":true}}}}")
                : com.google.gson.JsonNull.INSTANCE);
            byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
            System.out.write(("Content-Length: " + bytes.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
            System.out.write(bytes);
            System.out.flush();
        }
    }
    private static String line() throws Exception {
        var bytes = new ByteArrayOutputStream();
        for (int value; (value = System.in.read()) >= 0;) {
            if (value == '\n') return bytes.toString(StandardCharsets.US_ASCII).replace("\r", "");
            bytes.write(value);
        }
        return null;
    }
}
