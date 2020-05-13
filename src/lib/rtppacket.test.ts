import * as rtppacket from './rtppacket';

it('should read the SSRC and payload from the packet', () => {
  const packed = Buffer.from(
    '00000000' +
    '00000000' + // don't care about the first 8 bytes
    '12345678' + // ssrc
    '7061796c' + // payload ...
      '6f6164',
    'hex'
  );
  const packet = rtppacket.unpack(packed);
  expect(packet.header.ssrc).toBe(0x12345678);
  expect(packet.payload.toString()).toBe('payload');
});

it('should store the SSRC and payload in the packet', () => {
  const packet = {
    header: { ssrc: 0x12345678 },
    payload: Buffer.from('payload'),
  };
  expect(packet.payload.toString()).toBe('payload');
  const packed = rtppacket.pack(packet);
  const expected = Buffer.from(
    '00000000' +
    '00000000' + // don't care about the first 8 bytes
    '12345678' + // ssrc
    '7061796c' + // payload ...
      '6f6164',
    'hex'
  );
  expect(packed).toStrictEqual(expected);
});
