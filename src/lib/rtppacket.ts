export interface RtpHeader {
  ssrc: number; // 32 bit
}

export interface RtpPacket {
  header: RtpHeader,
  payload: Buffer
}

export function pack(packet: RtpPacket) {
  const packed = Buffer.alloc(12 + packet.payload.length);
  packed.writeUInt32BE(packet.header.ssrc, 8);
  packet.payload.copy(packed, 12);
  return packed;
}

export function unpack(packed) {
  const header = {
    ssrc: packed.readUInt32BE(8),
  };
  const payload = packed.slice(12);
  return { header, payload };
}
