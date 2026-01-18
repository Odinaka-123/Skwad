class Peer {
  final String skwadId;
  final String deviceCode;
  final String ip;
  final int port;

  Peer({
    required this.skwadId,
    required this.deviceCode,
    required this.ip,
    required this.port,
  });

  factory Peer.fromJson(Map<String, dynamic> json) {
    return Peer(
      skwadId: json['skwadId'],
      deviceCode: json['deviceCode'],
      ip: json['ip'],
      port: json['port'],
    );
  }
}
