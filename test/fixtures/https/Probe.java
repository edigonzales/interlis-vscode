import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.security.Signature;

// Compiled with the test JDK, executed with the Java extracted from the VSIX.
class Probe {
    public static void main(String[] args) throws Exception {
        if (!Signature.getInstance("SHA256withECDSA").getProvider().getName().equals("SunEC")) {
            throw new AssertionError("Expected the bundled EC provider");
        }
        var response = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build()
            .send(HttpRequest.newBuilder(URI.create(args[0])).timeout(Duration.ofSeconds(10)).build(),
                  HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200 || !response.body().contains("RemoteMiddle")) {
            throw new AssertionError("HTTPS repository index missing");
        }
        System.out.println("Verified ECDHE/ECDSA HTTPS repository with certificate validation");
    }
}
