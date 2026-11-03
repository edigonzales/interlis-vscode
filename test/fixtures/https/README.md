This self-signed EC certificate and its public test-only private key are fixtures
for a loopback HTTPS repository, not credentials. The certificate is valid until
October 2046 for localhost and 127.0.0.1. The test explicitly requires TLS 1.2
ECDHE/ECDSA and checks the bundled SunEC provider.

The smoke first checks that the bundled default trust anchors reject this
certificate. A separate PKCS12 test truststore then trusts only this fixture;
the production runtime's truststore remains unchanged. The protocol test also
loads actual repository models over this HTTPS connection.
